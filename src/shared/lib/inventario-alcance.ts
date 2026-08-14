"use server";

import type { Bodega, Centro } from "@prisma/client";

// config
import { ROL_ADMINISTRADOR } from "@/config/auth";

// lib
import { prisma } from "@/shared/lib/prisma";
import { requireSessionUser, type SessionUser } from "@/shared/lib/auth";

export interface InventarioFiltrosInput {
    centroId?: string;
    bodegaId?: string;
}

export interface InventarioAlcance {
    usuario: SessionUser;
    centros: Centro[];
    bodegas: Bodega[];
    centroId: string | null;
    bodegaId: string | null;
    centroIds: string[];
    bodegaIds: string[];
    puedeFiltrarCentro: boolean;
}

const ROLES_BODEGAS_ASOCIADAS = ["R03", "R06", "R07"] as const;

export async function obtenerAlcanceInventario(filtros: InventarioFiltrosInput = {}): Promise<InventarioAlcance> {
    const usuario = await requireSessionUser();

    if (usuario.rol === ROL_ADMINISTRADOR) {
        return obtenerAlcanceAdministrador(usuario, filtros);
    }

    if (usuario.rol === "R02") {
        return obtenerAlcanceCentro(usuario, filtros);
    }

    if (ROLES_BODEGAS_ASOCIADAS.includes(usuario.rol as (typeof ROLES_BODEGAS_ASOCIADAS)[number])) {
        return obtenerAlcanceBodegasAsociadas(usuario, filtros);
    }

    return {
        usuario,
        centros: [],
        bodegas: [],
        centroId: null,
        bodegaId: null,
        centroIds: [],
        bodegaIds: [],
        puedeFiltrarCentro: false
    };
}

export async function validarCentroBodegaEnAlcance(centroId: string, bodegaId: string): Promise<void> {
    const alcance = await obtenerAlcanceInventario({ centroId, bodegaId });

    if (!alcance.centroIds.includes(centroId) || !alcance.bodegaIds.includes(bodegaId)) {
        throw new Error("No tienes permiso para operar en el centro o bodega seleccionada.");
    }

    const bodega = alcance.bodegas.find((item) => item.id === bodegaId);
    if (!bodega || bodega.centroId !== centroId) {
        throw new Error("La bodega seleccionada no pertenece al centro indicado.");
    }
}

async function obtenerAlcanceAdministrador(usuario: SessionUser, filtros: InventarioFiltrosInput): Promise<InventarioAlcance> {
    const centros = await prisma.centro.findMany({ where: { estado: true }, orderBy: { nombre: "asc" } });
    const centroId = normalizarSeleccion(filtros.centroId, centros.map((centro) => centro.id));
    const bodegas = await prisma.bodega.findMany({
        where: {
            estado: true,
            ...(centroId ? { centroId } : {})
        },
        orderBy: { nombre: "asc" }
    });
    const bodegaId = normalizarSeleccion(filtros.bodegaId, bodegas.map((bodega) => bodega.id));

    return crearAlcance({
        usuario,
        centros,
        bodegas,
        centroId,
        bodegaId,
        centroIds: centroId ? [centroId] : centros.map((centro) => centro.id),
        puedeFiltrarCentro: true
    });
}

async function obtenerAlcanceCentro(usuario: SessionUser, filtros: InventarioFiltrosInput): Promise<InventarioAlcance> {
    const [centro, bodegas] = await Promise.all([
        prisma.centro.findFirst({ where: { id: usuario.centroId, estado: true } }),
        prisma.bodega.findMany({ where: { centroId: usuario.centroId, estado: true }, orderBy: { nombre: "asc" } })
    ]);
    const centros = centro ? [centro] : [];
    const bodegaId = normalizarSeleccion(filtros.bodegaId, bodegas.map((bodega) => bodega.id));

    return crearAlcance({
        usuario,
        centros,
        bodegas,
        centroId: usuario.centroId,
        bodegaId,
        centroIds: centros.map((item) => item.id),
        puedeFiltrarCentro: false
    });
}

async function obtenerAlcanceBodegasAsociadas(usuario: SessionUser, filtros: InventarioFiltrosInput): Promise<InventarioAlcance> {
    const [centro, encargos] = await Promise.all([
        prisma.centro.findFirst({ where: { id: usuario.centroId, estado: true } }),
        prisma.encargadosBodega.findMany({
            where: {
                encargadoId: usuario.id,
                centroId: usuario.centroId,
                bodega: { estado: true }
            },
            include: { bodega: true },
            orderBy: { bodega: { nombre: "asc" } }
        })
    ]);
    const centros = centro ? [centro] : [];
    const bodegas = encargos.map((encargo) => encargo.bodega);
    const bodegaId = normalizarSeleccion(filtros.bodegaId, bodegas.map((bodega) => bodega.id));

    return crearAlcance({
        usuario,
        centros,
        bodegas,
        centroId: usuario.centroId,
        bodegaId,
        centroIds: centros.map((item) => item.id),
        puedeFiltrarCentro: false
    });
}

function crearAlcance(input: {
    usuario: SessionUser;
    centros: Centro[];
    bodegas: Bodega[];
    centroId: string | null;
    bodegaId: string | null;
    centroIds: string[];
    puedeFiltrarCentro: boolean;
}): InventarioAlcance {
    return {
        ...input,
        bodegaIds: input.bodegaId ? [input.bodegaId] : input.bodegas.map((bodega) => bodega.id)
    };
}

function normalizarSeleccion(value: string | undefined, permitidos: string[]): string | null {
    if (!value || value === "todos") {
        return null;
    }

    return permitidos.includes(value) ? value : null;
}

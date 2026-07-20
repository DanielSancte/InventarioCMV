"use server";

import { revalidatePath } from "next/cache";

// lib
import { puedeAdministrar, requireSessionUser } from "@/shared/lib/auth";
import { AuditLogger } from "@/shared/lib/logger";
import { prisma } from "@/shared/lib/prisma";

// schemas
import { bodegaSchema, centroSchema, unidadSchema, usuarioSchema } from "@/modules/configuraciones/schemas/configuracion.schema";

// types
import type { ActionState } from "@/shared/types/action-state";

export async function listarConfiguraciones() {
    const [centros, bodegas, roles, usuarios, unidades] = await Promise.all([
        prisma.centro.findMany({ orderBy: { nombre: "asc" } }),
        prisma.bodega.findMany({ include: { centro: true }, orderBy: { nombre: "asc" } }),
        prisma.rol.findMany({ orderBy: { id: "asc" } }),
        prisma.usuario.findMany({ include: { rol: true, centro: true, bodega: true }, orderBy: { nombre: "asc" } }),
        prisma.unidad.findMany({ orderBy: { descripcion: "asc" } })
    ]);

    return { centros, bodegas, roles, usuarios, unidades };
}

export async function crearCentro(prevState: ActionState, formData: FormData): Promise<ActionState> {
    return ejecutarAdmin("Centro", "/configuraciones", async (usuarioId) => {
        const parsed = centroSchema.parse({
            nombre: formData.get("nombre"),
            estado: formData.get("estado") === "on"
        });
        const centro = await prisma.centro.create({ data: parsed });
        await AuditLogger.log({ usuarioId, accion: "crear", entidad: "Centro", entidadId: centro.id });
        return "Centro creado.";
    });
}

export async function crearBodega(prevState: ActionState, formData: FormData): Promise<ActionState> {
    return ejecutarAdmin("Bodega", "/configuraciones", async (usuarioId) => {
        const parsed = bodegaSchema.parse({
            nombre: formData.get("nombre"),
            centroId: formData.get("centroId"),
            estado: formData.get("estado") === "on"
        });
        const bodega = await prisma.bodega.create({ data: parsed });
        await AuditLogger.log({ usuarioId, accion: "crear", entidad: "Bodega", entidadId: bodega.id });
        return "Bodega creada.";
    });
}

export async function crearUnidad(prevState: ActionState, formData: FormData): Promise<ActionState> {
    return ejecutarAdmin("Unidad", "/configuraciones", async (usuarioId) => {
        const parsed = unidadSchema.parse({ descripcion: formData.get("descripcion") });
        const unidad = await prisma.unidad.create({ data: parsed });
        await AuditLogger.log({ usuarioId, accion: "crear", entidad: "Unidad", entidadId: unidad.id });
        return "Unidad creada.";
    });
}

export async function crearUsuario(prevState: ActionState, formData: FormData): Promise<ActionState> {
    return ejecutarAdmin("Usuario", "/configuraciones", async (usuarioId) => {
        const parsed = usuarioSchema.parse({
            nombre: formData.get("nombre"),
            apPaterno: formData.get("apPaterno"),
            apMaterno: formData.get("apMaterno")?.toString() || undefined,
            rolId: formData.get("rolId"),
            centroId: formData.get("centroId"),
            bodegaId: formData.get("bodegaId")?.toString() || undefined,
            telefono: formData.get("telefono")?.toString() || undefined,
            email: formData.get("email"),
            estado: formData.get("estado") === "on"
        });
        const usuario = await prisma.usuario.create({ data: parsed });
        await AuditLogger.log({ usuarioId, accion: "crear", entidad: "Usuario", entidadId: usuario.id });
        return "Usuario creado.";
    });
}

async function ejecutarAdmin(
    entidad: string,
    path: string,
    handler: (usuarioId: string) => Promise<string>
): Promise<ActionState> {
    try {
        const user = await requireSessionUser();
        if (!puedeAdministrar(user.rol)) {
            return { ok: false, message: `Solo administradores pueden modificar ${entidad}.` };
        }

        const message = await handler(user.id);
        revalidatePath(path);
        return { ok: true, message };
    } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : `No se pudo guardar ${entidad}.` };
    }
}

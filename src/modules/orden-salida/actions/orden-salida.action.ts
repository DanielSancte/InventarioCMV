"use server";

import { revalidatePath } from "next/cache";
import type { PrismaClient } from "@prisma/client";

// lib
import { requireSessionUser, puedeOperarSalida } from "@/shared/lib/auth";
import { AuditLogger } from "@/shared/lib/logger";
import { prisma } from "@/shared/lib/prisma";

// schemas
import { crearOrdenSalidaSchema, ordenSalidaDetalleSchema } from "@/modules/orden-salida/schemas/orden-salida.schema";

// types
import type { ActionState } from "@/shared/types/action-state";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

interface DetalleSalidaForm {
    productoId: number;
    cantidad: number;
    lote: string;
    fechaCaducidad: Date;
}

export async function listarOrdenesSalida() {
    return prisma.ordenSalida.findMany({
        include: {
            usuario: true,
            centro: true,
            bodega: true,
            detalles: {
                include: { producto: true }
            }
        },
        orderBy: { fecha: "desc" }
    });
}

export async function crearOrdenSalida(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        const user = await requireSessionUser();
        if (!puedeOperarSalida(user.rol)) {
            return { ok: false, message: "No tienes permiso para registrar salidas." };
        }

        const parsed = crearOrdenSalidaSchema.parse({
            fecha: formData.get("fecha"),
            bodegaId: formData.get("bodegaId"),
            centroId: formData.get("centroId"),
            tipoSalida: formData.get("tipoSalida"),
            destino: formData.get("destino"),
            codigoSalida: formData.get("codigoSalida")?.toString() || undefined,
            correoDestino: formData.get("correoDestino")?.toString() || undefined,
            detalles: leerDetallesSalida(formData)
        });

        const orden = await prisma.$transaction(async (tx) => {
            const nuevaOrden = await tx.ordenSalida.create({
                data: {
                    fecha: parsed.fecha,
                    usuarioId: user.id,
                    bodegaId: parsed.bodegaId,
                    tipoSalida: parsed.tipoSalida,
                    centroId: parsed.centroId,
                    destino: parsed.destino,
                    codigoSalida: parsed.codigoSalida,
                    correoDestino: parsed.correoDestino || null
                }
            });

            for (const detalle of parsed.detalles) {
                await descontarStock(tx, {
                    productoId: detalle.productoId,
                    bodegaId: parsed.bodegaId,
                    cantidad: detalle.cantidad,
                    lote: detalle.lote,
                    fechaCaducidad: detalle.fechaCaducidad
                });
                await tx.ordenSalidaDetalle.create({
                    data: {
                        ...detalle,
                        ordenSalidaId: nuevaOrden.id
                    }
                });
            }

            return nuevaOrden;
        });

        await AuditLogger.log({
            usuarioId: user.id,
            accion: "crear",
            entidad: "OrdenSalida",
            entidadId: orden.id,
            detalle: { detalles: parsed.detalles.length }
        });

        revalidatePath("/");
        revalidatePath("/stock");
        revalidatePath("/orden-salida");
        revalidatePath("/reporte");
        return { ok: true, message: "Orden de salida registrada." };
    } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : "No se pudo registrar la salida." };
    }
}

export async function actualizarDetalleSalida(detalleId: string, formData: FormData): Promise<ActionState> {
    try {
        const user = await requireSessionUser();
        if (!puedeOperarSalida(user.rol)) {
            return { ok: false, message: "No tienes permiso para editar salidas." };
        }

        const parsed = ordenSalidaDetalleSchema.parse({
            productoId: formData.get("productoId"),
            cantidad: formData.get("cantidad"),
            lote: formData.get("lote"),
            fechaCaducidad: formData.get("fechaCaducidad")
        });

        await prisma.$transaction(async (tx) => {
            const previo = await tx.ordenSalidaDetalle.findUniqueOrThrow({
                where: { id: detalleId },
                include: { ordenSalida: true }
            });
            await devolverStock(tx, {
                productoId: previo.productoId,
                bodegaId: previo.ordenSalida.bodegaId,
                cantidad: previo.cantidad,
                lote: previo.lote,
                fechaCaducidad: previo.fechaCaducidad
            });
            await descontarStock(tx, {
                productoId: parsed.productoId,
                bodegaId: previo.ordenSalida.bodegaId,
                cantidad: parsed.cantidad,
                lote: parsed.lote,
                fechaCaducidad: parsed.fechaCaducidad
            });
            await tx.ordenSalidaDetalle.update({ where: { id: detalleId }, data: parsed });
        });

        await AuditLogger.log({ usuarioId: user.id, accion: "actualizar", entidad: "OrdenSalidaDetalle", entidadId: detalleId });
        revalidatePath("/stock");
        revalidatePath("/orden-salida");
        revalidatePath("/reporte");
        return { ok: true, message: "Detalle de salida actualizado." };
    } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : "No se pudo actualizar el detalle." };
    }
}

export async function eliminarDetalleSalida(detalleId: string): Promise<ActionState> {
    try {
        const user = await requireSessionUser();
        if (!puedeOperarSalida(user.rol)) {
            return { ok: false, message: "No tienes permiso para eliminar salidas." };
        }

        await prisma.$transaction(async (tx) => {
            const detalle = await tx.ordenSalidaDetalle.findUniqueOrThrow({
                where: { id: detalleId },
                include: { ordenSalida: true }
            });
            await devolverStock(tx, {
                productoId: detalle.productoId,
                bodegaId: detalle.ordenSalida.bodegaId,
                cantidad: detalle.cantidad,
                lote: detalle.lote,
                fechaCaducidad: detalle.fechaCaducidad
            });
            await tx.ordenSalidaDetalle.delete({ where: { id: detalleId } });
        });

        await AuditLogger.log({ usuarioId: user.id, accion: "eliminar", entidad: "OrdenSalidaDetalle", entidadId: detalleId });
        revalidatePath("/stock");
        revalidatePath("/orden-salida");
        revalidatePath("/reporte");
        return { ok: true, message: "Detalle de salida eliminado." };
    } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : "No se pudo eliminar el detalle." };
    }
}

function leerDetallesSalida(formData: FormData): DetalleSalidaForm[] {
    const productos = formData.getAll("productoId");
    const cantidades = formData.getAll("cantidad");
    const lotes = formData.getAll("lote");
    const caducidades = formData.getAll("fechaCaducidad");

    return productos.map((productoId, index) => ({
        productoId: Number(productoId),
        cantidad: Number(cantidades[index]),
        lote: lotes[index]?.toString() ?? "",
        fechaCaducidad: new Date(caducidades[index]?.toString() ?? "")
    }));
}

async function descontarStock(
    tx: Tx,
    input: { productoId: number; bodegaId: string; cantidad: number; lote: string; fechaCaducidad: Date }
): Promise<void> {
    const stock = await tx.stock.findUnique({
        where: {
            stock_lote_unico: {
                productoId: input.productoId,
                bodegaId: input.bodegaId,
                lote: input.lote,
                fechaCaducidad: input.fechaCaducidad
            }
        }
    });

    if (!stock || stock.cantidadDisponible < input.cantidad) {
        throw new Error("Stock insuficiente para el producto, lote y bodega seleccionados.");
    }

    await tx.stock.update({
        where: { id: stock.id },
        data: {
            cantidadDisponible: { decrement: input.cantidad },
            fechaUltimaActualizacion: new Date()
        }
    });
}

async function devolverStock(
    tx: Tx,
    input: { productoId: number; bodegaId: string; cantidad: number; lote: string; fechaCaducidad: Date }
): Promise<void> {
    await tx.stock.upsert({
        where: {
            stock_lote_unico: {
                productoId: input.productoId,
                bodegaId: input.bodegaId,
                lote: input.lote,
                fechaCaducidad: input.fechaCaducidad
            }
        },
        update: {
            cantidadDisponible: { increment: input.cantidad },
            fechaUltimaActualizacion: new Date()
        },
        create: {
            productoId: input.productoId,
            bodegaId: input.bodegaId,
            cantidadDisponible: input.cantidad,
            stockMinimo: 0,
            lote: input.lote,
            fechaCaducidad: input.fechaCaducidad,
            fechaUltimaActualizacion: new Date()
        }
    });
}

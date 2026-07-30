"use server";

import { revalidatePath } from "next/cache";
import type { PrismaClient } from "@prisma/client";

// lib
import { requireSessionUser, puedeOperarEntrada } from "@/shared/lib/auth";
import { AuditLogger } from "@/shared/lib/logger";
import { prisma } from "@/shared/lib/prisma";

// schemas
import { crearOrdenEntradaSchema, ordenEntradaDetalleFormSchema } from "@/modules/orden-entrada/schemas/orden-entrada.schema";

// types
import type { ActionState } from "@/shared/types/action-state";

type Tx = Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends">;

interface DetalleEntradaForm {
    productoId: number;
    fechaCaducidad: Date;
    cantidad: number;
    lote: string;
}

export async function listarOrdenesEntrada() {
    return prisma.ordenEntrada.findMany({
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

export async function crearOrdenEntrada(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        const user = await requireSessionUser();
        if (!puedeOperarEntrada(user.rol)) {
            return { ok: false, message: "No tienes permiso para registrar entradas." };
        }

        const parsed = crearOrdenEntradaSchema.parse({
            fecha: formData.get("fecha"),
            origen: formData.get("origen"),
            guiaDespacho: formData.get("guiaDespacho")?.toString() || undefined,
            centroId: formData.get("centroId"),
            bodegaId: formData.get("bodegaId"),
            codigoRecepcion: formData.get("codigoRecepcion")?.toString() || undefined,
            detalles: leerDetallesEntrada(formData)
        });
        const categoriasPorProducto = await obtenerCategoriasProductos(parsed.detalles.map((detalle) => detalle.productoId));

        const orden = await prisma.$transaction(async (tx) => {
            const nuevaOrden = await tx.ordenEntrada.create({
                data: {
                    fecha: parsed.fecha,
                    usuarioId: user.id,
                    origen: parsed.origen,
                    guiaDespacho: parsed.guiaDespacho,
                    centroId: parsed.centroId,
                    bodegaId: parsed.bodegaId,
                    codigoRecepcion: parsed.codigoRecepcion
                }
            });

            for (const detalle of parsed.detalles) {
                const categoria = categoriasPorProducto.get(detalle.productoId);
                if (!categoria) {
                    throw new Error("Uno de los productos seleccionados no existe o esta inactivo.");
                }
                await tx.ordenEntradaDetalle.create({
                    data: {
                        ...detalle,
                        categoria,
                        ordenEntradaId: nuevaOrden.id
                    }
                });
                await aplicarEntradaStock(tx, {
                    productoId: detalle.productoId,
                    bodegaId: parsed.bodegaId,
                    cantidad: detalle.cantidad,
                    lote: detalle.lote,
                    fechaCaducidad: detalle.fechaCaducidad
                });
            }

            return nuevaOrden;
        });

        await AuditLogger.log({
            usuarioId: user.id,
            accion: "crear",
            entidad: "OrdenEntrada",
            entidadId: orden.id,
            detalle: { detalles: parsed.detalles.length }
        });

        revalidatePath("/");
        revalidatePath("/stock");
        revalidatePath("/orden-entrada");
        return { ok: true, message: "Orden de entrada registrada." };
    } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : "No se pudo registrar la entrada." };
    }
}

export async function actualizarDetalleEntrada(detalleId: string, formData: FormData): Promise<ActionState> {
    try {
        const user = await requireSessionUser();
        if (!puedeOperarEntrada(user.rol)) {
            return { ok: false, message: "No tienes permiso para editar entradas." };
        }

        const parsed = ordenEntradaDetalleFormSchema.parse({
            productoId: formData.get("productoId"),
            fechaCaducidad: formData.get("fechaCaducidad"),
            cantidad: formData.get("cantidad"),
            lote: formData.get("lote")
        });
        const categoriasPorProducto = await obtenerCategoriasProductos([parsed.productoId]);
        const categoria = categoriasPorProducto.get(parsed.productoId);
        if (!categoria) {
            return { ok: false, message: "El producto seleccionado no existe o esta inactivo." };
        }

        await prisma.$transaction(async (tx) => {
            const previo = await tx.ordenEntradaDetalle.findUniqueOrThrow({
                where: { id: detalleId },
                include: { ordenEntrada: true }
            });
            await revertirEntradaStock(tx, {
                productoId: previo.productoId,
                bodegaId: previo.ordenEntrada.bodegaId,
                cantidad: previo.cantidad,
                lote: previo.lote,
                fechaCaducidad: previo.fechaCaducidad
            });
            await tx.ordenEntradaDetalle.update({ where: { id: detalleId }, data: { ...parsed, categoria } });
            await aplicarEntradaStock(tx, {
                productoId: parsed.productoId,
                bodegaId: previo.ordenEntrada.bodegaId,
                cantidad: parsed.cantidad,
                lote: parsed.lote,
                fechaCaducidad: parsed.fechaCaducidad
            });
        });

        await AuditLogger.log({ usuarioId: user.id, accion: "actualizar", entidad: "OrdenEntradaDetalle", entidadId: detalleId });
        revalidatePath("/stock");
        revalidatePath("/orden-entrada");
        return { ok: true, message: "Detalle de entrada actualizado." };
    } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : "No se pudo actualizar el detalle." };
    }
}

export async function eliminarDetalleEntrada(detalleId: string): Promise<ActionState> {
    try {
        const user = await requireSessionUser();
        if (!puedeOperarEntrada(user.rol)) {
            return { ok: false, message: "No tienes permiso para eliminar entradas." };
        }

        await prisma.$transaction(async (tx) => {
            const detalle = await tx.ordenEntradaDetalle.findUniqueOrThrow({
                where: { id: detalleId },
                include: { ordenEntrada: true }
            });
            await revertirEntradaStock(tx, {
                productoId: detalle.productoId,
                bodegaId: detalle.ordenEntrada.bodegaId,
                cantidad: detalle.cantidad,
                lote: detalle.lote,
                fechaCaducidad: detalle.fechaCaducidad
            });
            await tx.ordenEntradaDetalle.delete({ where: { id: detalleId } });
        });

        await AuditLogger.log({ usuarioId: user.id, accion: "eliminar", entidad: "OrdenEntradaDetalle", entidadId: detalleId });
        revalidatePath("/stock");
        revalidatePath("/orden-entrada");
        return { ok: true, message: "Detalle de entrada eliminado." };
    } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : "No se pudo eliminar el detalle." };
    }
}

function leerDetallesEntrada(formData: FormData): DetalleEntradaForm[] {
    const productos = formData.getAll("productoId");
    const cantidades = formData.getAll("cantidad");
    const lotes = formData.getAll("lote");
    const caducidades = formData.getAll("fechaCaducidad");

    return productos.map((productoId, index) => ({
        productoId: Number(productoId),
        fechaCaducidad: new Date(caducidades[index]?.toString() ?? ""),
        cantidad: Number(cantidades[index]),
        lote: lotes[index]?.toString() ?? ""
    }));
}

async function obtenerCategoriasProductos(productoIds: number[]): Promise<Map<number, string>> {
    const productos = await prisma.producto.findMany({
        where: {
            id: { in: [...new Set(productoIds)] },
            estado: true
        },
        select: {
            id: true,
            linea: true
        }
    });

    return new Map(productos.map((producto) => [producto.id, producto.linea]));
}

async function aplicarEntradaStock(
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

async function revertirEntradaStock(
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
        throw new Error("No se puede revertir la entrada porque el stock ya fue consumido.");
    }

    await tx.stock.update({
        where: { id: stock.id },
        data: {
            cantidadDisponible: { decrement: input.cantidad },
            fechaUltimaActualizacion: new Date()
        }
    });
}

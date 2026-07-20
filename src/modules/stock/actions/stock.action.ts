"use server";

// lib
import { prisma } from "@/shared/lib/prisma";

export async function listarStock() {
    return prisma.stock.findMany({
        include: {
            producto: true,
            bodega: {
                include: {
                    centro: true
                }
            }
        },
        orderBy: [
            { bodega: { nombre: "asc" } },
            { producto: { descripcion: "asc" } },
            { fechaCaducidad: "asc" }
        ]
    });
}

"use server";

import { revalidatePath } from "next/cache";

// lib
import { puedeAdministrar, requireSessionUser } from "@/shared/lib/auth";
import { AuditLogger } from "@/shared/lib/logger";
import { prisma } from "@/shared/lib/prisma";

// schemas
import { productoSchema } from "@/modules/productos/schemas/producto.schema";

// types
import type { ActionState } from "@/shared/types/action-state";

export async function listarProductos() {
    return prisma.producto.findMany({
        orderBy: [{ linea: "asc" }, { descripcion: "asc" }]
    });
}

export async function crearProducto(prevState: ActionState, formData: FormData): Promise<ActionState> {
    try {
        const user = await requireSessionUser();
        if (!puedeAdministrar(user.rol)) {
            return { ok: false, message: "Solo administradores pueden crear productos." };
        }

        const parsed = productoSchema.parse({
            linea: formData.get("linea"),
            descripcion: formData.get("descripcion"),
            estado: formData.get("estado") === "on"
        });

        const producto = await prisma.producto.create({ data: parsed });
        await AuditLogger.log({ usuarioId: user.id, accion: "crear", entidad: "Producto", entidadId: String(producto.id) });
        revalidatePath("/productos");
        return { ok: true, message: "Producto creado." };
    } catch (error) {
        return { ok: false, message: error instanceof Error ? error.message : "No se pudo crear el producto." };
    }
}


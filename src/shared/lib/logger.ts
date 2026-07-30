// lib
import type { Prisma } from "@prisma/client";
import { prisma } from "@/shared/lib/prisma";

export interface AuditInput {
    usuarioId?: string;
    accion: string;
    entidad: string;
    entidadId?: string;
    detalle?: Prisma.InputJsonValue;
}

export class AuditLogger {
    static async log(input: AuditInput): Promise<void> {
        await prisma.log.create({
            data: {
                usuarioId: input.usuarioId,
                accion: input.accion,
                entidad: input.entidad,
                entidadId: input.entidadId,
                detalle: input.detalle
            }
        });
    }
}

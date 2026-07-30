// lib
import { prisma } from "@/shared/lib/prisma";

export interface SessionUser {
    id: string;
    nombre: string;
    apPaterno: string;
    email: string;
    rol: string;
    centroId: string;
    bodegaId: string | null;
}

export async function requireSessionUser(): Promise<SessionUser> {
    const email = process.env.DEMO_USER_EMAIL ?? "admin@cmv.local";
    const usuario = await prisma.usuario.findUnique({
        where: { email },
        select: {
            id: true,
            nombre: true,
            apPaterno: true,
            email: true,
            rolId: true,
            centroId: true,
            bodegaId: true,
            estado: true
        }
    });

    if (!usuario || !usuario.estado) {
        throw new Error("Usuario demo no encontrado o inactivo. Ejecuta npm run db:seed.");
    }

    return {
        id: usuario.id,
        nombre: usuario.nombre,
        apPaterno: usuario.apPaterno ?? "",
        email: usuario.email,
        rol: usuario.rolId,
        centroId: usuario.centroId,
        bodegaId: usuario.bodegaId
    };
}

export function puedeAdministrar(rol: string): boolean {
    return rol === "R01";
}

export function puedeOperarEntrada(rol: string): boolean {
    return ["R01", "R03", "R06"].includes(rol);
}

export function puedeOperarSalida(rol: string): boolean {
    return ["R01", "R03", "R07"].includes(rol);
}

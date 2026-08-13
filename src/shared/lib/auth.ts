// config
import { ROL_ADMINISTRADOR } from "@/config/auth";

// lib
import { auth } from "@/auth";
import { prisma } from "@/shared/lib/prisma";

// utils
import { esCorreoInstitucional, normalizarEmail } from "@/modules/auth/utils/dominio";

export interface SessionUser {
    id: string;
    nombre: string;
    apPaterno: string;
    email: string;
    rol: string;
    centroId: string;
    bodegaId: string | null;
}

/**
 * Resuelve el funcionario de la sesion actual.
 * Revalida contra la base en cada llamada para que las bajas y los cambios de rol
 * tengan efecto inmediato, sin esperar a que expire el token.
 * Retorna `null` si no hay sesion valida.
 */
export async function obtenerSessionUser(): Promise<SessionUser | null> {
    const session = await auth();
    const email = normalizarEmail(session?.user?.email);

    if (email.length === 0 || !esCorreoInstitucional(email)) {
        return null;
    }

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
        return null;
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

/** Igual que `obtenerSessionUser`, pero lanza si no hay sesion valida. */
export async function requireSessionUser(): Promise<SessionUser> {
    const usuario = await obtenerSessionUser();

    if (!usuario) {
        throw new Error("Sesion no valida. Vuelve a iniciar sesion con tu cuenta institucional.");
    }

    return usuario;
}

export function puedeAdministrar(rol: string): boolean {
    return rol === ROL_ADMINISTRADOR;
}

export function puedeOperarEntrada(rol: string): boolean {
    return [ROL_ADMINISTRADOR, "R03", "R06", "R07"].includes(rol);
}

export function puedeOperarSalida(rol: string): boolean {
    return [ROL_ADMINISTRADOR, "R03", "R07"].includes(rol);
}

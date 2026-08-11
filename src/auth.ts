import NextAuth from "next-auth";

// config
import { authConfig } from "@/auth.config";
import { MOTIVO_RECHAZO, RUTA_LOGIN } from "@/config/auth";

// lib
import { prisma } from "@/shared/lib/prisma";

// utils
import { esCorreoInstitucional, normalizarEmail } from "@/modules/auth/utils/dominio";

/** Redirige al login mostrando el motivo por el que se rechazo el acceso. */
function rechazar(motivo: string): string {
    return `${RUTA_LOGIN}?error=${motivo}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ account, profile }) {
            if (account?.provider !== "google") {
                return rechazar(MOTIVO_RECHAZO.PROVEEDOR);
            }

            // Google entrega `email_verified` para cuentas Workspace y Gmail.
            if (profile?.email_verified === false) {
                return rechazar(MOTIVO_RECHAZO.CORREO_NO_VERIFICADO);
            }

            const email = normalizarEmail(profile?.email);

            // Regla 1: solo correos del dominio institucional.
            if (!esCorreoInstitucional(email)) {
                return rechazar(MOTIVO_RECHAZO.DOMINIO);
            }

            // Regla 2: el correo debe existir como funcionario registrado.
            const funcionario = await prisma.usuario.findUnique({
                where: { email },
                select: { id: true, estado: true }
            });

            if (!funcionario) {
                return rechazar(MOTIVO_RECHAZO.NO_REGISTRADO);
            }

            // Regla 3: el funcionario debe estar activo.
            if (!funcionario.estado) {
                return rechazar(MOTIVO_RECHAZO.INACTIVO);
            }

            return true;
        },
        async jwt({ token, user, trigger }) {
            const email = normalizarEmail(user?.email ?? token.email);

            if (email.length === 0) {
                return token;
            }

            // Se consulta la base solo al iniciar sesion o al refrescar la sesion
            // explicitamente; el resto de las peticiones reutiliza el token.
            const debeRefrescar = Boolean(user) || trigger === "update" || !token.idUser;

            if (!debeRefrescar) {
                return token;
            }

            const funcionario = await prisma.usuario.findUnique({
                where: { email },
                select: {
                    id: true,
                    nombre: true,
                    apPaterno: true,
                    rolId: true,
                    centroId: true,
                    bodegaId: true
                }
            });

            if (!funcionario) {
                return token;
            }

            token.email = email;
            token.idUser = funcionario.id;
            token.nombre = funcionario.nombre;
            token.apPaterno = funcionario.apPaterno ?? "";
            token.rol = funcionario.rolId;
            token.centroId = funcionario.centroId;
            token.bodegaId = funcionario.bodegaId;

            return token;
        },
        session({ session, token }) {
            session.user.id = token.idUser ?? "";
            session.user.nombre = token.nombre ?? "";
            session.user.apPaterno = token.apPaterno ?? "";
            session.user.rol = token.rol ?? "";
            session.user.centroId = token.centroId ?? "";
            session.user.bodegaId = token.bodegaId ?? null;
            session.user.email = token.email ?? session.user.email;

            return session;
        }
    }
});

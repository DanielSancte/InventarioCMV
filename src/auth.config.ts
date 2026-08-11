import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// config
import {
    DOMINIO_INSTITUCIONAL,
    DURACION_SESION_SEGUNDOS,
    RUTA_INICIO,
    RUTA_LOGIN,
    RUTAS_PUBLICAS
} from "@/config/auth";

/**
 * Configuracion compartida y segura para el runtime edge (middleware).
 * No importa Prisma ni ningun modulo de Node; los callbacks con base de datos viven en `src/auth.ts`.
 */
export const authConfig = {
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
            authorization: {
                params: {
                    // `hd` solo sugiere el dominio en la pantalla de Google: la validacion real
                    // se hace en el callback `signIn` de src/auth.ts.
                    hd: DOMINIO_INSTITUCIONAL,
                    prompt: "select_account"
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: DURACION_SESION_SEGUNDOS
    },
    pages: {
        signIn: RUTA_LOGIN,
        error: RUTA_LOGIN
    },
    callbacks: {
        authorized({ auth, request }) {
            const { pathname } = request.nextUrl;
            const tieneSesion = Boolean(auth?.user);
            const esRutaPublica = RUTAS_PUBLICAS.some(
                (ruta) => pathname === ruta || pathname.startsWith(`${ruta}/`)
            );

            if (esRutaPublica) {
                if (tieneSesion) {
                    return Response.redirect(new URL(RUTA_INICIO, request.nextUrl));
                }

                return true;
            }

            return tieneSesion;
        }
    }
} satisfies NextAuthConfig;

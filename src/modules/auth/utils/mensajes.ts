// config
import { MENSAJE_RECHAZO, type MotivoRechazo } from "@/config/auth";

/** Errores propios de NextAuth que pueden llegar como query param al login. */
const MENSAJE_NEXTAUTH: Record<string, string> = {
    Configuration: "El servidor no tiene configuradas las credenciales de Google. Revisa AUTH_SECRET, AUTH_GOOGLE_ID y AUTH_GOOGLE_SECRET.",
    AccessDenied: "No tienes acceso al sistema con esa cuenta.",
    Verification: "El enlace de acceso expiro o ya fue utilizado.",
    OAuthAccountNotLinked: "Esa cuenta de Google ya esta asociada a otro acceso.",
    OAuthSignin: "No fue posible iniciar el flujo de Google. Intenta nuevamente.",
    OAuthCallback: "Google rechazo la respuesta de autenticacion. Intenta nuevamente."
};

/** Traduce el codigo de error recibido en la URL a un mensaje para el usuario. */
export function mensajeDeError(codigo: string | undefined): string | null {
    if (!codigo) {
        return null;
    }

    const propio = MENSAJE_RECHAZO[codigo as MotivoRechazo];

    if (propio) {
        return propio;
    }

    return MENSAJE_NEXTAUTH[codigo] ?? "No fue posible iniciar sesion. Intenta nuevamente.";
}

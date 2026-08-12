// config
import { DOMINIO_INSTITUCIONAL } from "@/config/auth";

/** Normaliza un correo para comparaciones y consultas (minusculas, sin espacios). */
export function normalizarEmail(email: string | null | undefined): string {
    return (email ?? "").trim().toLowerCase();
}

/** Extrae el dominio de un correo; retorna cadena vacia si el formato es invalido. */
export function obtenerDominio(email: string | null | undefined): string {
    const normalizado = normalizarEmail(email);
    const partes = normalizado.split("@");

    if (partes.length !== 2) {
        return "";
    }

    const [usuario, dominio] = partes;

    if (usuario.length === 0 || dominio.length === 0) {
        return "";
    }

    return dominio;
}

/**
 * Valida que el correo pertenezca al dominio institucional.
 * Rechaza cuentas personales (@gmail.com y cualquier otro dominio externo).
 */
export function esCorreoInstitucional(email: string | null | undefined): boolean {
    return obtenerDominio(email) === DOMINIO_INSTITUCIONAL;
}

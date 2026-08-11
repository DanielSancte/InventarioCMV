"use server";

// config
import { RUTA_INICIO, RUTA_LOGIN } from "@/config/auth";

// lib
import { signIn, signOut } from "@/auth";

/** Inicia el flujo de OAuth con Google. */
export async function iniciarSesionGoogle(): Promise<void> {
    await signIn("google", { redirectTo: RUTA_INICIO });
}

/** Cierra la sesion y vuelve al formulario de login. */
export async function cerrarSesion(): Promise<void> {
    await signOut({ redirectTo: RUTA_LOGIN });
}

import type { DefaultSession } from "next-auth";

/** Datos del funcionario que la sesion expone a la app. */
export interface FuncionarioSesion {
    id: string;
    nombre: string;
    apPaterno: string;
    rol: string;
    centroId: string;
    bodegaId: string | null;
}

declare module "next-auth" {
    interface Session {
        user: FuncionarioSesion & DefaultSession["user"];
    }
}

// `next-auth/jwt` solo reexporta desde `@auth/core/jwt`, por lo que la interfaz JWT
// debe extenderse en el modulo original para que el merge de declaraciones funcione.
declare module "@auth/core/jwt" {
    interface JWT {
        idUser?: string;
        nombre?: string;
        apPaterno?: string;
        rol?: string;
        centroId?: string;
        bodegaId?: string | null;
    }
}

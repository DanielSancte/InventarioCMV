import NextAuth from "next-auth";

// config
import { authConfig } from "@/auth.config";

// Se instancia NextAuth solo con la configuracion edge-safe: el middleware no puede
// cargar Prisma. La verificacion contra la base de datos ocurre en src/auth.ts.
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"]
};

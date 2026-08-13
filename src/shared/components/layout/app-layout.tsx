import { redirect } from "next/navigation";
import type * as React from "react";
import type { ReactNode } from "react";

// config
import { RUTA_LOGIN } from "@/config/auth";

// components
import { AppSidebarShell, type LayoutUserProfile } from "@/shared/components/layout/app-sidebar-shell";

// lib
import { obtenerSessionUser } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";

export async function AppLayout({ children }: { children: ReactNode }): Promise<React.ReactElement> {
    const user = await obtenerSessionUser();

    if (!user) {
        redirect(RUTA_LOGIN);
    }

    const profile = await obtenerLayoutUserProfile(user.id);

    return (
        <AppSidebarShell profile={profile}>
            {children}
        </AppSidebarShell>
    );
}

async function obtenerLayoutUserProfile(userId: string): Promise<LayoutUserProfile> {
    const usuario = await prisma.usuario.findUnique({
        where: { id: userId },
        select: {
            nombre: true,
            apPaterno: true,
            email: true,
            rol: { select: { descripcion: true } },
            centro: { select: { nombre: true } },
            bodega: { select: { id: true, nombre: true, centro: { select: { nombre: true } } } },
            encargos: {
                select: {
                    bodega: { select: { id: true, nombre: true } },
                    centro: { select: { nombre: true } }
                },
                orderBy: { bodega: { nombre: "asc" } }
            }
        }
    });

    if (!usuario) {
        redirect(RUTA_LOGIN);
    }

    const bodegas = new Map<string, string>();

    if (usuario.bodega) {
        bodegas.set(usuario.bodega.id, crearBodegaLabel(usuario.bodega.nombre, usuario.bodega.centro.nombre));
    }

    for (const encargo of usuario.encargos) {
        bodegas.set(encargo.bodega.id, crearBodegaLabel(encargo.bodega.nombre, encargo.centro.nombre));
    }

    return {
        nombreCompleto: [usuario.nombre, usuario.apPaterno].filter(Boolean).join(" "),
        email: usuario.email,
        rol: usuario.rol.descripcion,
        centro: usuario.centro.nombre,
        bodegas: [...bodegas.values()]
    };
}

function crearBodegaLabel(nombreBodega: string, nombreCentro: string): string {
    return `${nombreBodega} (${nombreCentro})`;
}

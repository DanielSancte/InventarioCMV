import { ShieldAlert } from "lucide-react";
import type * as React from "react";

// config
import { DOMINIO_INSTITUCIONAL } from "@/config/auth";

// actions
import { iniciarSesionGoogle } from "@/modules/auth/actions/auth.action";

// components
import { BotonGoogle } from "@/modules/auth/components/boton-google";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

// utils
import { mensajeDeError } from "@/modules/auth/utils/mensajes";

interface LoginPageProps {
    searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps): Promise<React.ReactElement> {
    const { error } = await searchParams;
    const mensaje = mensajeDeError(error);

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <p className="text-sm text-muted-foreground">Inventario APS</p>
                    <CardTitle>Acceso institucional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <p className="text-sm text-muted-foreground">
                        Ingresa con tu cuenta corporativa <strong>@{DOMINIO_INSTITUCIONAL}</strong>. Las cuentas
                        personales no tienen acceso al sistema.
                    </p>

                    {mensaje ? (
                        <div
                            role="alert"
                            className="flex gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
                        >
                            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{mensaje}</span>
                        </div>
                    ) : null}

                    <form action={iniciarSesionGoogle}>
                        <BotonGoogle />
                    </form>

                    <p className="text-xs text-muted-foreground">
                        Si tu correo institucional no esta habilitado, solicita al administrador que registre tu
                        usuario.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

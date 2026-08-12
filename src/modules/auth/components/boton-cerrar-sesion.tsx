"use client";

import { LogOut } from "lucide-react";
import type * as React from "react";
import { useFormStatus } from "react-dom";

// components
import { Button } from "@/shared/components/ui/button";

export function BotonCerrarSesion(): React.ReactElement {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" variant="outline" size="sm" disabled={pending}>
            <LogOut className="h-4 w-4" />
            {pending ? "Saliendo..." : "Cerrar sesion"}
        </Button>
    );
}

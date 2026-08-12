"use client";

import { LogIn } from "lucide-react";
import type * as React from "react";
import { useFormStatus } from "react-dom";

// components
import { Button } from "@/shared/components/ui/button";

export function BotonGoogle(): React.ReactElement {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" className="w-full" disabled={pending}>
            <LogIn className="h-4 w-4" />
            {pending ? "Redirigiendo a Google..." : "Continuar con Google"}
        </Button>
    );
}

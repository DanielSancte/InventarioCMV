"use client";

import { Save } from "lucide-react";
import type * as React from "react";
import { useFormStatus } from "react-dom";

// components
import { Button } from "@/shared/components/ui/button";

export function FormSubmit({ label = "Guardar" }: { label?: string }): React.ReactElement {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" disabled={pending}>
            <Save className="h-4 w-4" />
            {pending ? "Guardando..." : label}
        </Button>
    );
}

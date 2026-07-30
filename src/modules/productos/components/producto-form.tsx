"use client";

import type * as React from "react";
import { useActionState } from "react";

// actions
import { crearProducto } from "@/modules/productos/actions/productos.action";

// components
import { ActionMessage } from "@/shared/components/ui/action-message";
import { FormSubmit } from "@/shared/components/ui/form-submit";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";

// types
import { initialActionState } from "@/shared/types/action-state";

export function ProductoForm(): React.ReactElement {
    const [state, formAction] = useActionState(crearProducto, initialActionState);

    return (
        <form action={formAction} className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm">
                <span>Linea</span>
                <Select name="linea" required defaultValue="CLINICO">
                    <option value="CLINICO">Clinico</option>
                    <option value="ASEO">Aseo</option>
                </Select>
            </label>
            <label className="space-y-1 text-sm">
                <span>Descripcion</span>
                <Input name="descripcion" required minLength={3} placeholder="Nombre del producto" />
            </label>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="estado" defaultChecked />
                Activo
            </label>
            <div className="flex items-center gap-3 md:col-span-2">
                <FormSubmit label="Crear producto" />
                <ActionMessage state={state} />
            </div>
        </form>
    );
}

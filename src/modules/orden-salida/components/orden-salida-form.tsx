"use client";

import type * as React from "react";
import { useActionState, useState } from "react";
import type { Bodega, Centro, Stock } from "@prisma/client";

// actions
import { crearOrdenSalida } from "@/modules/orden-salida/actions/orden-salida.action";

// components
import { OrdenSalidaDetallesField } from "@/modules/orden-salida/components/orden-salida-detalles-field";
import { ActionMessage } from "@/shared/components/ui/action-message";
import { FormSubmit } from "@/shared/components/ui/form-submit";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";

// types
import { initialActionState } from "@/shared/types/action-state";

// utils
import { toDateInputValue } from "@/shared/utils/format";

interface StockDisponible extends Stock {
    producto: {
        descripcion: string;
    };
    bodega: {
        nombre: string;
    };
}

export function OrdenSalidaForm({
    centros,
    bodegas,
    stocks
}: {
    centros: Centro[];
    bodegas: Bodega[];
    stocks: StockDisponible[];
}): React.ReactElement {
    const [state, formAction] = useActionState(crearOrdenSalida, initialActionState);
    const primerStock = stocks[0];
    const [bodegaId, setBodegaId] = useState(primerStock?.bodegaId ?? bodegas[0]?.id ?? "");

    return (
        <form action={formAction} className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm">
                <span>Fecha</span>
                <Input type="date" name="fecha" defaultValue={toDateInputValue()} required />
            </label>
            <label className="space-y-1 text-sm">
                <span>Centro</span>
                <Select name="centroId" required>
                    {centros.map((centro) => (
                        <option key={centro.id} value={centro.id}>
                            {centro.nombre}
                        </option>
                    ))}
                </Select>
            </label>
            <label className="space-y-1 text-sm">
                <span>Bodega</span>
                <Select
                    name="bodegaId"
                    required
                    value={bodegaId}
                    onChange={(event) => setBodegaId(event.currentTarget.value)}
                >
                    {bodegas.map((bodega) => (
                        <option key={bodega.id} value={bodega.id}>
                            {bodega.nombre}
                        </option>
                    ))}
                </Select>
            </label>
            <label className="space-y-1 text-sm">
                <span>Tipo salida</span>
                <Select name="tipoSalida" required defaultValue="Consumo Interno">
                    <option value="Consumo Interno">Consumo Interno</option>
                    <option value="A Otros Centros">A Otros Centros</option>
                    <option value="Merma">Merma</option>
                </Select>
            </label>
            <label className="space-y-1 text-sm">
                <span>Destino</span>
                <Input name="destino" required placeholder="Unidad o centro destino" />
            </label>
            <label className="space-y-1 text-sm">
                <span>Correo destino</span>
                <Input type="email" name="correoDestino" placeholder="Opcional" />
            </label>
            <div className="border-t pt-3 md:col-span-3">
                <p className="mb-3 text-sm font-medium">Detalle</p>
                <OrdenSalidaDetallesField bodegaId={bodegaId} stocks={stocks} />
            </div>
            <div className="flex items-center gap-3 md:col-span-3">
                <FormSubmit label="Registrar salida" />
                <ActionMessage state={state} />
            </div>
        </form>
    );
}

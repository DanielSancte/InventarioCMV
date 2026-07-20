"use client";

import type * as React from "react";
import { useActionState } from "react";
import type { Bodega, Centro, Stock } from "@prisma/client";

// actions
import { crearOrdenSalida } from "@/modules/orden-salida/actions/orden-salida.action";

// components
import { ActionMessage } from "@/shared/components/ui/action-message";
import { FormSubmit } from "@/shared/components/ui/form-submit";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";

// types
import { initialActionState } from "@/shared/types/action-state";

// utils
import { formatDate, toDateInputValue } from "@/shared/utils/format";

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
                <Select name="bodegaId" required defaultValue={primerStock?.bodegaId}>
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
                <div className="grid gap-3 md:grid-cols-4">
                    <label className="space-y-1 text-sm md:col-span-2">
                        <span>Producto / lote disponible</span>
                        <Select
                            name="stockSelector"
                            required
                            defaultValue={primerStock ? stockValue(primerStock) : ""}
                            onChange={(event) => {
                                const [productoId, bodegaId, lote, fechaCaducidad] = event.currentTarget.value.split("|");
                                const form = event.currentTarget.form;
                                if (!form) {
                                    return;
                                }
                                (form.elements.namedItem("productoId") as HTMLInputElement).value = productoId;
                                (form.elements.namedItem("bodegaId") as HTMLSelectElement).value = bodegaId;
                                (form.elements.namedItem("lote") as HTMLInputElement).value = lote;
                                (form.elements.namedItem("fechaCaducidad") as HTMLInputElement).value = fechaCaducidad;
                            }}
                        >
                            {stocks.map((stock) => (
                                <option key={stock.id} value={stockValue(stock)}>
                                    {stock.producto.descripcion} · {stock.lote} · {stock.bodega.nombre} · {stock.cantidadDisponible} disp.
                                </option>
                            ))}
                        </Select>
                    </label>
                    <input type="hidden" name="productoId" defaultValue={primerStock?.productoId} />
                    <input type="hidden" name="lote" defaultValue={primerStock?.lote} />
                    <input type="hidden" name="fechaCaducidad" defaultValue={primerStock ? toDateInputValue(primerStock.fechaCaducidad) : ""} />
                    <label className="space-y-1 text-sm">
                        <span>Cantidad</span>
                        <Input type="number" name="cantidad" min={1} defaultValue={1} required />
                    </label>
                    <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                        Caducidad inicial: {primerStock ? formatDate(primerStock.fechaCaducidad) : "sin stock"}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 md:col-span-3">
                <FormSubmit label="Registrar salida" />
                <ActionMessage state={state} />
            </div>
        </form>
    );
}

function stockValue(stock: StockDisponible): string {
    return `${stock.productoId}|${stock.bodegaId}|${stock.lote}|${toDateInputValue(stock.fechaCaducidad)}`;
}

"use client";

import type * as React from "react";
import { useActionState } from "react";
import type { Bodega, Centro, Producto } from "@prisma/client";

// actions
import { crearOrdenEntrada } from "@/modules/orden-entrada/actions/orden-entrada.action";

// components
import { ActionMessage } from "@/shared/components/ui/action-message";
import { FormSubmit } from "@/shared/components/ui/form-submit";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";

// types
import { initialActionState } from "@/shared/types/action-state";

// utils
import { toDateInputValue } from "@/shared/utils/format";

export function OrdenEntradaForm({
    centros,
    bodegas,
    productos
}: {
    centros: Centro[];
    bodegas: Bodega[];
    productos: Producto[];
}): React.ReactElement {
    const [state, formAction] = useActionState(crearOrdenEntrada, initialActionState);

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
                <Select name="bodegaId" required>
                    {bodegas.map((bodega) => (
                        <option key={bodega.id} value={bodega.id}>
                            {bodega.nombre}
                        </option>
                    ))}
                </Select>
            </label>
            <label className="space-y-1 text-sm">
                <span>Origen</span>
                <Select name="origen" required defaultValue="Drogueria">
                    <option value="Drogueria">Drogueria</option>
                    <option value="Desde Otros Centros">Desde Otros Centros</option>
                    <option value="Otros Servicios">Otros Servicios</option>
                </Select>
            </label>
            <label className="space-y-1 text-sm">
                <span>Guia despacho</span>
                <Input name="guiaDespacho" placeholder="Opcional" />
            </label>
            <label className="space-y-1 text-sm">
                <span>Codigo recepcion</span>
                <Input name="codigoRecepcion" placeholder="Opcional" />
            </label>
            <div className="border-t pt-3 md:col-span-3">
                <p className="mb-3 text-sm font-medium">Detalle</p>
                <div className="grid gap-3 md:grid-cols-5">
                    <label className="space-y-1 text-sm md:col-span-2">
                        <span>Producto</span>
                        <Select name="productoId" required>
                            {productos.map((producto) => (
                                <option key={producto.id} value={producto.id}>
                                    {producto.descripcion}
                                </option>
                            ))}
                        </Select>
                    </label>
                    <label className="space-y-1 text-sm">
                        <span>Categoria</span>
                        <Select name="categoria" required defaultValue="CLINICO">
                            <option value="CLINICO">Clinico</option>
                            <option value="ASEO">Aseo</option>
                        </Select>
                    </label>
                    <label className="space-y-1 text-sm">
                        <span>Cantidad</span>
                        <Input type="number" name="cantidad" min={1} defaultValue={1} required />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span>Lote</span>
                        <Input name="lote" minLength={3} required placeholder="L-001" />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span>Caducidad</span>
                        <Input type="date" name="fechaCaducidad" required />
                    </label>
                </div>
            </div>
            <div className="flex items-center gap-3 md:col-span-3">
                <FormSubmit label="Registrar entrada" />
                <ActionMessage state={state} />
            </div>
        </form>
    );
}

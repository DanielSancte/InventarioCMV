"use client";

import type * as React from "react";
import { useActionState, useEffect, useMemo, useState } from "react";
import type { Bodega, Centro, Producto } from "@prisma/client";

// actions
import { crearOrdenEntrada } from "@/modules/orden-entrada/actions/orden-entrada.action";

// components
import { OrdenEntradaDetallesField } from "@/modules/orden-entrada/components/orden-entrada-detalles-field";
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
    productos,
    centroId,
    bodegaId,
    puedeFiltrarCentro
}: {
    centros: Centro[];
    bodegas: Bodega[];
    productos: Producto[];
    centroId: string | null;
    bodegaId: string | null;
    puedeFiltrarCentro: boolean;
}): React.ReactElement {
    const [state, formAction] = useActionState(crearOrdenEntrada, initialActionState);
    const [fecha, setFecha] = useState(toDateInputValue());
    const [centroSeleccionado, setCentroSeleccionado] = useState(centroId ?? centros[0]?.id ?? "");
    const [bodegaSeleccionada, setBodegaSeleccionada] = useState(bodegaId ?? "");
    const [origen, setOrigen] = useState("Drogueria");
    const [guiaDespacho, setGuiaDespacho] = useState("");
    const [codigoRecepcion, setCodigoRecepcion] = useState("");
    const [resetKey, setResetKey] = useState(0);
    const fechaMaxima = toDateInputValue();
    const fechaMinima = toDateInputValue(crearFechaMinimaEntrada());
    const bodegasFiltradas = useMemo(
        () => bodegas.filter((bodega) => bodega.centroId === centroSeleccionado),
        [bodegas, centroSeleccionado]
    );
    const detalleHabilitado = fecha.length > 0 && centroSeleccionado.length > 0 && bodegaSeleccionada.length > 0 && origen.length > 0;

    function cambiarCentro(value: string): void {
        setCentroSeleccionado(value);
        setBodegaSeleccionada("");
    }

    useEffect(() => {
        if (!state.ok) {
            return;
        }

        setFecha(toDateInputValue());
        setBodegaSeleccionada("");
        setOrigen("Drogueria");
        setGuiaDespacho("");
        setCodigoRecepcion("");
        setResetKey((actual) => actual + 1);
    }, [state.ok, state.message]);

    return (
        <form action={formAction} className="grid gap-3 md:grid-cols-3">
            <label className="space-y-1 text-sm">
                <span>Fecha</span>
                <Input
                    type="date"
                    name="fecha"
                    min={fechaMinima}
                    max={fechaMaxima}
                    value={fecha}
                    onChange={(event) => setFecha(event.currentTarget.value)}
                    required
                />
            </label>
            <label className="space-y-1 text-sm">
                <span>Centro</span>
                {puedeFiltrarCentro ? (
                    <Select name="centroId" value={centroSeleccionado} onChange={(event) => cambiarCentro(event.currentTarget.value)} required>
                        <option value="">Seleccione centro</option>
                        {centros.map((centro) => (
                            <option key={centro.id} value={centro.id}>
                                {centro.nombre}
                            </option>
                        ))}
                    </Select>
                ) : (
                    <>
                        <Input value={centros[0]?.nombre ?? "Sin centro autorizado"} disabled />
                        <input type="hidden" name="centroId" value={centroSeleccionado} />
                    </>
                )}
            </label>
            <label className="space-y-1 text-sm">
                <span>Bodega</span>
                <Select name="bodegaId" value={bodegaSeleccionada} onChange={(event) => setBodegaSeleccionada(event.currentTarget.value)} required>
                    <option value="">Seleccione bodega</option>
                    {bodegasFiltradas.map((bodega) => (
                        <option key={bodega.id} value={bodega.id}>
                            {bodega.nombre}
                        </option>
                    ))}
                </Select>
            </label>
            <label className="space-y-1 text-sm">
                <span>Origen</span>
                <Select name="origen" required value={origen} onChange={(event) => setOrigen(event.currentTarget.value)}>
                    <option value="Drogueria">Drogueria</option>
                    <option value="Desde Otros Centros">Desde Otros Centros</option>
                    <option value="Otros Servicios">Otros Servicios</option>
                </Select>
            </label>
            <label className="space-y-1 text-sm">
                <span>Guia despacho</span>
                <Input
                    name="guiaDespacho"
                    value={guiaDespacho}
                    onChange={(event) => setGuiaDespacho(event.currentTarget.value)}
                    placeholder="Opcional"
                />
            </label>
            <label className="space-y-1 text-sm">
                <span>Codigo recepcion</span>
                <Input
                    name="codigoRecepcion"
                    value={codigoRecepcion}
                    onChange={(event) => setCodigoRecepcion(event.currentTarget.value)}
                    placeholder="Opcional"
                />
            </label>
            <div className="border-t pt-3 md:col-span-3">
                <p className="mb-3 text-sm font-medium">Detalle</p>
                {detalleHabilitado ? (
                    <OrdenEntradaDetallesField key={resetKey} productos={productos} />
                ) : (
                    <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                        Complete fecha, centro, bodega y origen para agregar productos.
                    </div>
                )}
            </div>
            <div className="flex items-center gap-3 md:col-span-3">
                <FormSubmit label="Registrar entrada" />
                <ActionMessage state={state} />
            </div>
        </form>
    );
}

function crearFechaMinimaEntrada(): Date {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - 7);
    return fecha;
}

"use client";

import type * as React from "react";
import { useMemo, useState } from "react";
import type { Bodega, Centro } from "@prisma/client";

// components
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Select } from "@/shared/components/ui/select";

interface InventarioFiltrosProps {
    action: string;
    centros: Centro[];
    bodegas: Bodega[];
    centroId: string | null;
    bodegaId: string | null;
    puedeFiltrarCentro: boolean;
    busqueda?: string;
    mostrarBusqueda?: boolean;
}

export function InventarioFiltros({
    action,
    centros,
    bodegas,
    centroId,
    bodegaId,
    puedeFiltrarCentro,
    busqueda = "",
    mostrarBusqueda = false
}: InventarioFiltrosProps): React.ReactElement {
    const [centroSeleccionado, setCentroSeleccionado] = useState(centroId ?? "todos");
    const [bodegaSeleccionada, setBodegaSeleccionada] = useState(bodegaId ?? "todos");
    const bodegasFiltradas = useMemo(() => {
        if (centroSeleccionado === "todos") {
            return bodegas;
        }

        return bodegas.filter((bodega) => bodega.centroId === centroSeleccionado);
    }, [bodegas, centroSeleccionado]);

    function cambiarCentro(value: string): void {
        setCentroSeleccionado(value);
        setBodegaSeleccionada("todos");
    }

    const centroFijo = centros.length === 1 ? centros[0] : null;

    return (
        <form action={action} className="grid gap-3 md:grid-cols-4">
            <label className="space-y-1 text-sm">
                <span>Centro</span>
                {puedeFiltrarCentro ? (
                    <Select name="centroId" value={centroSeleccionado} onChange={(event) => cambiarCentro(event.currentTarget.value)}>
                        <option value="todos">Todos los centros</option>
                        {centros.map((centro) => (
                            <option key={centro.id} value={centro.id}>
                                {centro.nombre}
                            </option>
                        ))}
                    </Select>
                ) : (
                    <>
                        <Input value={centroFijo?.nombre ?? "Sin centro autorizado"} disabled />
                        {centroFijo ? <input type="hidden" name="centroId" value={centroFijo.id} /> : null}
                    </>
                )}
            </label>
            <label className="space-y-1 text-sm">
                <span>Bodega</span>
                <Select name="bodegaId" value={bodegaSeleccionada} onChange={(event) => setBodegaSeleccionada(event.currentTarget.value)}>
                    <option value="todos">Todas las bodegas</option>
                    {bodegasFiltradas.map((bodega) => (
                        <option key={bodega.id} value={bodega.id}>
                            {bodega.nombre}
                        </option>
                    ))}
                </Select>
            </label>
            {mostrarBusqueda ? (
                <label className="space-y-1 text-sm md:col-span-1">
                    <span>Buscar producto</span>
                    <Input name="q" defaultValue={busqueda} placeholder="Nombre o ID" />
                </label>
            ) : null}
            <div className="flex items-end gap-2">
                <Button type="submit">Filtrar</Button>
                <Button type="button" variant="outline" onClick={() => window.location.assign(action)}>
                    Limpiar
                </Button>
            </div>
        </form>
    );
}

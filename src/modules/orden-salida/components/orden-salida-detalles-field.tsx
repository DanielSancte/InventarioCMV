"use client";

import type * as React from "react";
import { useEffect, useMemo, useState } from "react";
import type { Stock } from "@prisma/client";
import { Plus, Trash2 } from "lucide-react";

// components
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";

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

interface DetalleSalidaRow {
    id: number;
    stockTexto: string;
    productoId: string;
    lote: string;
    fechaCaducidad: string;
    disponible: number | null;
}

export function OrdenSalidaDetallesField({
    bodegaId,
    stocks
}: {
    bodegaId: string;
    stocks: StockDisponible[];
}): React.ReactElement {
    const [nextId, setNextId] = useState(2);
    const [detalles, setDetalles] = useState<DetalleSalidaRow[]>([crearDetalleInicial(1)]);
    const stocksFiltrados = useMemo(() => stocks.filter((stock) => stock.bodegaId === bodegaId), [bodegaId, stocks]);
    const opciones = useMemo(() => stocksFiltrados.map((stock) => ({
        label: crearStockLabel(stock),
        productoId: String(stock.productoId),
        lote: stock.lote,
        fechaCaducidad: toDateInputValue(stock.fechaCaducidad),
        disponible: stock.cantidadDisponible
    })), [stocksFiltrados]);
    const opcionesPorLabel = useMemo(() => new Map(opciones.map((opcion) => [opcion.label, opcion])), [opciones]);
    const datalistId = "stocks-salida-list";

    useEffect(() => {
        setNextId(2);
        setDetalles([crearDetalleInicial(1)]);
    }, [bodegaId]);

    function agregarDetalle(): void {
        setDetalles((actuales) => [...actuales, crearDetalleInicial(nextId)]);
        setNextId((actual) => actual + 1);
    }

    function eliminarDetalle(id: number): void {
        setDetalles((actuales) => actuales.length === 1 ? actuales : actuales.filter((detalle) => detalle.id !== id));
    }

    function seleccionarStock(id: number, stockTexto: string): void {
        const opcion = opcionesPorLabel.get(stockTexto);
        setDetalles((actuales) => actuales.map((detalle) => {
            if (detalle.id !== id) {
                return detalle;
            }

            return {
                ...detalle,
                stockTexto,
                productoId: opcion?.productoId ?? "",
                lote: opcion?.lote ?? "",
                fechaCaducidad: opcion?.fechaCaducidad ?? "",
                disponible: opcion?.disponible ?? null
            };
        }));
    }

    return (
        <div className="space-y-3">
            <datalist id={datalistId}>
                {opciones.map((opcion) => (
                    <option key={`${opcion.productoId}-${opcion.lote}-${opcion.fechaCaducidad}`} value={opcion.label} />
                ))}
            </datalist>
            {detalles.map((detalle, index) => (
                <div key={detalle.id} className="grid gap-3 rounded-md border p-3 md:grid-cols-5">
                    <label className="space-y-1 text-sm md:col-span-2">
                        <span>Producto / lote disponible</span>
                        <Input
                            list={datalistId}
                            value={detalle.stockTexto}
                            onChange={(event) => seleccionarStock(detalle.id, event.currentTarget.value)}
                            required
                            placeholder="Escribe producto o lote"
                        />
                        <input type="hidden" name="productoId" value={detalle.productoId} readOnly />
                        <input type="hidden" name="lote" value={detalle.lote} readOnly />
                        <input type="hidden" name="fechaCaducidad" value={detalle.fechaCaducidad} readOnly />
                    </label>
                    <label className="space-y-1 text-sm">
                        <span>Cantidad</span>
                        <Input
                            type="number"
                            name="cantidad"
                            min={1}
                            max={detalle.disponible ?? undefined}
                            defaultValue={1}
                            required
                        />
                    </label>
                    <div className="space-y-1 text-sm">
                        <span>Caducidad</span>
                        <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                            {detalle.fechaCaducidad || "Seleccione stock"}
                        </div>
                    </div>
                    <div className="space-y-1 text-sm">
                        <span>Disponible</span>
                        <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                            {detalle.disponible ?? "Seleccione stock"}
                        </div>
                    </div>
                    <div className="flex items-end gap-2 md:col-span-5">
                        <Button type="button" variant="outline" size="sm" onClick={agregarDetalle}>
                            <Plus className="h-4 w-4" />
                            Agregar
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarDetalle(detalle.id)}
                            disabled={detalles.length === 1}
                        >
                            <Trash2 className="h-4 w-4" />
                            Quitar
                        </Button>
                        <span className="text-xs text-muted-foreground">Detalle {index + 1}</span>
                    </div>
                </div>
            ))}
            {stocksFiltrados.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay stock disponible para la bodega seleccionada.</p>
            )}
        </div>
    );
}

function crearDetalleInicial(id: number): DetalleSalidaRow {
    return {
        id,
        stockTexto: "",
        productoId: "",
        lote: "",
        fechaCaducidad: "",
        disponible: null
    };
}

function crearStockLabel(stock: StockDisponible): string {
    return `${stock.producto.descripcion} · lote ${stock.lote} · vence ${formatDate(stock.fechaCaducidad)} · ${stock.cantidadDisponible} disp.`;
}

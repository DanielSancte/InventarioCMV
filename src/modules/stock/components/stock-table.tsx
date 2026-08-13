"use client";

import type * as React from "react";

// actions
import type { SortDirection, StockConsolidadoVista, StockSortKey } from "@/modules/stock/actions/stock.action";

// components
import { Badge } from "@/shared/components/ui/badge";
import { SimpleModal } from "@/shared/components/ui/simple-modal";
import { Table, Td, Th } from "@/shared/components/ui/table";

// utils
import { formatDate, formatNumber } from "@/shared/utils/format";

interface StockTableProps {
    stocks: StockConsolidadoVista[];
    sort: StockSortKey;
    direction: SortDirection;
    centroId: string | null;
    bodegaId: string | null;
    busqueda: string;
}

const columnas: Array<{ key: StockSortKey; label: string }> = [
    { key: "centro", label: "Centro" },
    { key: "bodega", label: "Bodega" },
    { key: "producto", label: "Producto" },
    { key: "linea", label: "Linea" },
    { key: "disponible", label: "Disponible" },
    { key: "minimo", label: "Minimo" },
    { key: "alerta", label: "Alerta" }
];

export function StockTable({ stocks, sort, direction, centroId, bodegaId, busqueda }: StockTableProps): React.ReactElement {
    return (
        <Table>
            <thead>
                <tr>
                    {columnas.map((columna) => (
                        <Th key={columna.key}>
                            <a className="inline-flex items-center gap-1 hover:text-foreground" href={crearSortHref({
                                columna: columna.key,
                                sort,
                                direction,
                                centroId,
                                bodegaId,
                                busqueda
                            })}>
                                {columna.label}
                                {sort === columna.key ? (direction === "asc" ? "^" : "v") : null}
                            </a>
                        </Th>
                    ))}
                    <Th>Lotes</Th>
                </tr>
            </thead>
            <tbody>
                {stocks.map((stock) => (
                    <tr key={stock.id}>
                        <Td>{stock.centroNombre}</Td>
                        <Td>{stock.bodegaNombre}</Td>
                        <Td>{stock.productoDescripcion} #{stock.productoId}</Td>
                        <Td>{stock.linea}</Td>
                        <Td>{formatNumber(stock.cantidadDisponible)}</Td>
                        <Td>{formatNumber(stock.stockMinimo)}</Td>
                        <Td>
                            <Badge tone={alertaTone(stock.alerta)}>{alertaLabel(stock.alerta)}</Badge>
                        </Td>
                        <Td>
                            <SimpleModal
                                title={`Lotes de ${stock.productoDescripcion}`}
                                triggerLabel={`Lote (${stock.lotes.length})`}
                                triggerClassName="min-w-20 whitespace-nowrap px-2"
                            >
                                <Table>
                                    <thead>
                                        <tr>
                                            <Th>Lote</Th>
                                            <Th>Disponible</Th>
                                            <Th>Caducidad</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stock.lotes.map((lote) => (
                                            <tr key={lote.id}>
                                                <Td>{lote.lote}</Td>
                                                <Td>{formatNumber(lote.cantidadDisponible)}</Td>
                                                <Td>{formatDate(lote.fechaCaducidad)}</Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </SimpleModal>
                        </Td>
                    </tr>
                ))}
                {stocks.length === 0 ? (
                    <tr>
                        <Td colSpan={8} className="text-muted-foreground">
                            No hay existencias para los filtros seleccionados.
                        </Td>
                    </tr>
                ) : null}
            </tbody>
        </Table>
    );
}

function crearSortHref(input: {
    columna: StockSortKey;
    sort: StockSortKey;
    direction: SortDirection;
    centroId: string | null;
    bodegaId: string | null;
    busqueda: string;
}): string {
    const params = new URLSearchParams();
    const direction = input.sort === input.columna && input.direction === "asc" ? "desc" : "asc";

    if (input.centroId) {
        params.set("centroId", input.centroId);
    }
    if (input.bodegaId) {
        params.set("bodegaId", input.bodegaId);
    }
    if (input.busqueda.length > 0) {
        params.set("q", input.busqueda);
    }
    params.set("sort", input.columna);
    params.set("direction", direction);

    return `/stock?${params.toString()}`;
}

function alertaTone(alerta: string): "success" | "warning" | "danger" | "muted" {
    if (alerta === "sin_stock") {
        return "danger";
    }
    if (alerta === "stock_minimo" || alerta === "caducidad_proxima") {
        return "warning";
    }
    return "success";
}

function alertaLabel(alerta: string): string {
    const labels: Record<string, string> = {
        sin_stock: "Sin stock",
        stock_minimo: "Stock minimo",
        caducidad_proxima: "Caducidad proxima",
        ok: "OK"
    };
    return labels[alerta] ?? "OK";
}

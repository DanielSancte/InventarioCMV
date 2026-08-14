import type * as React from "react";

// actions
import { listarStockConsolidado, type SortDirection, type StockSortKey } from "@/modules/stock/actions/stock.action";

// components
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { InventarioFiltros } from "@/shared/components/inventario/inventario-filtros";
import { AppLayout } from "@/shared/components/layout/app-layout";
import { StockTable } from "@/modules/stock/components/stock-table";

export const dynamic = "force-dynamic";

interface StockPageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StockPage({ searchParams }: StockPageProps): Promise<React.ReactElement> {
    const params = await searchParams;
    const data = await listarStockConsolidado({
        centroId: obtenerParam(params, "centroId"),
        bodegaId: obtenerParam(params, "bodegaId"),
        busqueda: obtenerParam(params, "q"),
        sort: obtenerSort(obtenerParam(params, "sort")),
        direction: obtenerDirection(obtenerParam(params, "direction"))
    });

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Inventario consolidado por producto y bodega</p>
                    <h2 className="text-2xl font-semibold">Stock</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Filtros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <InventarioFiltros
                            action="/stock"
                            centros={data.centros}
                            bodegas={data.bodegas}
                            centroId={data.centroId}
                            bodegaId={data.bodegaId}
                            puedeFiltrarCentro={data.puedeFiltrarCentro}
                            busqueda={data.busqueda}
                            mostrarBusqueda
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Existencias</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <StockTable
                            stocks={data.stocks}
                            sort={data.sort}
                            direction={data.direction}
                            centroId={data.centroId}
                            bodegaId={data.bodegaId}
                            busqueda={data.busqueda}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function obtenerParam(params: Record<string, string | string[] | undefined> | undefined, key: string): string | undefined {
    const value = params?.[key];
    return Array.isArray(value) ? value[0] : value;
}

function obtenerSort(value: string | undefined): StockSortKey | undefined {
    const permitidos: StockSortKey[] = ["centro", "bodega", "producto", "linea", "disponible", "minimo", "alerta"];
    return permitidos.includes(value as StockSortKey) ? value as StockSortKey : undefined;
}

function obtenerDirection(value: string | undefined): SortDirection | undefined {
    return value === "desc" ? "desc" : value === "asc" ? "asc" : undefined;
}

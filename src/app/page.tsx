import type * as React from "react";

// components
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { InventarioFiltros } from "@/shared/components/inventario/inventario-filtros";
import { Td, Th, Table } from "@/shared/components/ui/table";
import { AppLayout } from "@/shared/components/layout/app-layout";

// lib
import { obtenerAlcanceInventario } from "@/shared/lib/inventario-alcance";
import { prisma } from "@/shared/lib/prisma";

// utils
import { formatDate, formatNumber } from "@/shared/utils/format";
import {
    calcularStockMinimo,
    evaluarAlertaStock,
    filtrarExistenciasVisibles,
    obtenerDiasRestantesCaducidad,
    obtenerTramoCaducidad,
    type StockAlerta
} from "@/modules/stock/utils/movimientos";

export const dynamic = "force-dynamic";

interface HomePageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps): Promise<React.ReactElement> {
    const params = await searchParams;
    const alcance = await obtenerAlcanceInventario({
        centroId: obtenerParam(params, "centroId"),
        bodegaId: obtenerParam(params, "bodegaId")
    });
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const whereInventario = {
        bodegaId: { in: alcance.bodegaIds },
        bodega: { centroId: { in: alcance.centroIds } }
    };
    const whereOrdenes = {
        centroId: { in: alcance.centroIds },
        bodegaId: { in: alcance.bodegaIds }
    };
    const [entradas, salidas, stocksBase] = alcance.bodegaIds.length === 0 ? [
        0,
        0,
        []
    ] as const : await Promise.all([
        prisma.ordenEntrada.count({ where: whereOrdenes }),
        prisma.ordenSalida.count({ where: whereOrdenes }),
        prisma.stock.findMany({
            where: whereInventario,
            include: { producto: true, bodega: { include: { centro: true } } }
        })
    ]);
    const stocksVisibles = filtrarExistenciasVisibles(stocksBase.filter((stock) => stock.producto.estado));
    const stocksConsolidados = consolidarResumenStock(stocksVisibles, hoy);
    const stockTotal = stocksConsolidados.reduce((total, stock) => total + stock.cantidadDisponible, 0);
    const productosActivos = stocksConsolidados.filter((stock) => stock.cantidadDisponible > 0 && stock.fechaCaducidad >= hoy).length;
    const alertasFiltradas = stocksConsolidados
        .filter((item) => item.alerta !== "ok" || item.tramoCaducidad !== null)
        .sort((a, b) => alertaPeso(a.alerta) - alertaPeso(b.alerta) || (a.diasCaducidad - b.diasCaducidad))
        .slice(0, 12);

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Vista segun centro y bodegas autorizadas</p>
                    <h2 className="text-2xl font-semibold">Resumen de inventario</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Filtros</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <InventarioFiltros
                            action="/"
                            centros={alcance.centros}
                            bodegas={alcance.bodegas}
                            centroId={alcance.centroId}
                            bodegaId={alcance.bodegaId}
                            puedeFiltrarCentro={alcance.puedeFiltrarCentro}
                        />
                    </CardContent>
                </Card>
                <section className="grid gap-4 md:grid-cols-4">
                    <Metric title="Stock disponible" value={formatNumber(stockTotal)} />
                    <Metric title="Productos vigentes activos" value={formatNumber(productosActivos)} />
                    <Metric title="Ordenes de entrada" value={formatNumber(entradas)} />
                    <Metric title="Ordenes de salida" value={formatNumber(salidas)} />
                </section>
                <Card>
                    <CardHeader>
                        <CardTitle>Alertas operativas</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Producto</Th>
                                    <Th>Bodega</Th>
                                    <Th>Lotes</Th>
                                    <Th>Stock</Th>
                                    <Th>Caducidad</Th>
                                    <Th>Estado</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {alertasFiltradas.map((stock) => (
                                    <tr key={stock.id} className={stock.alerta === "caducidad_proxima" ? "bg-red-50" : undefined}>
                                        <Td>{stock.productoDescripcion}</Td>
                                        <Td>{stock.centroNombre} - {stock.bodegaNombre}</Td>
                                        <Td>{formatNumber(stock.lotes)}</Td>
                                        <Td>{formatNumber(stock.cantidadDisponible)}</Td>
                                        <Td>{formatDate(stock.fechaCaducidad)}</Td>
                                        <Td>
                                            <Badge tone={stock.alerta === "sin_stock" ? "danger" : "warning"}>
                                                {stock.alerta === "sin_stock" ? "Sin stock" : stock.alerta === "stock_minimo" ? "Stock minimo" : `Caducidad <= ${stock.tramoCaducidad ?? stock.diasCaducidad} dias`}
                                            </Badge>
                                        </Td>
                                    </tr>
                                ))}
                                {alertasFiltradas.length === 0 ? (
                                    <tr>
                                        <Td colSpan={6} className="text-muted-foreground">
                                            No hay alertas por ahora.
                                        </Td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

type ResumenStockBase = Awaited<ReturnType<typeof prisma.stock.findMany>>[number] & {
    producto: {
        id: number;
        descripcion: string;
        estado: boolean;
    };
    bodega: {
        id: string;
        nombre: string;
        centro: {
            id: string;
            nombre: string;
        };
    };
};

interface ResumenStockConsolidado {
    id: string;
    productoDescripcion: string;
    centroNombre: string;
    bodegaNombre: string;
    cantidadDisponible: number;
    stockMinimo: number;
    fechaCaducidad: Date;
    lotes: number;
    alerta: StockAlerta;
    tramoCaducidad: number | null;
    diasCaducidad: number;
}

function consolidarResumenStock(stocks: ResumenStockBase[], hoy: Date): ResumenStockConsolidado[] {
    const grupos = new Map<string, ResumenStockConsolidado>();

    for (const stock of stocks) {
        const key = `${stock.bodega.centro.id}:${stock.bodega.id}:${stock.producto.id}`;
        const actual = grupos.get(key);
        if (!actual) {
            const cantidadDisponible = stock.cantidadDisponible;
            grupos.set(key, {
                id: key,
                productoDescripcion: stock.producto.descripcion,
                centroNombre: stock.bodega.centro.nombre,
                bodegaNombre: stock.bodega.nombre,
                cantidadDisponible,
                stockMinimo: calcularStockMinimo(cantidadDisponible),
                fechaCaducidad: stock.fechaCaducidad,
                lotes: 1,
                alerta: "ok",
                tramoCaducidad: null,
                diasCaducidad: obtenerDiasRestantesCaducidad(stock.fechaCaducidad, hoy)
            });
            continue;
        }

        actual.cantidadDisponible += stock.cantidadDisponible;
        actual.stockMinimo = calcularStockMinimo(actual.cantidadDisponible);
        actual.lotes += 1;
        if (stock.fechaCaducidad < actual.fechaCaducidad) {
            actual.fechaCaducidad = stock.fechaCaducidad;
            actual.diasCaducidad = obtenerDiasRestantesCaducidad(stock.fechaCaducidad, hoy);
        }
    }

    return [...grupos.values()].map((stock) => {
        const tramoCaducidad = obtenerTramoCaducidad(stock.fechaCaducidad, hoy);
        return {
            ...stock,
            alerta: evaluarAlertaStock({
                cantidadDisponible: stock.cantidadDisponible,
                stockMinimo: stock.stockMinimo,
                fechaCaducidad: stock.fechaCaducidad,
                hoy
            }),
            tramoCaducidad,
            diasCaducidad: obtenerDiasRestantesCaducidad(stock.fechaCaducidad, hoy)
        };
    });
}

function obtenerParam(params: Record<string, string | string[] | undefined> | undefined, key: string): string | undefined {
    const value = params?.[key];
    return Array.isArray(value) ? value[0] : value;
}

function alertaPeso(alerta: string): number {
    const pesos: Record<string, number> = {
        caducidad_proxima: 0,
        sin_stock: 1,
        stock_minimo: 2,
        ok: 3
    };

    return pesos[alerta] ?? 3;
}

function Metric({ title, value }: { title: string; value: string }): React.ReactElement {
    return (
        <Card>
            <CardContent>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}

import type * as React from "react";

// actions
import { listarStock } from "@/modules/stock/actions/stock.action";

// components
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Td, Th, Table } from "@/shared/components/ui/table";
import { AppLayout } from "@/shared/components/layout/app-layout";

// utils
import { formatDate, formatNumber } from "@/shared/utils/format";
import { evaluarAlertaStock } from "@/modules/stock/utils/movimientos";

export const dynamic = "force-dynamic";

export default async function StockPage(): Promise<React.ReactElement> {
    const stocks = await listarStock();

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Inventario por producto, bodega, lote y caducidad</p>
                    <h2 className="text-2xl font-semibold">Stock</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Existencias</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Centro</Th>
                                    <Th>Bodega</Th>
                                    <Th>Producto</Th>
                                    <Th>Linea</Th>
                                    <Th>Lote</Th>
                                    <Th>Caducidad</Th>
                                    <Th>Disponible</Th>
                                    <Th>Minimo</Th>
                                    <Th>Alerta</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {stocks.map((stock) => {
                                    const alerta = evaluarAlertaStock({
                                        cantidadDisponible: stock.cantidadDisponible,
                                        stockMinimo: stock.stockMinimo,
                                        fechaCaducidad: stock.fechaCaducidad
                                    });
                                    return (
                                        <tr key={stock.id}>
                                            <Td>{stock.bodega.centro.nombre}</Td>
                                            <Td>{stock.bodega.nombre}</Td>
                                            <Td>{stock.producto.descripcion}</Td>
                                            <Td>{stock.producto.linea}</Td>
                                            <Td>{stock.lote}</Td>
                                            <Td>{formatDate(stock.fechaCaducidad)}</Td>
                                            <Td>{formatNumber(stock.cantidadDisponible)}</Td>
                                            <Td>{formatNumber(stock.stockMinimo)}</Td>
                                            <Td>
                                                <Badge tone={alertaTone(alerta)}>{alertaLabel(alerta)}</Badge>
                                            </Td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
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

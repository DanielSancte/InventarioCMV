import type * as React from "react";

// components
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Td, Th, Table } from "@/shared/components/ui/table";
import { AppLayout } from "@/shared/components/layout/app-layout";

// lib
import { prisma } from "@/shared/lib/prisma";

// utils
import { formatDate, formatNumber } from "@/shared/utils/format";

export const dynamic = "force-dynamic";

export default async function HomePage(): Promise<React.ReactElement> {
    const [stockTotal, productosActivos, entradas, salidas, alertas] = await Promise.all([
        prisma.stock.aggregate({ _sum: { cantidadDisponible: true } }),
        prisma.producto.count({ where: { estado: true } }),
        prisma.ordenEntrada.count(),
        prisma.ordenSalida.count(),
        prisma.stock.findMany({
            include: { producto: true, bodega: { include: { centro: true } } },
            orderBy: { cantidadDisponible: "asc" }
        })
    ]);
    const alertasFiltradas = alertas
        .filter((stock) => stock.cantidadDisponible <= 0 || stock.cantidadDisponible <= stock.stockMinimo)
        .slice(0, 6);

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">MVP local</p>
                    <h2 className="text-2xl font-semibold">Resumen de inventario</h2>
                </div>
                <section className="grid gap-4 md:grid-cols-4">
                    <Metric title="Stock disponible" value={formatNumber(stockTotal._sum.cantidadDisponible ?? 0)} />
                    <Metric title="Productos activos" value={formatNumber(productosActivos)} />
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
                                    <Th>Lote</Th>
                                    <Th>Stock</Th>
                                    <Th>Caducidad</Th>
                                    <Th>Estado</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {alertasFiltradas.map((stock) => (
                                    <tr key={stock.id}>
                                        <Td>{stock.producto.descripcion}</Td>
                                        <Td>{stock.bodega.nombre}</Td>
                                        <Td>{stock.lote}</Td>
                                        <Td>{formatNumber(stock.cantidadDisponible)}</Td>
                                        <Td>{formatDate(stock.fechaCaducidad)}</Td>
                                        <Td>
                                            <Badge tone={stock.cantidadDisponible <= 0 ? "danger" : "warning"}>
                                                {stock.cantidadDisponible <= 0 ? "Sin stock" : "Stock minimo"}
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

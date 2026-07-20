import type * as React from "react";

// actions
import { listarOrdenesSalida } from "@/modules/orden-salida/actions/orden-salida.action";

// components
import { OrdenSalidaForm } from "@/modules/orden-salida/components/orden-salida-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Td, Th, Table } from "@/shared/components/ui/table";
import { AppLayout } from "@/shared/components/layout/app-layout";

// lib
import { prisma } from "@/shared/lib/prisma";

// utils
import { formatDate, formatNumber } from "@/shared/utils/format";

export const dynamic = "force-dynamic";

export default async function OrdenSalidaPage(): Promise<React.ReactElement> {
    const [ordenes, centros, bodegas, stocks] = await Promise.all([
        listarOrdenesSalida(),
        prisma.centro.findMany({ where: { estado: true }, orderBy: { nombre: "asc" } }),
        prisma.bodega.findMany({ where: { estado: true }, orderBy: { nombre: "asc" } }),
        prisma.stock.findMany({
            where: { cantidadDisponible: { gt: 0 } },
            include: {
                producto: { select: { descripcion: true } },
                bodega: { select: { nombre: true } }
            },
            orderBy: [{ producto: { descripcion: "asc" } }, { fechaCaducidad: "asc" }]
        })
    ]);

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Despacho y consumo con validacion de stock</p>
                    <h2 className="text-2xl font-semibold">Orden de salida</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Nueva salida</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <OrdenSalidaForm centros={centros} bodegas={bodegas} stocks={stocks} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Salidas registradas</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Fecha</Th>
                                    <Th>Tipo</Th>
                                    <Th>Destino</Th>
                                    <Th>Bodega</Th>
                                    <Th>Usuario</Th>
                                    <Th>Detalle</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordenes.map((orden) => (
                                    <tr key={orden.id}>
                                        <Td>{formatDate(orden.fecha)}</Td>
                                        <Td>{orden.tipoSalida}</Td>
                                        <Td>{orden.destino}</Td>
                                        <Td>{orden.bodega.nombre}</Td>
                                        <Td>{orden.usuario.nombre} {orden.usuario.apPaterno}</Td>
                                        <Td>
                                            {orden.detalles.map((detalle) => (
                                                <div key={detalle.id}>
                                                    {detalle.producto.descripcion}: {formatNumber(detalle.cantidad)} · {detalle.lote}
                                                </div>
                                            ))}
                                        </Td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

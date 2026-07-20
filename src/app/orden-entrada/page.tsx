import type * as React from "react";

// actions
import { listarOrdenesEntrada } from "@/modules/orden-entrada/actions/orden-entrada.action";
import { listarProductos } from "@/modules/productos/actions/productos.action";

// components
import { OrdenEntradaForm } from "@/modules/orden-entrada/components/orden-entrada-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Td, Th, Table } from "@/shared/components/ui/table";
import { AppLayout } from "@/shared/components/layout/app-layout";

// lib
import { prisma } from "@/shared/lib/prisma";

// utils
import { formatDate, formatNumber } from "@/shared/utils/format";

export const dynamic = "force-dynamic";

export default async function OrdenEntradaPage(): Promise<React.ReactElement> {
    const [ordenes, centros, bodegas, productos] = await Promise.all([
        listarOrdenesEntrada(),
        prisma.centro.findMany({ where: { estado: true }, orderBy: { nombre: "asc" } }),
        prisma.bodega.findMany({ where: { estado: true }, orderBy: { nombre: "asc" } }),
        listarProductos()
    ]);

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Recepcion de productos y aumento de stock</p>
                    <h2 className="text-2xl font-semibold">Orden de entrada</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Nueva entrada</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <OrdenEntradaForm centros={centros} bodegas={bodegas} productos={productos} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Entradas registradas</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Fecha</Th>
                                    <Th>Origen</Th>
                                    <Th>Centro</Th>
                                    <Th>Bodega</Th>
                                    <Th>Usuario</Th>
                                    <Th>Detalle</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {ordenes.map((orden) => (
                                    <tr key={orden.id}>
                                        <Td>{formatDate(orden.fecha)}</Td>
                                        <Td>{orden.origen}</Td>
                                        <Td>{orden.centro.nombre}</Td>
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

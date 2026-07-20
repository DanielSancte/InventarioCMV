import type * as React from "react";

// actions
import { listarReporteConsumoMensual } from "@/modules/reporte/actions/reporte.action";

// components
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Td, Th, Table } from "@/shared/components/ui/table";
import { AppLayout } from "@/shared/components/layout/app-layout";

// utils
import { formatNumber } from "@/shared/utils/format";

export const dynamic = "force-dynamic";

const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default async function ReportePage(): Promise<React.ReactElement> {
    const reporte = await listarReporteConsumoMensual();

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Consumo por centro, bodega y producto</p>
                    <h2 className="text-2xl font-semibold">Reporte mensual</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Consumo anual</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Centro</Th>
                                    <Th>Bodega</Th>
                                    <Th>Producto</Th>
                                    <Th>Stock actual</Th>
                                    {meses.map((mes) => (
                                        <Th key={mes}>{mes.slice(0, 3)}</Th>
                                    ))}
                                    <Th>Anual</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {reporte.map((fila) => (
                                    <tr key={`${fila.centro}-${fila.bodega}-${fila.productoId}`}>
                                        <Td>{fila.centro}</Td>
                                        <Td>{fila.bodega}</Td>
                                        <Td>{fila.descripcion}</Td>
                                        <Td>{formatNumber(fila.stockActual)}</Td>
                                        {meses.map((mes) => (
                                            <Td key={mes}>{formatNumber(fila.meses[mes] ?? 0)}</Td>
                                        ))}
                                        <Td>{formatNumber(fila.consumoAnual)}</Td>
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

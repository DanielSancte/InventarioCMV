import type * as React from "react";

// actions
import { listarProductos, listarUnidades } from "@/modules/productos/actions/productos.action";

// components
import { ProductoForm } from "@/modules/productos/components/producto-form";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Td, Th, Table } from "@/shared/components/ui/table";
import { AppLayout } from "@/shared/components/layout/app-layout";

export const dynamic = "force-dynamic";

export default async function ProductosPage(): Promise<React.ReactElement> {
    const [productos, unidades] = await Promise.all([listarProductos(), listarUnidades()]);

    return (
        <AppLayout>
            <div className="space-y-6">
                <div>
                    <p className="text-sm text-muted-foreground">Catalogo base para movimientos</p>
                    <h2 className="text-2xl font-semibold">Productos</h2>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Nuevo producto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ProductoForm unidades={unidades} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Productos registrados</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <thead>
                                <tr>
                                    <Th>ID</Th>
                                    <Th>Linea</Th>
                                    <Th>Descripcion</Th>
                                    <Th>Unidad</Th>
                                    <Th>Estado</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map((producto) => (
                                    <tr key={producto.id}>
                                        <Td>{producto.id}</Td>
                                        <Td>{producto.linea}</Td>
                                        <Td>{producto.descripcion}</Td>
                                        <Td>{producto.unidad?.descripcion ?? "Sin unidad"}</Td>
                                        <Td>
                                            <Badge tone={producto.estado ? "success" : "muted"}>
                                                {producto.estado ? "Activo" : "Inactivo"}
                                            </Badge>
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

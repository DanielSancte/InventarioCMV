import type * as React from "react";

// actions
import { listarOrdenesEntrada } from "@/modules/orden-entrada/actions/orden-entrada.action";
import { listarProductosActivos } from "@/modules/productos/actions/productos.action";

// components
import { OrdenEntradaForm } from "@/modules/orden-entrada/components/orden-entrada-form";
import { OrdenEntradaTable } from "@/modules/orden-entrada/components/orden-entrada-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { AppLayout } from "@/shared/components/layout/app-layout";

// lib
import { obtenerAlcanceInventario } from "@/shared/lib/inventario-alcance";

export const dynamic = "force-dynamic";

export default async function OrdenEntradaPage(): Promise<React.ReactElement> {
    const [ordenes, alcance, productos] = await Promise.all([
        listarOrdenesEntrada(),
        obtenerAlcanceInventario(),
        listarProductosActivos()
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
                        <OrdenEntradaForm
                            centros={alcance.centros}
                            bodegas={alcance.bodegas}
                            productos={productos}
                            centroId={alcance.centroId}
                            bodegaId={alcance.bodegaId}
                            puedeFiltrarCentro={alcance.puedeFiltrarCentro}
                        />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Entradas registradas ultimos 90 dias</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <OrdenEntradaTable ordenes={ordenes} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

"use client";

import type * as React from "react";

// components
import { SimpleModal } from "@/shared/components/ui/simple-modal";
import { Table, Td, Th } from "@/shared/components/ui/table";

// utils
import { formatDate, formatNumber } from "@/shared/utils/format";

interface EntradaDetalleVista {
    id: string;
    cantidad: number;
    lote: string;
    fechaCaducidad: Date;
    producto: {
        descripcion: string;
    };
}

interface EntradaVista {
    id: string;
    fecha: Date;
    origen: string;
    centro: {
        nombre: string;
    };
    bodega: {
        nombre: string;
    };
    usuario: {
        nombre: string;
        apPaterno: string | null;
    };
    detalles: EntradaDetalleVista[];
}

export function OrdenEntradaTable({ ordenes }: { ordenes: EntradaVista[] }): React.ReactElement {
    return (
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
                            <SimpleModal title={`Detalle entrada ${formatDate(orden.fecha)}`} triggerLabel="Ver detalle">
                                <Table>
                                    <thead>
                                        <tr>
                                            <Th>Producto</Th>
                                            <Th>Cantidad</Th>
                                            <Th>Lote</Th>
                                            <Th>Vencimiento</Th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orden.detalles.map((detalle) => (
                                            <tr key={detalle.id}>
                                                <Td>{detalle.producto.descripcion}</Td>
                                                <Td>{formatNumber(detalle.cantidad)}</Td>
                                                <Td>{detalle.lote}</Td>
                                                <Td>{formatDate(detalle.fechaCaducidad)}</Td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </SimpleModal>
                        </Td>
                    </tr>
                ))}
                {ordenes.length === 0 ? (
                    <tr>
                        <Td colSpan={6} className="text-muted-foreground">
                            No hay entradas registradas por el usuario en los ultimos 90 dias.
                        </Td>
                    </tr>
                ) : null}
            </tbody>
        </Table>
    );
}

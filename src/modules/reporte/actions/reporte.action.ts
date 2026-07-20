"use server";

// lib
import { prisma } from "@/shared/lib/prisma";

export interface ReporteConsumoMensual {
    centro: string;
    bodega: string;
    productoId: number;
    descripcion: string;
    linea: string;
    stockActual: number;
    meses: Record<string, number>;
    consumoAnual: number;
}

const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre"
] as const;

export async function listarReporteConsumoMensual(anio = new Date().getFullYear()): Promise<ReporteConsumoMensual[]> {
    const [salidas, stocks] = await Promise.all([
        prisma.ordenSalidaDetalle.findMany({
            where: {
                ordenSalida: {
                    fecha: {
                        gte: new Date(`${anio}-01-01T00:00:00.000Z`),
                        lt: new Date(`${anio + 1}-01-01T00:00:00.000Z`)
                    }
                }
            },
            include: {
                producto: true,
                ordenSalida: {
                    include: {
                        bodega: {
                            include: { centro: true }
                        }
                    }
                }
            }
        }),
        prisma.stock.findMany({
            include: {
                producto: true,
                bodega: {
                    include: { centro: true }
                }
            }
        })
    ]);

    const reporte = new Map<string, ReporteConsumoMensual>();

    for (const stock of stocks) {
        const key = crearKey(stock.bodega.centro.nombre, stock.bodega.nombre, stock.productoId);
        const existente = reporte.get(key) ?? crearFila(stock.bodega.centro.nombre, stock.bodega.nombre, stock.productoId, stock.producto.descripcion, stock.producto.linea);
        existente.stockActual += stock.cantidadDisponible;
        reporte.set(key, existente);
    }

    for (const salida of salidas) {
        const centro = salida.ordenSalida.bodega.centro.nombre;
        const bodega = salida.ordenSalida.bodega.nombre;
        const key = crearKey(centro, bodega, salida.productoId);
        const fila = reporte.get(key) ?? crearFila(centro, bodega, salida.productoId, salida.producto.descripcion, salida.producto.linea);
        const mes = meses[salida.ordenSalida.fecha.getMonth()];
        fila.meses[mes] += salida.cantidad;
        fila.consumoAnual += salida.cantidad;
        reporte.set(key, fila);
    }

    return [...reporte.values()].sort((a, b) => `${a.centro}${a.bodega}${a.descripcion}`.localeCompare(`${b.centro}${b.bodega}${b.descripcion}`));
}

function crearFila(centro: string, bodega: string, productoId: number, descripcion: string, linea: string): ReporteConsumoMensual {
    return {
        centro,
        bodega,
        productoId,
        descripcion,
        linea,
        stockActual: 0,
        meses: Object.fromEntries(meses.map((mes) => [mes, 0])),
        consumoAnual: 0
    };
}

function crearKey(centro: string, bodega: string, productoId: number): string {
    return `${centro}::${bodega}::${productoId}`;
}

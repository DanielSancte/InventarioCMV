"use server";

// lib
import { obtenerAlcanceInventario } from "@/shared/lib/inventario-alcance";
import { prisma } from "@/shared/lib/prisma";

// utils
import {
    calcularStockMinimo,
    evaluarAlertaStock,
    filtrarExistenciasVisibles,
    obtenerDiasRestantesCaducidad,
    type StockAlerta
} from "@/modules/stock/utils/movimientos";

export type StockSortKey = "centro" | "bodega" | "producto" | "linea" | "disponible" | "minimo" | "alerta";
export type SortDirection = "asc" | "desc";

export interface ListarStockInput {
    centroId?: string;
    bodegaId?: string;
    busqueda?: string;
    sort?: StockSortKey;
    direction?: SortDirection;
}

export interface StockLoteVista {
    id: string;
    lote: string;
    fechaCaducidad: Date;
    cantidadDisponible: number;
}

export interface StockConsolidadoVista {
    id: string;
    centroId: string;
    centroNombre: string;
    bodegaId: string;
    bodegaNombre: string;
    productoId: number;
    productoDescripcion: string;
    linea: string;
    cantidadDisponible: number;
    stockMinimo: number;
    alerta: StockAlerta;
    diasCaducidadMinimos: number | null;
    lotes: StockLoteVista[];
}

export interface ListarStockResult {
    centros: Awaited<ReturnType<typeof obtenerAlcanceInventario>>["centros"];
    bodegas: Awaited<ReturnType<typeof obtenerAlcanceInventario>>["bodegas"];
    centroId: string | null;
    bodegaId: string | null;
    puedeFiltrarCentro: boolean;
    busqueda: string;
    sort: StockSortKey;
    direction: SortDirection;
    stocks: StockConsolidadoVista[];
}

export async function listarStock() {
    return prisma.stock.findMany({
        include: {
            producto: true,
            bodega: {
                include: {
                    centro: true
                }
            }
        },
        orderBy: [
            { bodega: { nombre: "asc" } },
            { producto: { descripcion: "asc" } },
            { fechaCaducidad: "asc" }
        ]
    });
}

export async function listarStockConsolidado(input: ListarStockInput = {}): Promise<ListarStockResult> {
    const alcance = await obtenerAlcanceInventario({ centroId: input.centroId, bodegaId: input.bodegaId });
    const busqueda = input.busqueda?.trim() ?? "";
    const sort = input.sort ?? "producto";
    const direction = input.direction ?? "asc";

    if (alcance.bodegaIds.length === 0 || alcance.centroIds.length === 0) {
        return {
            centros: alcance.centros,
            bodegas: alcance.bodegas,
            centroId: alcance.centroId,
            bodegaId: alcance.bodegaId,
            puedeFiltrarCentro: alcance.puedeFiltrarCentro,
            busqueda,
            sort,
            direction,
            stocks: []
        };
    }

    const productoIdBusqueda = /^\d+$/.test(busqueda) ? Number(busqueda) : null;
    const lotes = await prisma.stock.findMany({
        where: {
            bodegaId: { in: alcance.bodegaIds },
            bodega: { centroId: { in: alcance.centroIds } },
            ...(busqueda.length > 0 ? {
                OR: [
                    { producto: { descripcion: { contains: busqueda } } },
                    ...(productoIdBusqueda ? [{ productoId: productoIdBusqueda }] : [])
                ]
            } : {})
        },
        include: {
            producto: true,
            bodega: {
                include: {
                    centro: true
                }
            }
        }
    });
    const stocks = ordenarStockConsolidado(consolidarLotes(filtrarExistenciasVisibles(lotes)), sort, direction);

    return {
        centros: alcance.centros,
        bodegas: alcance.bodegas,
        centroId: alcance.centroId,
        bodegaId: alcance.bodegaId,
        puedeFiltrarCentro: alcance.puedeFiltrarCentro,
        busqueda,
        sort,
        direction,
        stocks
    };
}

type StockLotePrisma = Awaited<ReturnType<typeof prisma.stock.findMany>>[number] & {
    producto: {
        id: number;
        descripcion: string;
        linea: string;
    };
    bodega: {
        id: string;
        nombre: string;
        centroId: string;
        centro: {
            id: string;
            nombre: string;
        };
    };
};

function consolidarLotes(lotes: StockLotePrisma[]): StockConsolidadoVista[] {
    const agrupados = new Map<string, StockConsolidadoVista>();

    for (const lote of lotes) {
        const key = `${lote.bodegaId}:${lote.productoId}`;
        const actual = agrupados.get(key);
        if (!actual) {
            agrupados.set(key, {
                id: key,
                centroId: lote.bodega.centro.id,
                centroNombre: lote.bodega.centro.nombre,
                bodegaId: lote.bodega.id,
                bodegaNombre: lote.bodega.nombre,
                productoId: lote.producto.id,
                productoDescripcion: lote.producto.descripcion,
                linea: lote.producto.linea,
                cantidadDisponible: lote.cantidadDisponible,
                stockMinimo: calcularStockMinimo(lote.cantidadDisponible),
                alerta: "ok",
                diasCaducidadMinimos: obtenerDiasRestantesCaducidad(lote.fechaCaducidad),
                lotes: [crearLoteVista(lote)]
            });
            continue;
        }

        actual.cantidadDisponible += lote.cantidadDisponible;
        actual.stockMinimo = calcularStockMinimo(actual.cantidadDisponible);
        actual.diasCaducidadMinimos = Math.min(
            actual.diasCaducidadMinimos ?? Number.MAX_SAFE_INTEGER,
            obtenerDiasRestantesCaducidad(lote.fechaCaducidad)
        );
        actual.lotes.push(crearLoteVista(lote));
    }

    return [...agrupados.values()].map((stock) => ({
        ...stock,
        alerta: evaluarAlertaStock({
            cantidadDisponible: stock.cantidadDisponible,
            stockMinimo: stock.stockMinimo,
            fechaCaducidad: obtenerFechaCaducidadMasProxima(stock.lotes)
        }),
        lotes: stock.lotes.sort((a, b) => a.fechaCaducidad.getTime() - b.fechaCaducidad.getTime())
    }));
}

function crearLoteVista(lote: StockLotePrisma): StockLoteVista {
    return {
        id: lote.id,
        lote: lote.lote,
        fechaCaducidad: lote.fechaCaducidad,
        cantidadDisponible: lote.cantidadDisponible
    };
}

function obtenerFechaCaducidadMasProxima(lotes: StockLoteVista[]): Date {
    return lotes.reduce((menor, lote) => lote.fechaCaducidad < menor ? lote.fechaCaducidad : menor, lotes[0]?.fechaCaducidad ?? new Date());
}

function ordenarStockConsolidado(stocks: StockConsolidadoVista[], sort: StockSortKey, direction: SortDirection): StockConsolidadoVista[] {
    const multiplier = direction === "asc" ? 1 : -1;
    const alertaPeso: Record<StockAlerta, number> = {
        sin_stock: 0,
        stock_minimo: 1,
        caducidad_proxima: 2,
        ok: 3
    };

    return [...stocks].sort((a, b) => {
        const resultado = compararStock(a, b, sort, alertaPeso);
        if (resultado !== 0) {
            return resultado * multiplier;
        }

        return a.productoDescripcion.localeCompare(b.productoDescripcion, "es") || a.bodegaNombre.localeCompare(b.bodegaNombre, "es");
    });
}

function compararStock(
    a: StockConsolidadoVista,
    b: StockConsolidadoVista,
    sort: StockSortKey,
    alertaPeso: Record<StockAlerta, number>
): number {
    if (sort === "disponible") {
        return a.cantidadDisponible - b.cantidadDisponible;
    }
    if (sort === "minimo") {
        return a.stockMinimo - b.stockMinimo;
    }
    if (sort === "alerta") {
        return alertaPeso[a.alerta] - alertaPeso[b.alerta];
    }
    if (sort === "centro") {
        return a.centroNombre.localeCompare(b.centroNombre, "es");
    }
    if (sort === "bodega") {
        return a.bodegaNombre.localeCompare(b.bodegaNombre, "es");
    }
    if (sort === "linea") {
        return a.linea.localeCompare(b.linea, "es");
    }

    return a.productoDescripcion.localeCompare(b.productoDescripcion, "es");
}

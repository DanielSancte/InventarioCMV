export interface StockMovimiento {
    cantidadActual: number;
    cantidadMovimiento: number;
}

export interface StockAlertaInput {
    cantidadDisponible: number;
    stockMinimo: number;
    fechaCaducidad: Date;
    hoy?: Date;
}

export type StockAlerta = "sin_stock" | "stock_minimo" | "caducidad_proxima" | "ok";
export const DIAS_ALERTA_CADUCIDAD = [90, 60, 30, 15, 10, 5, 4, 3, 2, 1] as const;

export function sumarEntrada(input: StockMovimiento): number {
    validarCantidadPositiva(input.cantidadMovimiento);
    return input.cantidadActual + input.cantidadMovimiento;
}

export function descontarSalida(input: StockMovimiento): number {
    validarCantidadPositiva(input.cantidadMovimiento);
    const nuevoStock = input.cantidadActual - input.cantidadMovimiento;

    if (nuevoStock < 0) {
        throw new Error("Stock insuficiente para registrar la salida.");
    }

    return nuevoStock;
}

export function validarFechaSalida(fecha: Date, hoy: Date = new Date()): boolean {
    const fechaNormalizada = soloFecha(fecha).getTime();
    const hoyNormalizado = soloFecha(hoy).getTime();
    const sieteDiasAntes = hoyNormalizado - 7 * 24 * 60 * 60 * 1000;

    return fechaNormalizada <= hoyNormalizado && fechaNormalizada >= sieteDiasAntes;
}

export function validarFechaOrdenEntrada(fecha: Date, hoy: Date = new Date()): boolean {
    return validarFechaSalida(fecha, hoy);
}

export function evaluarAlertaStock(input: StockAlertaInput): StockAlerta {
    if (input.cantidadDisponible <= 0) {
        return "sin_stock";
    }

    if (input.cantidadDisponible <= input.stockMinimo) {
        return "stock_minimo";
    }

    const hoy = soloFecha(input.hoy ?? new Date()).getTime();
    const caducidad = soloFecha(input.fechaCaducidad).getTime();
    const diasRestantes = Math.ceil((caducidad - hoy) / (24 * 60 * 60 * 1000));

    if (diasRestantes >= 1 && diasRestantes <= DIAS_ALERTA_CADUCIDAD[0]) {
        return "caducidad_proxima";
    }

    return "ok";
}

export function obtenerDiasRestantesCaducidad(fechaCaducidad: Date, hoy: Date = new Date()): number {
    const hoyNormalizado = soloFecha(hoy).getTime();
    const caducidad = soloFecha(fechaCaducidad).getTime();

    return Math.ceil((caducidad - hoyNormalizado) / (24 * 60 * 60 * 1000));
}

export function obtenerTramoCaducidad(fechaCaducidad: Date, hoy: Date = new Date()): number | null {
    const diasRestantes = obtenerDiasRestantesCaducidad(fechaCaducidad, hoy);

    if (diasRestantes < 1 || diasRestantes > DIAS_ALERTA_CADUCIDAD[0]) {
        return null;
    }

    return [...DIAS_ALERTA_CADUCIDAD].reverse().find((dias) => diasRestantes <= dias) ?? 1;
}

export interface StockLoteConsolidable {
    productoId: number;
    bodegaId: string;
    cantidadDisponible: number;
    stockMinimo: number;
}

export interface StockConsolidadoBasico {
    productoId: number;
    bodegaId: string;
    cantidadDisponible: number;
    stockMinimo: number;
}

export interface StockLoteFiltrable {
    productoId: number;
    bodegaId: string;
    cantidadDisponible: number;
}

export function calcularStockMinimo(cantidad: number): number {
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
        return 0;
    }

    return Math.ceil(cantidad * 0.1);
}

export function filtrarExistenciasVisibles<T extends StockLoteFiltrable>(stocks: T[]): T[] {
    const grupos = new Map<string, T[]>();

    for (const stock of stocks) {
        const key = `${stock.productoId}:${stock.bodegaId}`;
        grupos.set(key, [...(grupos.get(key) ?? []), stock]);
    }

    return [...grupos.values()].flatMap((grupo) => {
        const conExistencia = grupo.filter((stock) => stock.cantidadDisponible > 0);

        if (conExistencia.length > 0) {
            return conExistencia;
        }

        return grupo.length === 1 ? grupo : [];
    });
}

export function consolidarStockPorProductoBodega<T extends StockLoteConsolidable>(stocks: T[]): StockConsolidadoBasico[] {
    const acumulados = new Map<string, StockConsolidadoBasico>();

    for (const stock of stocks) {
        const key = `${stock.productoId}:${stock.bodegaId}`;
        const actual = acumulados.get(key);
        if (!actual) {
            acumulados.set(key, {
                productoId: stock.productoId,
                bodegaId: stock.bodegaId,
                cantidadDisponible: stock.cantidadDisponible,
                stockMinimo: calcularStockMinimo(stock.cantidadDisponible)
            });
            continue;
        }

        actual.cantidadDisponible += stock.cantidadDisponible;
        actual.stockMinimo = calcularStockMinimo(actual.cantidadDisponible);
    }

    return [...acumulados.values()];
}

function validarCantidadPositiva(cantidad: number): void {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error("La cantidad debe ser un entero positivo.");
    }
}

function soloFecha(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

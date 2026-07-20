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

    if (diasRestantes >= 0 && diasRestantes <= 30) {
        return "caducidad_proxima";
    }

    return "ok";
}

function validarCantidadPositiva(cantidad: number): void {
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error("La cantidad debe ser un entero positivo.");
    }
}

function soloFecha(value: Date): Date {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

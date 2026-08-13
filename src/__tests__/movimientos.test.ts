import { describe, expect, it } from "vitest";

// utils
import {
    calcularStockMinimo,
    consolidarStockPorProductoBodega,
    descontarSalida,
    evaluarAlertaStock,
    filtrarExistenciasVisibles,
    obtenerTramoCaducidad,
    sumarEntrada,
    validarFechaOrdenEntrada,
    validarFechaSalida
} from "@/modules/stock/utils/movimientos";

describe("movimientos de stock", () => {
    it("suma una entrada al stock actual", () => {
        expect(sumarEntrada({ cantidadActual: 10, cantidadMovimiento: 5 })).toBe(15);
    });

    it("descuenta una salida cuando hay stock suficiente", () => {
        expect(descontarSalida({ cantidadActual: 10, cantidadMovimiento: 4 })).toBe(6);
    });

    it("rechaza una salida con stock insuficiente", () => {
        expect(() => descontarSalida({ cantidadActual: 2, cantidadMovimiento: 4 })).toThrow("Stock insuficiente");
    });

    it("valida salidas solo dentro de los ultimos 7 dias", () => {
        const hoy = new Date(2026, 6, 20, 12);

        expect(validarFechaSalida(new Date(2026, 6, 20), hoy)).toBe(true);
        expect(validarFechaSalida(new Date(2026, 6, 13), hoy)).toBe(true);
        expect(validarFechaSalida(new Date(2026, 6, 12), hoy)).toBe(false);
        expect(validarFechaSalida(new Date(2026, 6, 21), hoy)).toBe(false);
    });

    it("valida entradas solo dentro de los ultimos 7 dias", () => {
        const hoy = new Date(2026, 6, 20, 12);

        expect(validarFechaOrdenEntrada(new Date(2026, 6, 20), hoy)).toBe(true);
        expect(validarFechaOrdenEntrada(new Date(2026, 6, 13), hoy)).toBe(true);
        expect(validarFechaOrdenEntrada(new Date(2026, 6, 12), hoy)).toBe(false);
        expect(validarFechaOrdenEntrada(new Date(2026, 6, 21), hoy)).toBe(false);
    });

    it("clasifica alertas de stock y caducidad", () => {
        const hoy = new Date("2026-07-20T00:00:00.000Z");

        expect(evaluarAlertaStock({ cantidadDisponible: 0, stockMinimo: 5, fechaCaducidad: new Date("2027-01-01"), hoy })).toBe("sin_stock");
        expect(evaluarAlertaStock({ cantidadDisponible: 5, stockMinimo: 5, fechaCaducidad: new Date("2027-01-01"), hoy })).toBe("stock_minimo");
        expect(evaluarAlertaStock({ cantidadDisponible: 10, stockMinimo: 5, fechaCaducidad: new Date("2026-10-18"), hoy })).toBe("caducidad_proxima");
        expect(evaluarAlertaStock({ cantidadDisponible: 10, stockMinimo: 5, fechaCaducidad: new Date("2027-08-01"), hoy })).toBe("ok");
    });

    it("resuelve tramos de caducidad hasta 90 dias", () => {
        const hoy = new Date(2026, 6, 20, 12);

        expect(obtenerTramoCaducidad(new Date(2026, 9, 18), hoy)).toBe(90);
        expect(obtenerTramoCaducidad(new Date(2026, 8, 18), hoy)).toBe(60);
        expect(obtenerTramoCaducidad(new Date(2026, 7, 4), hoy)).toBe(15);
        expect(obtenerTramoCaducidad(new Date(2026, 6, 25), hoy)).toBe(5);
        expect(obtenerTramoCaducidad(new Date(2026, 6, 21), hoy)).toBe(1);
        expect(obtenerTramoCaducidad(new Date(2026, 9, 19), hoy)).toBeNull();
    });

    it("consolida stock por producto y bodega desde distintos lotes", () => {
        expect(consolidarStockPorProductoBodega([
            { productoId: 1, bodegaId: "b1", cantidadDisponible: 10, stockMinimo: 5 },
            { productoId: 1, bodegaId: "b1", cantidadDisponible: 20, stockMinimo: 8 },
            { productoId: 1, bodegaId: "b2", cantidadDisponible: 7, stockMinimo: 3 }
        ])).toEqual([
            { productoId: 1, bodegaId: "b1", cantidadDisponible: 30, stockMinimo: 3 },
            { productoId: 1, bodegaId: "b2", cantidadDisponible: 7, stockMinimo: 1 }
        ]);
    });

    it("calcula stock minimo como 10 por ciento redondeado hacia arriba", () => {
        expect(calcularStockMinimo(0)).toBe(0);
        expect(calcularStockMinimo(1)).toBe(1);
        expect(calcularStockMinimo(10)).toBe(1);
        expect(calcularStockMinimo(11)).toBe(2);
        expect(calcularStockMinimo(30)).toBe(3);
    });

    it("omite lotes en cero si el producto tiene otros lotes con existencia", () => {
        expect(filtrarExistenciasVisibles([
            { productoId: 1, bodegaId: "b1", cantidadDisponible: 0, lote: "A" },
            { productoId: 1, bodegaId: "b1", cantidadDisponible: 3, lote: "B" },
            { productoId: 2, bodegaId: "b1", cantidadDisponible: 5, lote: "C" }
        ])).toEqual([
            { productoId: 1, bodegaId: "b1", cantidadDisponible: 3, lote: "B" },
            { productoId: 2, bodegaId: "b1", cantidadDisponible: 5, lote: "C" }
        ]);
    });

    it("mantiene una unica existencia en cero como alerta visible", () => {
        expect(filtrarExistenciasVisibles([
            { productoId: 1, bodegaId: "b1", cantidadDisponible: 0, lote: "A" }
        ])).toEqual([
            { productoId: 1, bodegaId: "b1", cantidadDisponible: 0, lote: "A" }
        ]);
    });
});

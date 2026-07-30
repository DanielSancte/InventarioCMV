import { describe, expect, it } from "vitest";

// utils
import { descontarSalida, evaluarAlertaStock, sumarEntrada, validarFechaSalida } from "@/modules/stock/utils/movimientos";

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

    it("clasifica alertas de stock y caducidad", () => {
        const hoy = new Date("2026-07-20T00:00:00.000Z");

        expect(evaluarAlertaStock({ cantidadDisponible: 0, stockMinimo: 5, fechaCaducidad: new Date("2027-01-01"), hoy })).toBe("sin_stock");
        expect(evaluarAlertaStock({ cantidadDisponible: 5, stockMinimo: 5, fechaCaducidad: new Date("2027-01-01"), hoy })).toBe("stock_minimo");
        expect(evaluarAlertaStock({ cantidadDisponible: 10, stockMinimo: 5, fechaCaducidad: new Date("2026-08-01"), hoy })).toBe("caducidad_proxima");
        expect(evaluarAlertaStock({ cantidadDisponible: 10, stockMinimo: 5, fechaCaducidad: new Date("2027-08-01"), hoy })).toBe("ok");
    });
});

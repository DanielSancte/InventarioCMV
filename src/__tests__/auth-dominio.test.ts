import { describe, expect, it } from "vitest";

// utils
import { esCorreoInstitucional, normalizarEmail, obtenerDominio } from "@/modules/auth/utils/dominio";

describe("esCorreoInstitucional", () => {
    it("acepta los correos institucionales habilitados", () => {
        expect(esCorreoInstitucional("rvergara@cmvalparaiso.cl")).toBe(true);
        expect(esCorreoInstitucional("dsantibanez@cmvalparaiso.cl")).toBe(true);
    });

    it("acepta correos con mayusculas y espacios alrededor", () => {
        expect(esCorreoInstitucional("  RVergara@CMValparaiso.CL ")).toBe(true);
    });

    it("rechaza cuentas personales de Gmail", () => {
        expect(esCorreoInstitucional("rvergara@gmail.com")).toBe(false);
        expect(esCorreoInstitucional("dsantibanez@googlemail.com")).toBe(false);
    });

    it("rechaza otros dominios externos", () => {
        expect(esCorreoInstitucional("usuario@hotmail.com")).toBe(false);
        expect(esCorreoInstitucional("admin@cmv.local")).toBe(false);
    });

    it("rechaza dominios que solo contienen al institucional", () => {
        expect(esCorreoInstitucional("usuario@cmvalparaiso.cl.attacker.com")).toBe(false);
        expect(esCorreoInstitucional("usuario@sub.cmvalparaiso.cl")).toBe(false);
        expect(esCorreoInstitucional("usuario@notcmvalparaiso.cl")).toBe(false);
    });

    it("rechaza valores vacios o mal formados", () => {
        expect(esCorreoInstitucional(null)).toBe(false);
        expect(esCorreoInstitucional(undefined)).toBe(false);
        expect(esCorreoInstitucional("")).toBe(false);
        expect(esCorreoInstitucional("cmvalparaiso.cl")).toBe(false);
        expect(esCorreoInstitucional("@cmvalparaiso.cl")).toBe(false);
        expect(esCorreoInstitucional("usuario@@cmvalparaiso.cl")).toBe(false);
        expect(esCorreoInstitucional("usuario@gmail.com@cmvalparaiso.cl")).toBe(false);
    });
});

describe("normalizarEmail", () => {
    it("recorta espacios y pasa a minusculas", () => {
        expect(normalizarEmail("  RVergara@CMValparaiso.CL  ")).toBe("rvergara@cmvalparaiso.cl");
    });

    it("convierte nulos en cadena vacia", () => {
        expect(normalizarEmail(null)).toBe("");
        expect(normalizarEmail(undefined)).toBe("");
    });
});

describe("obtenerDominio", () => {
    it("extrae el dominio del correo", () => {
        expect(obtenerDominio("rvergara@cmvalparaiso.cl")).toBe("cmvalparaiso.cl");
    });

    it("retorna cadena vacia si el formato es invalido", () => {
        expect(obtenerDominio("sin-arroba")).toBe("");
        expect(obtenerDominio("usuario@")).toBe("");
    });
});

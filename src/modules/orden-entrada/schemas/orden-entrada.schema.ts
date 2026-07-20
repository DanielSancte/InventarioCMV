import { z } from "zod";

export const ordenEntradaDetalleSchema = z.object({
    productoId: z.coerce.number().int().positive(),
    categoria: z.string().min(1, "La categoria es requerida."),
    fechaCaducidad: z.coerce.date(),
    cantidad: z.coerce.number().int().positive("La cantidad debe ser positiva."),
    lote: z.string().trim().min(3, "El lote debe tener al menos 3 caracteres.")
});

export const crearOrdenEntradaSchema = z.object({
    fecha: z.coerce.date(),
    origen: z.string().min(1, "El origen es requerido."),
    guiaDespacho: z.string().optional(),
    centroId: z.string().min(1),
    bodegaId: z.string().min(1),
    codigoRecepcion: z.string().optional(),
    detalles: z.array(ordenEntradaDetalleSchema).min(1, "Debe ingresar al menos un detalle.")
});

export type CrearOrdenEntradaInput = z.infer<typeof crearOrdenEntradaSchema>;
export type OrdenEntradaDetalleInput = z.infer<typeof ordenEntradaDetalleSchema>;

import { z } from "zod";

function esFechaHoyOFutura(fecha: Date): boolean {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const caducidad = new Date(fecha);
    caducidad.setHours(0, 0, 0, 0);
    return caducidad.getTime() >= hoy.getTime();
}

export const ordenEntradaDetalleSchema = z.object({
    productoId: z.coerce.number().int().positive(),
    categoria: z.string().min(1, "La categoria es requerida."),
    fechaCaducidad: z.coerce.date().refine((fecha) => esFechaHoyOFutura(fecha), {
        message: "La caducidad no puede ser anterior a hoy."
    }),
    cantidad: z.coerce.number().int().positive("La cantidad debe ser positiva."),
    lote: z.string().trim().min(3, "El lote debe tener al menos 3 caracteres.")
});

export const ordenEntradaDetalleFormSchema = ordenEntradaDetalleSchema.omit({ categoria: true });

export const crearOrdenEntradaSchema = z.object({
    fecha: z.coerce.date(),
    origen: z.string().min(1, "El origen es requerido."),
    guiaDespacho: z.string().optional(),
    centroId: z.string().min(1),
    bodegaId: z.string().min(1),
    codigoRecepcion: z.string().optional(),
    detalles: z.array(ordenEntradaDetalleFormSchema).min(1, "Debe ingresar al menos un detalle.")
});

export type CrearOrdenEntradaInput = z.infer<typeof crearOrdenEntradaSchema>;
export type OrdenEntradaDetalleInput = z.infer<typeof ordenEntradaDetalleSchema>;

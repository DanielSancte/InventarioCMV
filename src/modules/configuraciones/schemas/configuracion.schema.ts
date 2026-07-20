import { z } from "zod";

export const centroSchema = z.object({
    nombre: z.string().min(3),
    estado: z.coerce.boolean().default(true)
});

export const bodegaSchema = z.object({
    nombre: z.string().min(3),
    centroId: z.string().min(1),
    estado: z.coerce.boolean().default(true)
});

export const unidadSchema = z.object({
    descripcion: z.string().min(2)
});

export const usuarioSchema = z.object({
    nombre: z.string().min(2),
    apPaterno: z.string().min(2),
    apMaterno: z.string().optional(),
    rolId: z.string().min(1),
    centroId: z.string().min(1),
    bodegaId: z.string().optional(),
    telefono: z.string().optional(),
    email: z.string().email(),
    estado: z.coerce.boolean().default(true)
});

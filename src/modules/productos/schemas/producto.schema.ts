import { z } from "zod";

export const productoSchema = z.object({
    linea: z.string().min(1, "La linea es requerida."),
    descripcion: z.string().min(3, "La descripcion debe tener al menos 3 caracteres."),
    estado: z.coerce.boolean().default(true)
});

export type ProductoInput = z.infer<typeof productoSchema>;

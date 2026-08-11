import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
    const roles = [
        ["R01", "Administrador"],
        ["R02", "Encargado Centro"],
        ["R03", "Encargado Bodega"],
        ["R06", "Operador Entrada"],
        ["R07", "Operador Salida"]
    ] as const;

    for (const [id, descripcion] of roles) {
        await prisma.rol.upsert({
            where: { id },
            update: { descripcion },
            create: { id, descripcion }
        });
    }

    const centro = await prisma.centro.upsert({
        where: { id: "centro-cmv-valparaiso" },
        update: { nombre: "Centro de Salud Valparaiso", estado: true },
        create: {
            id: "centro-cmv-valparaiso",
            nombre: "Centro de Salud Valparaiso",
            estado: true
        }
    });

    const bodegaClinica = await prisma.bodega.upsert({
        where: { id: "bodega-clinica" },
        update: { nombre: "Bodega Clinica", estado: true },
        create: {
            id: "bodega-clinica",
            nombre: "Bodega Clinica",
            centroId: centro.id,
            estado: true
        }
    });

    const bodegaAseo = await prisma.bodega.upsert({
        where: { id: "bodega-aseo" },
        update: { nombre: "Bodega Aseo", estado: true },
        create: {
            id: "bodega-aseo",
            nombre: "Bodega Aseo",
            centroId: centro.id,
            estado: true
        }
    });

    await prisma.unidad.upsert({
        where: { descripcion: "Caja" },
        update: {},
        create: { descripcion: "Caja" }
    });

    await prisma.unidad.upsert({
        where: { descripcion: "Unidad" },
        update: {},
        create: { descripcion: "Unidad" }
    });

    const guantes = await prisma.producto.upsert({
        where: { id: 1 },
        update: {
            linea: "CLINICO",
            descripcion: "Guantes de procedimiento M",
            estado: true
        },
        create: {
            id: 1,
            linea: "CLINICO",
            descripcion: "Guantes de procedimiento M",
            estado: true
        }
    });

    const alcohol = await prisma.producto.upsert({
        where: { id: 2 },
        update: {
            linea: "CLINICO",
            descripcion: "Alcohol gel 1 litro",
            estado: true
        },
        create: {
            id: 2,
            linea: "CLINICO",
            descripcion: "Alcohol gel 1 litro",
            estado: true
        }
    });

    const cloro = await prisma.producto.upsert({
        where: { id: 3 },
        update: {
            linea: "ASEO",
            descripcion: "Cloro concentrado 5 litros",
            estado: true
        },
        create: {
            id: 3,
            linea: "ASEO",
            descripcion: "Cloro concentrado 5 litros",
            estado: true
        }
    });

    const admin = await prisma.usuario.upsert({
        where: { email: "admin@cmv.local" },
        update: {
            rolId: "R01",
            bodegaId: bodegaClinica.id,
            centroId: centro.id,
            estado: true
        },
        create: {
            id: "usuario-demo-admin",
            nombre: "Usuario",
            apPaterno: "Demo",
            apMaterno: "Local",
            rolId: "R01",
            bodegaId: bodegaClinica.id,
            telefono: "+56900000000",
            email: "admin@cmv.local",
            centroId: centro.id,
            estado: true
        }
    });

    await prisma.encargadosBodega.upsert({
        where: {
            encargadoId_centroId_bodegaId: {
                encargadoId: admin.id,
                centroId: centro.id,
                bodegaId: bodegaClinica.id
            }
        },
        update: {
            rolId: "R03",
            email: admin.email
        },
        create: {
            encargadoId: admin.id,
            centroId: centro.id,
            bodegaId: bodegaClinica.id,
            rolId: "R03",
            email: admin.email
        }
    });

    // Administradores institucionales habilitados para el login con Google.
    // Solo se aceptan correos del dominio @cmvalparaiso.cl (ver src/config/auth.ts).
    const administradores = [
        {
            id: "usuario-admin-rvergara",
            nombre: "Renzo",
            apPaterno: "Vergara",
            email: "rvergara@cmvalparaiso.cl"
        },
        {
            id: "usuario-admin-dsantibanez",
            nombre: "Daniel",
            apPaterno: "Santibanez",
            email: "dsantibanez@cmvalparaiso.cl"
        }
    ];

    for (const administrador of administradores) {
        await prisma.usuario.upsert({
            where: { email: administrador.email },
            update: {
                nombre: administrador.nombre,
                apPaterno: administrador.apPaterno,
                rolId: "R01",
                centroId: centro.id,
                bodegaId: bodegaClinica.id,
                estado: true
            },
            create: {
                id: administrador.id,
                nombre: administrador.nombre,
                apPaterno: administrador.apPaterno,
                rolId: "R01",
                bodegaId: bodegaClinica.id,
                email: administrador.email,
                centroId: centro.id,
                estado: true
            }
        });
    }

    const stocks = [
        {
            productoId: guantes.id,
            bodegaId: bodegaClinica.id,
            cantidadDisponible: 120,
            stockMinimo: 30,
            lote: "L-CLIN-001",
            fechaCaducidad: new Date("2027-01-31T00:00:00.000Z")
        },
        {
            productoId: alcohol.id,
            bodegaId: bodegaClinica.id,
            cantidadDisponible: 18,
            stockMinimo: 20,
            lote: "L-ALC-001",
            fechaCaducidad: new Date("2026-09-30T00:00:00.000Z")
        },
        {
            productoId: cloro.id,
            bodegaId: bodegaAseo.id,
            cantidadDisponible: 45,
            stockMinimo: 10,
            lote: "L-ASEO-001",
            fechaCaducidad: new Date("2027-06-30T00:00:00.000Z")
        }
    ];

    for (const stock of stocks) {
        await prisma.stock.upsert({
            where: {
                stock_lote_unico: {
                    productoId: stock.productoId,
                    bodegaId: stock.bodegaId,
                    lote: stock.lote,
                    fechaCaducidad: stock.fechaCaducidad
                }
            },
            update: {
                cantidadDisponible: stock.cantidadDisponible,
                stockMinimo: stock.stockMinimo
            },
            create: stock
        });
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error: unknown) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });

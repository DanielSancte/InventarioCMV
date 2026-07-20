# Inventario APS

MVP local para gestionar stock, productos, ordenes de entrada, ordenes de salida, reportes y configuraciones.

## Inicio local

1. Copiar variables:

```powershell
Copy-Item .env.example .env
```

2. Levantar MySQL y preparar base:

```powershell
npm run services:up
npm run db:generate
npm run db:push
npm run db:seed
```

3. Ejecutar la app:

```powershell
npm run dev
```

La app queda en `http://localhost:3000`.

## Sesion local

El MVP usa `DEMO_USER_EMAIL=admin@cmv.local` para simular una sesion activa. Ese usuario se crea con `npm run db:seed` y tiene rol `R01`.

## Reglas implementadas

- Entrada: crea cabecera/detalle y aumenta stock por producto, bodega, lote y fecha de caducidad.
- Salida: valida stock suficiente antes de descontar.
- Edicion/eliminacion de detalles: revierte el movimiento anterior y aplica el nuevo dentro de transaccion Prisma.
- Reporte: consumo mensual calculado desde detalles de salida y stock actual.
- Alertas: sin stock, stock minimo y caducidad proxima.

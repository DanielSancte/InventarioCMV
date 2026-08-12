# Inventario APS

MVP local para gestionar stock, productos, ordenes de entrada, ordenes de salida, reportes y configuraciones.

## Inicio local

1. Copiar variables y completar credenciales:

```powershell
Copy-Item .env.example .env
npx auth secret   # genera AUTH_SECRET
```

Completar en `.env` el `AUTH_GOOGLE_ID` y `AUTH_GOOGLE_SECRET` entregados por Google Cloud.

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

## Autenticacion

El acceso es exclusivamente con Google (NextAuth v5). Reglas aplicadas en cada inicio de sesion:

1. Solo correos del dominio `@cmvalparaiso.cl` (las cuentas `@gmail.com` u otros dominios se rechazan).
2. El correo debe existir en la tabla `Usuario`.
3. El usuario debe estar con `Estado = true`.

`npm run db:seed` deja habilitados como administradores (`R01`) a `rvergara@cmvalparaiso.cl` y `dsantibanez@cmvalparaiso.cl`.

En Google Cloud debe estar registrada la redirect URI `http://localhost:3000/api/auth/callback/google`.

Detalle completo en [`docs/specs/spec-autenticacion-google.md`](docs/specs/spec-autenticacion-google.md).

## Reglas implementadas

- Entrada: crea cabecera/detalle y aumenta stock por producto, bodega, lote y fecha de caducidad.
- Salida: valida stock suficiente antes de descontar.
- Edicion/eliminacion de detalles: revierte el movimiento anterior y aplica el nuevo dentro de transaccion Prisma.
- Reporte: consumo mensual calculado desde detalles de salida y stock actual.
- Alertas: sin stock, stock minimo y caducidad proxima.

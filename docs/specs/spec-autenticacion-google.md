# Especificacion: Autenticacion con Google (NextAuth v5)

| Campo | Valor |
| --- | --- |
| Estado | Implementado — pendiente de verificacion con credenciales reales |
| Fecha | 2026-08-10 |
| Responsable | Renzo Vergara |
| Modulo | `src/modules/auth` + `src/auth.ts` |
| Dependencias | `next-auth@5.0.0-beta.32`, Prisma/MySQL |

## 1. Objetivo

Reemplazar la sesion simulada del MVP (`DEMO_USER_EMAIL`) por autenticacion real con Google OAuth,
restringiendo el acceso al dominio institucional y a funcionarios registrados y activos.

## 2. Alcance

Incluye:

- Login con Google como unico metodo de acceso.
- Proteccion de todas las rutas de la aplicacion via middleware.
- Resolucion del funcionario de la sesion (id, nombre, rol, centro, bodega) desde la base de datos.
- Cierre de sesion desde el layout.
- Siembra de los administradores iniciales.

No incluye: administracion de usuarios por UI, recuperacion de cuentas, ni otros proveedores OAuth.

## 3. Reglas de negocio

| # | Regla | Motivo devuelto | Donde se aplica |
| --- | --- | --- | --- |
| RN-1 | El proveedor debe ser Google | `proveedor_no_soportado` | `signIn` en `src/auth.ts` |
| RN-2 | Google debe reportar el correo como verificado | `correo_no_verificado` | `signIn` |
| RN-3 | El correo debe pertenecer al dominio `@cmvalparaiso.cl` | `dominio_no_autorizado` | `signIn` + `esCorreoInstitucional` |
| RN-4 | El correo debe existir en la tabla `Usuario` | `usuario_no_registrado` | `signIn` |
| RN-5 | El usuario debe tener `Estado = true` | `usuario_inactivo` | `signIn` y `obtenerSessionUser` |
| RN-6 | Sin sesion valida, toda ruta redirige a `/auth/login` | — | `middleware.ts` |
| RN-7 | Con sesion valida, `/auth/login` redirige a `/` | — | callback `authorized` |

Notas sobre RN-3:

- La comparacion es exacta contra el dominio completo, previo `trim` + `toLowerCase`.
  Se rechazan variantes como `sub.cmvalparaiso.cl`, `notcmvalparaiso.cl` o `cmvalparaiso.cl.attacker.com`.
- El parametro `hd=cmvalparaiso.cl` que se envia a Google es solo una sugerencia visual
  en el selector de cuentas; **no** es una medida de seguridad y por eso la validacion
  se repite en el servidor.
- Las cuentas `@gmail.com` quedan cubiertas por esta misma regla, sin lista negra aparte.

## 4. Arquitectura

```
src/
  config/auth.ts                          constantes (dominio, rol admin, rutas, motivos de rechazo)
  auth.config.ts                          config edge-safe: provider Google, sesion JWT, callback authorized
  auth.ts                                 NextAuth() + callbacks signIn / jwt / session (con Prisma)
  middleware.ts                           NextAuth(authConfig) protege todas las rutas no-API
  types/next-auth.d.ts                    tipos de Session y JWT
  app/api/auth/[...nextauth]/route.ts     handlers GET/POST
  app/auth/login/page.tsx                 formulario de acceso + mensajes de error
  modules/auth/
    actions/auth.action.ts                iniciarSesionGoogle / cerrarSesion
    components/boton-google.tsx           boton de login (client)
    components/boton-cerrar-sesion.tsx    boton de logout (client)
    utils/dominio.ts                      normalizarEmail / obtenerDominio / esCorreoInstitucional
    utils/mensajes.ts                     traduccion de codigos de error a texto
  shared/lib/auth.ts                      obtenerSessionUser / requireSessionUser / permisos por rol
```

**Split de configuracion.** El middleware corre en runtime edge y no puede cargar Prisma.
Por eso `auth.config.ts` no importa nada de Node y solo valida la presencia del token,
mientras que las validaciones contra la base viven en `auth.ts`.

**Estrategia de sesion: JWT.** No se usa el adapter de Prisma, de modo que el esquema
existente no requiere las tablas `Account`, `Session` ni `VerificationToken`.
Duracion maxima: 8 horas (`DURACION_SESION_SEGUNDOS`).

## 5. Flujo de inicio de sesion

1. Ruta protegida sin sesion -> middleware redirige a `/auth/login`.
2. El usuario envia el formulario -> server action `iniciarSesionGoogle()` -> `signIn("google")`.
3. Google autentica y responde en `/api/auth/callback/google`.
4. Callback `signIn`: aplica RN-1 a RN-5. Si falla, retorna la URL
   `/auth/login?error=<motivo>` y la pagina muestra el mensaje correspondiente.
5. Callback `jwt`: carga desde `Usuario` los datos del funcionario y los guarda en el token
   (`idUser`, `nombre`, `apPaterno`, `rol`, `centroId`, `bodegaId`).
6. Callback `session`: expone esos datos en `session.user`.
7. Redireccion a `/`.

## 6. Contrato de sesion

`obtenerSessionUser()` retorna `SessionUser | null`; `requireSessionUser()` lanza `Error` si no hay sesion.

```ts
interface SessionUser {
    id: string;
    nombre: string;
    apPaterno: string;
    email: string;
    rol: string;          // R01..R07
    centroId: string;
    bodegaId: string | null;
}
```

Ambas funciones **revalidan contra la base de datos** en cada llamada. Esto tiene un costo
de una consulta indexada por request, a cambio de que una baja o un cambio de rol tenga
efecto inmediato, sin esperar a que expire el token de 8 horas.

Los Server Actions existentes no cambiaron su codigo: siguen usando `requireSessionUser()`
y los helpers `puedeAdministrar` / `puedeOperarEntrada` / `puedeOperarSalida`.

## 7. Datos iniciales

`prisma/seed.ts` deja habilitados con rol `R01` (Administrador, todos los privilegios):

| Correo | Nombre | Rol | Centro | Bodega |
| --- | --- | --- | --- | --- |
| `rvergara@cmvalparaiso.cl` | Renzo Vergara | R01 | `centro-cmv-valparaiso` | `bodega-clinica` |
| `dsantibanez@cmvalparaiso.cl` | Daniel Santibanez | R01 | `centro-cmv-valparaiso` | `bodega-clinica` |

El upsert usa `email` como clave, por lo que re-ejecutar la siembra es idempotente.

Se mantiene el registro `admin@cmv.local` porque otros datos sembrados lo referencian por FK,
pero ya no puede iniciar sesion: su dominio no es el institucional (RN-3).

El proyecto trabaja con `prisma db push` (no hay carpeta `migrations/`), asi que la
habilitacion de usuarios se hace por seed y no por migracion.

## 8. Variables de entorno

| Variable | Descripcion |
| --- | --- |
| `AUTH_SECRET` | Secreto de firma del JWT. Generar con `npx auth secret`. |
| `AUTH_GOOGLE_ID` | Client ID del cliente OAuth de Google Cloud. |
| `AUTH_GOOGLE_SECRET` | Client Secret del cliente OAuth. |
| `AUTH_URL` | URL publica de la app (`http://localhost:3000` en local). |
| `AUTH_TRUST_HOST` | `true` cuando la app corre detras de proxy o en Docker. |
| `DATABASE_URL` | Conexion MySQL (puerto 3308 en local). |

`DEMO_USER_EMAIL` quedo obsoleta y fue eliminada de `.env.example`.

## 9. Configuracion en Google Cloud

1. Crear/seleccionar el proyecto en Google Cloud Console.
2. **APIs & Services > OAuth consent screen**: tipo *Internal* (recomendado, restringe el
   consentimiento al Workspace de `cmvalparaiso.cl`). Scopes: `email`, `profile`, `openid`.
3. **APIs & Services > Credentials > Create credentials > OAuth client ID**, tipo *Web application*.
4. Authorized JavaScript origins: `http://localhost:3000`.
5. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`.
   Para produccion, agregar `https://<dominio>/api/auth/callback/google`.
6. Copiar Client ID y Client Secret al `.env`.

## 10. Verificacion

Automatizado — `npm test` (16 tests, `src/__tests__/auth-dominio.test.ts` cubre RN-3):

- acepta los dos correos institucionales habilitados;
- acepta mayusculas y espacios alrededor;
- rechaza `@gmail.com`, `@googlemail.com`, `@hotmail.com`, `@cmv.local`;
- rechaza subdominios y dominios que contienen al institucional como substring;
- rechaza nulos y formatos invalidos.

Con credenciales reales cargadas en `.env` (2026-08-10):

| # | Caso | Resultado esperado | Estado |
| --- | --- | --- | --- |
| CP-0 | Provider registrado en `/api/auth/providers` | `google` con callback `/api/auth/callback/google` | OK |
| CP-1 | Entrar a `/stock` o `/` sin sesion | 307 a `/auth/login?callbackUrl=...` | OK |
| CP-1b | Render del login | Muestra "Acceso institucional", dominio y boton de Google | OK |
| CP-1c | URL de autorizacion generada | `client_id` real, `redirect_uri` correcta, `hd=cmvalparaiso.cl`, PKCE S256 | OK |
| CP-1d | Google acepta el cliente | Llega a la pantalla de login, sin `redirect_uri_mismatch` ni `invalid_client` | OK |
| CP-1e | Mensajes de rechazo renderizados en `/auth/login?error=...` | Texto correcto para dominio, no registrado e inactivo | OK |
| CP-1f | Siembra en MySQL | Los dos correos con `Rol = R01` y `Estado = 1` | OK |
| CP-2 | Login con `rvergara@cmvalparaiso.cl` | Entra a `/`, header muestra nombre y rol `R01` | OK (manual) |
| CP-3 | Login con `dsantibanez@cmvalparaiso.cl` | Igual que CP-2 | OK (manual) |
| CP-4 | Login con una cuenta `@gmail.com` | Vuelve al login con el mensaje de dominio no autorizado | OK (manual) |
| CP-5 | Login con un `@cmvalparaiso.cl` no sembrado | Mensaje "no esta registrado como funcionario" | OK (manual) |
| CP-6 | Usuario con `Estado = false` | Mensaje "cuenta inactiva" | **No ejecutado** |
| CP-7 | Cerrar sesion | Vuelve a `/auth/login`; `/stock` ya no es accesible | OK (manual) |
| CP-8 | Ir a `/auth/login` con sesion activa | Redirige a `/` | OK (manual) |

Estado del entorno: `npx tsc --noEmit` sin errores, `npm run build` correcto, `npm test` 16/16.
CP-2 a CP-8 fueron ejecutados manualmente en el navegador por Renzo Vergara el 2026-08-10,
con MySQL local sembrado y credenciales reales de Google Cloud.

CP-6 quedo sin ejecutar: requiere desactivar un funcionario (`Estado = false`) durante la
prueba y no se hizo. La ruta esta cubierta por codigo en dos puntos (`signIn` en `src/auth.ts`
y `obtenerSessionUser` en `src/shared/lib/auth.ts`), pero no por una prueba end-to-end.

## 11. Decisiones y riesgos

- **JWT en vez de adapter Prisma**: evita agregar tablas de Auth.js al esquema heredado.
  Consecuencia: la revocacion inmediata depende de la revalidacion descrita en la seccion 6.
- **Sin bypass de desarrollo**: se descarto una variable tipo `AUTH_DEV_BYPASS` para no dejar
  un camino que omita la autenticacion. Sin credenciales de Google, la app no permite ingresar.
- **`npm run lint` no esta configurado** en el repositorio (no existe archivo de configuracion
  de ESLint y el comando abre un asistente interactivo). Es una condicion previa a este cambio.

## 12. Trabajo futuro

- ABM de funcionarios desde `/configuraciones` para no depender del seed.
- Registrar los inicios y cierres de sesion con `AuditLogger`.
- Definir las variables `AUTH_*` del entorno productivo y su redirect URI.

// Constantes de autenticacion institucional (Google OAuth).

/** Unico dominio de correo autorizado para iniciar sesion en el sistema. */
export const DOMINIO_INSTITUCIONAL = "cmvalparaiso.cl";

/** Rol con privilegios completos sobre el sistema. */
export const ROL_ADMINISTRADOR = "R01";

/** Ruta del formulario de inicio de sesion. */
export const RUTA_LOGIN = "/auth/login";

/** Ruta a la que se redirige una sesion valida. */
export const RUTA_INICIO = "/";

/** Rutas accesibles sin sesion iniciada. */
export const RUTAS_PUBLICAS = [RUTA_LOGIN] as const;

/** Duracion maxima de la sesion, en segundos (8 horas). */
export const DURACION_SESION_SEGUNDOS = 60 * 60 * 8;

/** Motivos por los que se rechaza un inicio de sesion. */
export const MOTIVO_RECHAZO = {
    DOMINIO: "dominio_no_autorizado",
    NO_REGISTRADO: "usuario_no_registrado",
    INACTIVO: "usuario_inactivo",
    CORREO_NO_VERIFICADO: "correo_no_verificado",
    PROVEEDOR: "proveedor_no_soportado"
} as const;

export type MotivoRechazo = (typeof MOTIVO_RECHAZO)[keyof typeof MOTIVO_RECHAZO];

/** Mensajes mostrados en el formulario de login para cada motivo de rechazo. */
export const MENSAJE_RECHAZO: Record<MotivoRechazo, string> = {
    [MOTIVO_RECHAZO.DOMINIO]: `Solo se permiten cuentas del dominio @${DOMINIO_INSTITUCIONAL}. Las cuentas personales (por ejemplo @gmail.com) no tienen acceso.`,
    [MOTIVO_RECHAZO.NO_REGISTRADO]: "Tu correo institucional no esta registrado como funcionario. Solicita al administrador que te habilite.",
    [MOTIVO_RECHAZO.INACTIVO]: "Tu cuenta de funcionario esta inactiva. Contacta al administrador del sistema.",
    [MOTIVO_RECHAZO.CORREO_NO_VERIFICADO]: "Google no confirmo la verificacion de tu correo institucional.",
    [MOTIVO_RECHAZO.PROVEEDOR]: "El unico metodo de acceso habilitado es Google."
};

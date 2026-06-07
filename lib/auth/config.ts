import type { UsuarioPerfil } from "@/lib/types/auth";

// MVP temporal: autenticación desactivada de forma explícita.
// Para producción, volver a:
// export const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED === "true";
export const AUTH_ENABLED = false;

export const MVP_ADMIN_PROFILE: UsuarioPerfil = {
  id: "mvp-admin",
  email: "mvp@club.local",
  nombre: "Modo",
  apellido: "MVP",
  rol: "ADMINISTRADOR",
  cobradorId: null,
  activo: true,
};

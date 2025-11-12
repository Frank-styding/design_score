import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { signOutAction } from "@/src/app/actions/authActions";

const SESSION_TIMEOUT = 4 * 60 * 60 * 1000; // 4 horas en milisegundos

/**
 * Hook para manejar el cierre automático de sesión después de 4 horas
 */
export function useSessionTimeout() {
  const router = useRouter();

  const checkSessionExpiration = useCallback(async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
      );

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Obtener el tiempo de creación de la sesión
        const sessionCreatedAt = new Date(session.user.created_at).getTime();
        const now = Date.now();
        const sessionAge = now - sessionCreatedAt;

        // Si la sesión tiene más de 4 horas, cerrar sesión
        if (sessionAge > SESSION_TIMEOUT) {
          console.log("⏰ Sesión expirada después de 4 horas");
          await signOutAction();
          router.push("/?session=expired");
        }
      }
    } catch (error) {
      console.error("Error verificando expiración de sesión:", error);
    }
  }, [router]);

  useEffect(() => {
    // Verificar inmediatamente al montar
    checkSessionExpiration();

    // Verificar cada 5 minutos
    const interval = setInterval(checkSessionExpiration, 5 * 60 * 1000);

    // Verificar cuando la ventana recupera el foco
    const handleFocus = () => {
      checkSessionExpiration();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [checkSessionExpiration]);
}

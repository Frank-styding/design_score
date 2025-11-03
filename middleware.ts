import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/src/infrastrucutre/supabse/client";

// Rutas que requieren autenticación
const protectedRoutes = ["/dashboard", "/upload", "/products", "/surveys"];

// Rutas públicas (accesibles sin autenticación)
const publicRoutes = ["/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log(`🔍 Middleware: Verificando ruta ${pathname}`);

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.includes(pathname)) {
    console.log("✅ Ruta pública, permitiendo acceso");
    return NextResponse.next();
  }

  // Si es una ruta protegida, verificar autenticación
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.warn(
          "⚠️ Usuario no autenticado, redirigiendo a login desde:",
          pathname
        );
        // Redirigir a login y guardar la ruta original
        const redirectUrl = new URL("/", request.url);
        redirectUrl.searchParams.set("redirectTo", pathname);
        return NextResponse.redirect(redirectUrl);
      }

      console.log("✅ Usuario autenticado:", user.email);
      return NextResponse.next();
    } catch (error) {
      console.error("❌ Error en middleware:", error);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Para cualquier otra ruta, permitir acceso
  return NextResponse.next();
}

// Configurar qué rutas deben pasar por el middleware
export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud excepto:
     * - api (rutas API)
     * - _next/static (archivos estáticos)
     * - _next/image (archivos de optimización de imágenes)
     * - favicon.ico (favicon)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js)$).*)",
  ],
};

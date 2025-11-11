import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/src/infrastrucutre/supabse/client";

// Rutas que requieren autenticación
const protectedRoutes = ["/dashboard", "/upload", "/products", "/surveys"];

// Rutas públicas (accesibles sin autenticación)
const publicRoutes = ["/"];

// Rutas de API que requieren autenticación
const protectedApiRoutes = ["/api/upload"];

/**
 * Valida el origen de la petición para prevenir CSRF
 */
function isValidOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // Permitir peticiones del mismo origen
  if (!origin) return true; // Navegación directa

  // En desarrollo, permitir localhost
  if (process.env.NODE_ENV === "development") {
    return (
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin === `https://${host}` ||
      origin === `http://${host}`
    );
  }

  // En producción, validar contra dominios permitidos
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
  const expectedOrigin = `https://${host}`;

  return origin === expectedOrigin || allowedOrigins.includes(origin);
}

/**
 * Sanitiza parámetros de query para prevenir inyecciones
 */
function sanitizeSearchParams(request: NextRequest): void {
  const { searchParams } = request.nextUrl;
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick=, onerror=, etc.
    /\.\.\//, // Path traversal
  ];

  searchParams.forEach((value) => {
    dangerousPatterns.forEach((pattern) => {
      if (pattern.test(value)) {
        console.warn("⚠️ Patrón peligroso detectado en query params:", value);
      }
    });
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Sanitizar parámetros de query
  sanitizeSearchParams(request);

  // Validar origen para peticiones POST/PUT/DELETE (CSRF protection)
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    if (!isValidOrigin(request)) {
      console.warn("⚠️ Origen inválido detectado:", {
        origin: request.headers.get("origin"),
        host: request.headers.get("host"),
        pathname,
      });
      return new NextResponse("Forbidden - Invalid Origin", { status: 403 });
    }
  }

  // Si es una ruta pública, permitir acceso
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Proteger rutas API específicas
  if (protectedApiRoutes.some((route) => pathname.startsWith(route))) {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.warn("⚠️ API: Usuario no autenticado en:", pathname);
        return new NextResponse(JSON.stringify({ error: "No autenticado" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Agregar user ID a headers para usar en la API
      const response = NextResponse.next();
      response.headers.set("x-user-id", user.id);
      return response;
    } catch (error) {
      console.error("❌ Error verificando autenticación en API:", error);
      return new NextResponse(
        JSON.stringify({ error: "Error de autenticación" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
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
          "⚠️ Usuario no autenticado, redirigiendo desde:",
          pathname
        );
        // Redirigir a login y guardar la ruta original
        const redirectUrl = new URL("/", request.url);
        // Sanitizar pathname antes de guardarlo
        const safePath = pathname.replace(/[<>'"]/g, "");
        redirectUrl.searchParams.set("redirectTo", safePath);
        return NextResponse.redirect(redirectUrl);
      }

      // Usuario autenticado - continuar con headers de seguridad adicionales
      const response = NextResponse.next();

      // Agregar headers específicos para rutas autenticadas
      response.headers.set("X-Authenticated", "true");
      response.headers.set(
        "Cache-Control",
        "private, no-cache, no-store, must-revalidate"
      );

      return response;
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
     * - _next/static (archivos estáticos)
     * - _next/image (archivos de optimización de imágenes)
     * - favicon.ico (favicon)
     * - public folder (archivos públicos)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js)$).*)",
  ],
};

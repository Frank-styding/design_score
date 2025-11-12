# Fix: Middleware redirige correctamente a /unauthorized

## Problema

El middleware no estaba redirigiendo a `/unauthorized` cuando un usuario sin autenticación intentaba acceder a `/dashboard`.

## Causa

El middleware estaba usando `createClient()` de `@/src/infrastrucutre/supabse/client` que está diseñado para **Server Components** (usa `cookies()` de Next.js), pero el middleware requiere un cliente diferente que use las cookies del **request**.

## Solución

### Cambio en `middleware.ts`:

**Antes:**

```typescript
import { createClient } from "@/src/infrastrucutre/supabse/client";

// ...

const supabase = await createClient();
```

**Después:**

```typescript
import { createServerClient } from "@supabase/ssr";

// ...

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
      },
    },
  }
);
```

## Resultado

Ahora el middleware funciona correctamente:

1. ✅ Usuario sin autenticación accede a `/dashboard`
2. ✅ Middleware detecta que no hay usuario
3. ✅ Redirige a `/unauthorized`
4. ✅ Muestra la página 404 personalizada

## Testing

Para probar:

1. Cerrar sesión o abrir ventana privada
2. Navegar a `http://localhost:3000/dashboard`
3. Debería redirigir automáticamente a `http://localhost:3000/unauthorized`
4. Se muestra la página "404 - Acceso No Autorizado"

## Nota Técnica

La diferencia entre los dos clientes de Supabase:

### `createClient()` (Server Components)

- Usa `cookies()` de `next/headers`
- Solo funciona en Server Components y Server Actions
- No funciona en middleware

### `createServerClient()` (Middleware)

- Usa cookies del `request` directamente
- Funciona en middleware
- Requiere implementar `getAll()` y `setAll()` manualmente

## Conclusión

El middleware ahora redirige correctamente a `/unauthorized` cuando detecta que no hay usuario autenticado, proporcionando una experiencia de seguridad adecuada desde el lado del servidor.

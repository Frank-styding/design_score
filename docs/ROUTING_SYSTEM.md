# 🗺️ Sistema de Rutas - Documentación Completa

## 📋 Resumen

Se ha implementado un sistema completo de rutas usando Next.js 15 App Router con autenticación y navegación estructurada.

---

## 🗂️ Estructura de Rutas

```
src/app/
├── page.tsx                    → / (Login)
├── dashboard/
│   └── page.tsx               → /dashboard (Centro de control)
├── upload/
│   └── page.tsx               → /upload (Subir modelos 3D)
├── products/
│   └── page.tsx               → /products (Ver productos)
└── surveys/
    └── page.tsx               → /surveys (Gestión de encuestas - Coming Soon)
```

---

## 📍 Rutas Disponibles

### 1. **`/` - Página de Login** (Pública)

**Archivo:** `src/app/page.tsx`

**Características:**

- ✅ Página pública (sin autenticación requerida)
- ✅ Formulario de login/registro
- ✅ Redirige a `/dashboard` después de autenticación exitosa
- ✅ Diseño con gradiente y centrado

**Componentes:**

- `AuthForm` - Formulario de autenticación

**Flujo:**

```
Usuario no autenticado → / (Login) → AuthForm → onAuthSuccess → /dashboard
```

**Código clave:**

```typescript
const handleAuthSuccess = (authenticatedUser: {
  id: string;
  email: string;
}) => {
  console.log("✅ Usuario autenticado:", authenticatedUser.email);
  router.push("/dashboard");
};
```

---

### 2. **`/dashboard` - Centro de Control** (Protegida)

**Archivo:** `src/app/dashboard/page.tsx`

**Características:**

- ✅ Página protegida (requiere autenticación)
- ✅ Navegación central a todas las secciones
- ✅ Tarjetas interactivas con hover effects
- ✅ Botón de cerrar sesión
- ✅ Sección de estadísticas (placeholder)

**Secciones:**

1. **Subir Modelo 3D** → `/upload`
2. **Ver Productos** → `/products`
3. **Encuestas** → `/surveys`

**Protección de ruta:**

```typescript
useEffect(() => {
  checkAuth();
}, []);

const checkAuth = async () => {
  const result = await getCurrentUserAction();
  if (!result.success || !result.user) {
    router.push("/"); // Redirigir a login
    return;
  }
  setUser(result.user);
};
```

**UI:**

- Header con nombre de usuario y botón de logout
- Grid de 3 cards con iconos SVG
- Panel de estadísticas (productos, encuestas, respuestas)

---

### 3. **`/upload` - Subir Modelos 3D** (Protegida)

**Archivo:** `src/app/upload/page.tsx`

**Características:**

- ✅ Página protegida (requiere autenticación)
- ✅ Verificación automática de autenticación
- ✅ Formulario de carga de carpetas KeyShot XR
- ✅ Loading state durante verificación
- ✅ Navegación a Dashboard y Products

**Componentes:**

- `UploadFolderForm` - Formulario de carga con compresión y batch upload

**Flujo:**

```
/upload → checkAuth() → UploadFolderForm → onSuccess → Alert
```

**Navegación:**

- Botón "Volver al Dashboard" → `/dashboard`
- Botón "Ver Productos" → `/products`

---

### 4. **`/products` - Ver Productos** (Protegida)

**Archivo:** `src/app/products/page.tsx`

**Características:**

- ✅ Página protegida (requiere autenticación)
- ✅ Lista de productos del usuario
- ✅ Visor 3D interactivo (KeyShot XR)
- ✅ Loading state durante verificación

**Componentes:**

- `ViewProduct` - Visor de productos con KeyShot XR

**Flujo:**

```
/products → checkAuth() → ViewProduct → Carga productos del adminId
```

**Navegación:**

- Botón "Volver al Dashboard" → `/dashboard`
- Botón "Subir Producto" → `/upload`

---

### 5. **`/surveys` - Gestión de Encuestas** (Protegida - Coming Soon)

**Archivo:** `src/app/surveys/page.tsx`

**Características:**

- ✅ Página protegida (requiere autenticación)
- ✅ Placeholder "Próximamente"
- ✅ Preview de funcionalidades futuras
- ✅ Diseño consistente con el resto de la app

**Funcionalidades previstas:**

1. Crear encuestas personalizadas
2. Asignar productos a preguntas
3. Gestionar participantes
4. Analizar resultados y generar reportes

**Navegación:**

- Botón "Volver al Dashboard" → `/dashboard`

---

## 🔐 Sistema de Protección de Rutas

### Patrón de Protección:

Todas las rutas protegidas usan el mismo patrón:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserAction } from "../actions/authActions";

export default function ProtectedPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const result = await getCurrentUserAction();
      if (
        !result.success ||
        !result.user ||
        !result.user.id ||
        !result.user.email
      ) {
        console.warn("⚠️ No hay usuario autenticado, redirigiendo a login...");
        router.push("/");
        return;
      }
      setUser({
        id: result.user.id,
        email: result.user.email,
      });
    } catch (error) {
      console.error("Error al verificar autenticación:", error);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return <LoadingSpinner />;
  }

  // No user (redirecting)
  if (!user) {
    return null;
  }

  // Página protegida
  return <div>Contenido protegido</div>;
}
```

### Estados de Protección:

1. **Loading** - Verificando autenticación (spinner)
2. **No autenticado** - Redirige a `/`
3. **Autenticado** - Muestra contenido

---

## 🧭 Flujo de Navegación

### Diagrama de Flujo:

```
┌─────────────────┐
│   / (Login)     │ ← Usuario no autenticado
│   Pública       │
└────────┬────────┘
         │ Login exitoso
         ▼
┌─────────────────────────────────┐
│      /dashboard                 │
│      Centro de Control          │
│   ┌─────────────────────────┐  │
│   │ 📤 Subir Modelo 3D      │──┼──→ /upload
│   │ 📦 Ver Productos        │──┼──→ /products
│   │ 📋 Encuestas            │──┼──→ /surveys
│   │ 🚪 Cerrar Sesión        │──┼──→ / (Login)
│   └─────────────────────────┘  │
└─────────────────────────────────┘

         ┌────────────────────┐
         │    /upload         │
         │  Subir Modelos     │
         │  ↓ ← → /products   │
         │  ↑ ← → /dashboard  │
         └────────────────────┘

         ┌────────────────────┐
         │   /products        │
         │  Ver Productos     │
         │  ↓ ← → /upload     │
         │  ↑ ← → /dashboard  │
         └────────────────────┘

         ┌────────────────────┐
         │   /surveys         │
         │  (Coming Soon)     │
         │  ↑ ← → /dashboard  │
         └────────────────────┘
```

---

## 🎨 Diseño UI Consistente

### Elementos Comunes:

1. **Header con información de usuario:**

```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold text-gray-800 mb-2">Título de la Página</h1>
  <p className="text-gray-600">
    Usuario: <span className="font-medium">{user.email}</span>
  </p>
</div>
```

2. **Botones de navegación:**

```tsx
<div className="mt-6 flex gap-4">
  <button
    onClick={() => router.push("/dashboard")}
    className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-6 rounded-lg transition-colors"
  >
    ← Volver al Dashboard
  </button>
  <button
    onClick={() => router.push("/other-page")}
    className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-6 rounded-lg transition-colors"
  >
    Otra Página →
  </button>
</div>
```

3. **Loading Spinner:**

```tsx
<div className="min-h-screen flex items-center justify-center bg-gray-50">
  <div className="text-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
    <p className="text-gray-600">Verificando autenticación...</p>
  </div>
</div>
```

---

## 📱 Responsive Design

Todas las páginas son responsive con Tailwind CSS:

- **Mobile:** `flex-col`, `w-full`
- **Tablet:** `md:grid-cols-2`, `md:flex-row`
- **Desktop:** `lg:grid-cols-3`, `max-w-7xl mx-auto`

---

## 🔄 Server Actions Utilizadas

### authActions.ts:

1. **`getCurrentUserAction()`**

   - Verifica si hay usuario autenticado
   - Retorna: `{ success: boolean, user: User | null, error?: string }`

2. **`signOutAction()`**

   - Cierra sesión del usuario
   - Limpia sesión local y global

3. **`signInAction(email, password)`**

   - Inicia sesión
   - Usado por `AuthForm`

4. **`signUpAction(email, password)`**
   - Registra nuevo usuario
   - Usado por `AuthForm`

---

## 🧪 Testing de Rutas

### Escenarios de prueba:

1. **Usuario no autenticado:**

   ```
   ✅ / → Muestra login
   ✅ /dashboard → Redirige a /
   ✅ /upload → Redirige a /
   ✅ /products → Redirige a /
   ✅ /surveys → Redirige a /
   ```

2. **Usuario autenticado:**

   ```
   ✅ / → Puede hacer login (ya autenticado)
   ✅ /dashboard → Muestra dashboard
   ✅ /upload → Muestra formulario de carga
   ✅ /products → Muestra productos
   ✅ /surveys → Muestra "Coming Soon"
   ```

3. **Navegación:**
   ```
   ✅ Login exitoso → Redirige a /dashboard
   ✅ Logout → Redirige a /
   ✅ Botones de navegación funcionan correctamente
   ```

---

## 🚀 Próximas Mejoras

### Sugerencias de implementación:

1. **Middleware de Next.js:**

   - Proteger rutas a nivel de servidor
   - Redirigir automáticamente sin client-side checks

2. **Layout compartido para páginas protegidas:**

   - Header con navegación común
   - Sidebar con menú
   - Footer

3. **Breadcrumbs:**

   - Dashboard > Upload
   - Dashboard > Products

4. **Persistencia de ruta:**

   - Recordar última página visitada
   - Redirigir después de login

5. **Loading global:**

   - Suspense boundaries
   - Loading.tsx en cada carpeta

6. **Error boundaries:**
   - Error.tsx para manejo de errores
   - Not-found.tsx personalizado

---

## 📝 Comandos de Desarrollo

```bash
# Iniciar servidor de desarrollo
npm run dev

# Acceder a rutas:
# http://localhost:3000/           → Login
# http://localhost:3000/dashboard  → Dashboard
# http://localhost:3000/upload     → Upload
# http://localhost:3000/products   → Products
# http://localhost:3000/surveys    → Surveys

# Build para producción
npm run build
npm start
```

---

## ✅ Checklist de Implementación

- [x] Página de Login (`/`)
- [x] Dashboard (`/dashboard`)
- [x] Página de Upload (`/upload`)
- [x] Página de Products (`/products`)
- [x] Página de Surveys (`/surveys`)
- [x] Protección de rutas con `getCurrentUserAction()`
- [x] Loading states en todas las páginas protegidas
- [x] Navegación entre páginas
- [x] Botón de logout en dashboard
- [x] Diseño responsive
- [x] 0 errores de TypeScript
- [ ] Middleware de Next.js (opcional)
- [ ] Layout compartido (opcional)
- [ ] Breadcrumbs (opcional)

---

## 🎉 Conclusión

El sistema de rutas está completamente implementado con:

- ✅ **5 rutas** funcionales
- ✅ **Protección** de rutas privadas
- ✅ **Navegación** fluida entre páginas
- ✅ **Loading states** consistentes
- ✅ **Diseño responsive** con Tailwind CSS
- ✅ **TypeScript** sin errores
- ✅ **Server Actions** integradas

**¡Sistema listo para usar!** 🚀

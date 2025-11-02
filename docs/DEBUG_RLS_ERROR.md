# 🔍 Debug: "new row violates row-level security policy"

## 🚨 El Error Persiste

A pesar de tener las políticas RLS configuradas, sigues obteniendo:

```
Error agregando imagen: new row violates row-level security policy
```

---

## 🔎 Posibles Causas

### 1. **Las políticas no se aplicaron correctamente**

- El script se ejecutó pero las políticas no se crearon
- Hay conflictos con políticas antiguas

### 2. **El admin_id no coincide**

- El producto tiene un `admin_id` diferente al usuario autenticado
- El `admin_id` es NULL

### 3. **El usuario no está autenticado**

- La sesión expiró
- El token de autenticación no es válido

### 4. **Problema con la función `auth.uid()`**

- La función no devuelve el ID correcto
- Hay un problema con el contexto de autenticación

---

## ✅ Plan de Diagnóstico

### Paso 1: Verificar que las políticas existen

Ejecuta en **SQL Editor de Supabase**:

```sql
-- Ver todas las políticas de product
SELECT
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'product';
```

**Resultado esperado:** Deberías ver 5 políticas (SELECT, INSERT, UPDATE, DELETE, SELECT para públicos)

Si **NO ves políticas** o ves menos de 5:

- ❌ Las políticas no se crearon
- ✅ Ejecuta el script completo de nuevo

---

### Paso 2: Verificar el admin_id del producto

Ejecuta en **SQL Editor de Supabase**:

```sql
-- Ver el producto que estás intentando actualizar
SELECT
    product_id,
    name,
    admin_id,
    created_at
FROM public.product
ORDER BY created_at DESC
LIMIT 5;
```

**Verifica:**

- ¿El `admin_id` es NULL? → ❌ Problema
- ¿El `admin_id` es un UUID válido? → ✅ OK

Si el `admin_id` es **NULL**:

```sql
-- Actualizar admin_id manualmente (reemplaza los UUIDs)
UPDATE public.product
SET admin_id = 'tu-user-id-aqui'
WHERE product_id = 'tu-product-id-aqui';
```

---

### Paso 3: Verificar autenticación actual

Ejecuta en **SQL Editor de Supabase**:

```sql
-- Ver tu usuario actual
SELECT auth.uid() as mi_user_id;
```

**Resultado esperado:** Debe devolver tu UUID de usuario

Si devuelve **NULL**:

- ❌ No estás autenticado en el SQL Editor
- ✅ Ejecuta las queries desde tu aplicación

---

### Paso 4: Verificar coincidencia admin_id vs auth.uid()

Ejecuta en tu **aplicación** (NO en SQL Editor):

```typescript
// Agregar logs de debug en productActions.ts
export async function addImagesBatchAction(...) {
  try {
    const client = await getClient();
    const authRepository = new SupabaseAuthRepository(client);
    const authUseCase = new AuthUseCase(authRepository);

    const admin = await authUseCase.getCurrentUser();

    // 🔍 DEBUG: Mostrar info del usuario
    console.log("🔍 Usuario autenticado:", {
      id: admin?.id,
      email: admin?.email
    });

    if (!admin) {
      console.error("❌ No hay usuario autenticado");
      return { ok: false, error: "No authenticated user", uploaded: 0 };
    }

    // 🔍 DEBUG: Verificar admin_id del producto
    const { data: product } = await client
      .from("product")
      .select("product_id, name, admin_id")
      .eq("product_id", productId)
      .single();

    console.log("🔍 Producto:", {
      product_id: product?.product_id,
      name: product?.name,
      admin_id: product?.admin_id,
      match: product?.admin_id === admin.id
    });

    // ... resto del código
  }
}
```

**Verifica en la consola:**

- ✅ `Usuario autenticado.id` tiene un valor
- ✅ `Producto.admin_id` tiene un valor
- ✅ `match` es `true`

---

### Paso 5: Probar UPDATE directamente

Ejecuta en tu **aplicación**:

```typescript
// Test simple de UPDATE
async function testUpdate() {
  const client = await createClient();

  // Obtener usuario actual
  const {
    data: { user },
  } = await client.auth.getUser();
  console.log("Usuario:", user?.id);

  // Intentar UPDATE simple
  const { data, error } = await client
    .from("product")
    .update({ name: "Test Update" })
    .eq("product_id", "tu-product-id")
    .eq("admin_id", user?.id)
    .select();

  console.log("Resultado:", { data, error });
}
```

**Resultado esperado:**

- ✅ `data` contiene el producto actualizado
- ✅ `error` es null

**Si obtienes error:**

- ❌ Las políticas RLS no funcionan correctamente
- ❌ Hay un problema con la configuración

---

## 🛠️ Soluciones por Causa

### Solución 1: Recrear políticas (más seguro)

```sql
-- 1. Desactivar RLS temporalmente
ALTER TABLE public.product DISABLE ROW LEVEL SECURITY;

-- 2. Eliminar TODAS las políticas antiguas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'product' AND schemaname = 'public')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.product';
    END LOOP;
END $$;

-- 3. Reactivar RLS
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas nuevas
CREATE POLICY "Usuarios pueden ver sus propios productos"
    ON public.product FOR SELECT
    USING (admin_id = auth.uid());

CREATE POLICY "Usuarios autenticados pueden crear productos"
    ON public.product FOR INSERT
    WITH CHECK (auth.role() = 'authenticated' AND admin_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus propios productos"
    ON public.product FOR UPDATE
    USING (admin_id = auth.uid())
    WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Usuarios pueden eliminar sus propios productos"
    ON public.product FOR DELETE
    USING (admin_id = auth.uid());

CREATE POLICY "Usuarios pueden ver productos de encuestas públicas"
    ON public.product FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.survey_product sp
            JOIN public.survey s ON sp.survey_id = s.survey_id
            WHERE sp.product_id = product.product_id
            AND s.is_public = true
        )
    );
```

---

### Solución 2: Usar PERMISSIVE en lugar de RESTRICTIVE

```sql
-- Las políticas deben ser PERMISSIVE (por defecto)
-- Verifica con:
SELECT policyname, permissive
FROM pg_policies
WHERE tablename = 'product';

-- Si alguna es RESTRICTIVE, recréala como PERMISSIVE
DROP POLICY IF EXISTS "nombre_de_politica" ON public.product;
CREATE POLICY "nombre_de_politica"
    ON public.product
    AS PERMISSIVE  -- ← Explícitamente PERMISSIVE
    FOR UPDATE
    USING (admin_id = auth.uid())
    WITH CHECK (admin_id = auth.uid());
```

---

### Solución 3: Simplificar la política de UPDATE

```sql
-- Eliminar política actual
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios productos" ON public.product;

-- Crear versión más simple
CREATE POLICY "update_own_products"
    ON public.product
    FOR UPDATE
    USING (admin_id = auth.uid());
    -- Sin WITH CHECK (más permisivo)
```

---

### Solución 4: Verificar que admin_id no es NULL

```sql
-- Asegurar que admin_id siempre tenga valor
ALTER TABLE public.product
    ALTER COLUMN admin_id SET NOT NULL;

-- Si esto falla porque hay productos con admin_id NULL, primero arregla esos:
UPDATE public.product
SET admin_id = (SELECT id FROM auth.users LIMIT 1)
WHERE admin_id IS NULL;

-- Luego intenta el ALTER TABLE de nuevo
```

---

### Solución 5: Usar una política más permisiva (temporal, para debug)

```sql
-- SOLO PARA DEBUG - NO EN PRODUCCIÓN
DROP POLICY IF EXISTS "debug_update" ON public.product;

CREATE POLICY "debug_update"
    ON public.product
    FOR UPDATE
    USING (true)  -- ← Permite todo
    WITH CHECK (true);  -- ← Permite todo

-- Prueba tu código
-- Si funciona, el problema es con la condición admin_id = auth.uid()
```

---

## 🔍 Debug Adicional

### Ver logs de Supabase

1. Ve a tu proyecto en Supabase
2. Click en **Logs** (menú lateral)
3. Filtra por **Postgres Logs**
4. Busca errores relacionados con RLS

### Activar logging de RLS

```sql
-- Activar logs detallados (solo en desarrollo)
ALTER ROLE authenticator SET log_statement = 'all';
ALTER ROLE anon SET log_statement = 'all';
ALTER ROLE authenticated SET log_statement = 'all';

-- Desactivar después:
ALTER ROLE authenticator RESET log_statement;
ALTER ROLE anon RESET log_statement;
ALTER ROLE authenticated RESET log_statement;
```

---

## 📋 Checklist de Verificación

- [ ] Las 5 políticas existen en `pg_policies`
- [ ] El `admin_id` del producto NO es NULL
- [ ] El usuario está autenticado (`auth.uid()` devuelve un UUID)
- [ ] `product.admin_id === auth.uid()` es verdadero
- [ ] Las políticas son PERMISSIVE (no RESTRICTIVE)
- [ ] El UPDATE funciona con política `USING (true)` (test)
- [ ] Los logs de Supabase no muestran errores adicionales

---

## 🎯 Siguiente Paso

**Ejecuta estos comandos en orden:**

1. **Verificar políticas:** `SELECT * FROM pg_policies WHERE tablename = 'product';`
2. **Si no hay 5 políticas:** Ejecutar script de Solución 1 (recrear políticas)
3. **Agregar logs de debug** en tu código
4. **Probar de nuevo** y revisar logs en consola
5. **Reportar resultado** con los logs

---

## 💡 Tip Final

Si nada funciona, intenta esto:

```sql
-- Desactivar RLS temporalmente solo para product
ALTER TABLE public.product DISABLE ROW LEVEL SECURITY;

-- Prueba tu código (debería funcionar)
-- Si funciona, el problema es definitivamente con las políticas RLS

-- Reactiva RLS
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;

-- Y usa la Solución 1 para recrear políticas desde cero
```

---

¿Cuál de estos pasos quieres que ejecutemos primero? 🚀

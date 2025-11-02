# 🔒 Error RLS: "new row violates row-level security policy"

## 🚨 Problema

Al intentar subir imágenes, obtienes este error:

```
Error agregando imagen: new row violates row-level security policy
```

**Causa raíz:** La tabla `product` tiene RLS habilitado pero **NO tiene políticas** que permitan a usuarios autenticados crear o actualizar productos.

---

## 🔍 Diagnóstico

### Tu esquema actual:

```sql
CREATE TABLE public.product (
    product_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    xr_url text,
    cover_image text
);

-- ❌ PROBLEMA: No hay políticas RLS definidas
```

### Lo que pasa:

1. Usuario crea un producto → ✅ Se crea en la tabla
2. Usuario intenta actualizar el producto (al subir imagen) → ❌ **RLS BLOQUEA LA ACTUALIZACIÓN**
3. Error: "new row violates row-level security policy"

---

## ✅ Solución

Agregar políticas RLS a la tabla `product`. Ejecuta este SQL en Supabase:

### 1️⃣ Habilitar RLS (si no está habilitado)

```sql
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;
```

### 2️⃣ Política: Ver productos propios

```sql
CREATE POLICY "Usuarios pueden ver sus propios productos"
    ON public.product
    FOR SELECT
    USING (admin_id = auth.uid());
```

### 3️⃣ Política: Crear productos

```sql
CREATE POLICY "Usuarios autenticados pueden crear productos"
    ON public.product
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND admin_id = auth.uid()
    );
```

### 4️⃣ Política: Actualizar productos propios ⭐ **CRUCIAL PARA SUBIR IMÁGENES**

```sql
CREATE POLICY "Usuarios pueden actualizar sus propios productos"
    ON public.product
    FOR UPDATE
    USING (admin_id = auth.uid())
    WITH CHECK (admin_id = auth.uid());
```

### 5️⃣ Política: Eliminar productos propios

```sql
CREATE POLICY "Usuarios pueden eliminar sus propios productos"
    ON public.product
    FOR DELETE
    USING (admin_id = auth.uid());
```

### 6️⃣ Política OPCIONAL: Ver productos en encuestas públicas

```sql
CREATE POLICY "Usuarios pueden ver productos de encuestas públicas"
    ON public.product
    FOR SELECT
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

## 📋 Script Completo

Copia y pega esto en el **SQL Editor de Supabase**:

```sql
-- ==================================================
-- POLÍTICAS RLS PARA LA TABLA PRODUCT
-- ==================================================

-- 1. Habilitar RLS
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;

-- 2. Ver productos propios
CREATE POLICY "Usuarios pueden ver sus propios productos"
    ON public.product
    FOR SELECT
    USING (admin_id = auth.uid());

-- 3. Crear productos
CREATE POLICY "Usuarios autenticados pueden crear productos"
    ON public.product
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND admin_id = auth.uid()
    );

-- 4. Actualizar productos propios (CRUCIAL)
CREATE POLICY "Usuarios pueden actualizar sus propios productos"
    ON public.product
    FOR UPDATE
    USING (admin_id = auth.uid())
    WITH CHECK (admin_id = auth.uid());

-- 5. Eliminar productos propios
CREATE POLICY "Usuarios pueden eliminar sus propios productos"
    ON public.product
    FOR DELETE
    USING (admin_id = auth.uid());

-- 6. Ver productos en encuestas públicas (OPCIONAL)
CREATE POLICY "Usuarios pueden ver productos de encuestas públicas"
    ON public.product
    FOR SELECT
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

## 🎯 Cómo Ejecutar

### Opción 1: Supabase Dashboard (Recomendado)

1. Ve a tu proyecto en [app.supabase.com](https://app.supabase.com)
2. Click en **SQL Editor** (en el menú lateral)
3. Click en **New Query**
4. Pega el script completo
5. Click en **Run** (o `Ctrl+Enter`)
6. ✅ Verás "Success. No rows returned"

### Opción 2: CLI de Supabase

```bash
# Si tienes Supabase CLI instalado
supabase db execute < docs/PRODUCT_RLS_POLICIES.sql
```

---

## 🔍 Verificar que Funciona

Después de ejecutar el script, puedes verificar las políticas:

```sql
-- Ver todas las políticas de la tabla product
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'product';
```

Deberías ver 5-6 políticas listadas.

---

## 🧪 Probar la Solución

1. **Intenta crear un producto:**

   ```typescript
   const product = await createProductAction({
     name: "Test",
     description: "Test product",
     xr_url: "https://...",
   });
   ```

   → ✅ Debería funcionar

2. **Intenta subir imágenes:**
   ```typescript
   await addImagesBatchAction(productId, images, true);
   ```
   → ✅ Debería funcionar sin errores

---

## 🐛 Troubleshooting

### Si aún obtienes el error:

#### 1. Verifica que el usuario está autenticado

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("Usuario autenticado:", user?.id);
```

#### 2. Verifica que el `admin_id` coincide

```typescript
const product = await getProductById(productId);
console.log("Product admin_id:", product?.admin_id);
console.log("Current user:", user?.id);
console.log("Match:", product?.admin_id === user?.id);
```

#### 3. Verifica las políticas en Supabase

Ve a: **Authentication** → **Policies** → **product**

Deberías ver:

- ✅ "Usuarios pueden ver sus propios productos"
- ✅ "Usuarios autenticados pueden crear productos"
- ✅ "Usuarios pueden actualizar sus propios productos" ⭐
- ✅ "Usuarios pueden eliminar sus propios productos"

#### 4. Si las políticas ya existen con otro nombre, elimínalas y crea las nuevas:

```sql
-- Eliminar políticas antiguas
DROP POLICY IF EXISTS "nombre_de_politica_antigua" ON public.product;

-- Luego ejecuta el script completo de arriba
```

---

## 📊 Entendiendo RLS

### ¿Qué es RLS?

**Row Level Security (RLS)** es una característica de PostgreSQL que controla qué filas puede ver/modificar cada usuario.

### Componentes de una Política RLS:

```sql
CREATE POLICY "nombre_descriptivo"
    ON tabla
    FOR operacion          -- SELECT, INSERT, UPDATE, DELETE
    USING (condicion)      -- ¿Qué filas puede ver el usuario?
    WITH CHECK (condicion) -- ¿Qué filas puede modificar el usuario?
```

### Ejemplo aplicado a product:

```sql
-- Política de UPDATE
CREATE POLICY "Usuarios pueden actualizar sus propios productos"
    ON public.product
    FOR UPDATE
    USING (admin_id = auth.uid())      -- Solo ve sus productos
    WITH CHECK (admin_id = auth.uid()) -- Solo puede guardar si el admin_id es suyo
```

**Traducción:**

- `USING`: "Solo puedes actualizar filas donde `admin_id` = tu ID"
- `WITH CHECK`: "Solo puedes guardar cambios si el `admin_id` sigue siendo tu ID"

---

## 🎯 Por Qué Falla la Actualización

### Flujo sin RLS configurado:

```
1. createProduct() → ✅ Se crea (sin políticas, falla silenciosamente o permite)
2. addImageToProduct() intenta UPDATE:
   - Supabase RLS: "¿Hay una política de UPDATE?"
   - Respuesta: "No"
   - Resultado: ❌ BLOQUEADO
   - Error: "new row violates row-level security policy"
```

### Flujo con RLS configurado:

```
1. createProduct() → ✅ Se crea (política INSERT lo permite)
2. addImageToProduct() intenta UPDATE:
   - Supabase RLS: "¿Hay una política de UPDATE?"
   - Respuesta: "Sí"
   - Supabase RLS: "¿admin_id == auth.uid()?"
   - Respuesta: "Sí"
   - Resultado: ✅ PERMITIDO
   - Update exitoso
```

---

## ✅ Resumen

| Problema                      | Causa                     | Solución                 |
| ----------------------------- | ------------------------- | ------------------------ |
| "new row violates RLS policy" | No hay política de UPDATE | Crear política de UPDATE |
| No puedo crear productos      | No hay política de INSERT | Crear política de INSERT |
| No puedo ver productos        | No hay política de SELECT | Crear política de SELECT |
| No puedo eliminar productos   | No hay política de DELETE | Crear política de DELETE |

**Solución completa:** Ejecutar el script SQL con las 5-6 políticas RLS.

---

## 🚀 Después de Aplicar la Solución

Deberías poder:

- ✅ Crear productos
- ✅ Subir imágenes (actualiza `num_images`, `size`, `cover_image`)
- ✅ Ver tus productos
- ✅ Actualizar productos
- ✅ Eliminar productos
- ✅ Ver productos en encuestas públicas (si configuraste la política opcional)

---

## 📝 Notas Importantes

1. **Seguridad:** Las políticas RLS garantizan que cada usuario solo puede modificar sus propios productos
2. **Performance:** RLS se ejecuta a nivel de base de datos, es muy eficiente
3. **Flexibilidad:** Puedes agregar más políticas según necesites (ej: compartir productos entre usuarios)
4. **Debugging:** Usa los logs de Supabase para ver qué políticas se están evaluando

---

¡Ejecuta el script SQL y el error desaparecerá! 🎉

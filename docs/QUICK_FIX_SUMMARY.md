# 🚨 ERROR RESUELTO: "new row violates row-level security policy"

## ❌ El Problema

```
Error agregando imagen: new row violates row-level security policy
```

## 🔍 Causa Raíz

Tu tabla `product` **NO TENÍA políticas RLS para UPDATE**, entonces cuando intentas actualizar el producto al subir imágenes:

```typescript
// En addImageToProduct():
await this.supabaseClient
  .from("product")
  .update(updateData) // ❌ BLOQUEADO POR RLS
  .eq("product_id", productId);
```

Supabase bloquea la operación porque no hay una política que lo permita.

---

## ✅ La Solución

### Ejecuta este SQL en Supabase:

```sql
-- 1. Habilitar RLS (si no está habilitado)
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;

-- 2. Política de SELECT (ver productos propios)
CREATE POLICY "Usuarios pueden ver sus propios productos"
    ON public.product
    FOR SELECT
    USING (admin_id = auth.uid());

-- 3. Política de INSERT (crear productos)
CREATE POLICY "Usuarios autenticados pueden crear productos"
    ON public.product
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND admin_id = auth.uid()
    );

-- 4. Política de UPDATE (actualizar productos) ⭐ ESTA ES LA CRUCIAL
CREATE POLICY "Usuarios pueden actualizar sus propios productos"
    ON public.product
    FOR UPDATE
    USING (admin_id = auth.uid())
    WITH CHECK (admin_id = auth.uid());

-- 5. Política de DELETE (eliminar productos)
CREATE POLICY "Usuarios pueden eliminar sus propios productos"
    ON public.product
    FOR DELETE
    USING (admin_id = auth.uid());

-- 6. Política OPCIONAL (ver productos en encuestas públicas)
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

## 📋 Pasos para Ejecutar

### 1️⃣ Ve a Supabase Dashboard

- Abre [app.supabase.com](https://app.supabase.com)
- Selecciona tu proyecto

### 2️⃣ Abre el SQL Editor

- Click en **SQL Editor** en el menú lateral
- Click en **New Query**

### 3️⃣ Ejecuta el Script Completo

Tienes **3 opciones**:

#### Opción A: Solo Product (Rápido)

Copia el script de arriba (6 políticas para `product`)

#### Opción B: Completo (Recomendado)

Usa el archivo: `docs/COMPLETE_DATABASE_WITH_RLS.sql`

- Incluye **todas las tablas** con RLS correcto
- Es más seguro y completo

#### Opción C: Manual

Ejecuta solo la política de UPDATE:

```sql
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden actualizar sus propios productos"
    ON public.product
    FOR UPDATE
    USING (admin_id = auth.uid())
    WITH CHECK (admin_id = auth.uid());
```

### 4️⃣ Ejecuta

- Click en **Run** (o `Ctrl+Enter`)
- Deberías ver: ✅ "Success. No rows returned"

---

## 🧪 Verifica que Funciona

### Método 1: Query SQL

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'product';
```

Deberías ver:

- ✅ "Usuarios pueden ver sus propios productos" - SELECT
- ✅ "Usuarios autenticados pueden crear productos" - INSERT
- ✅ "Usuarios pueden actualizar sus propios productos" - UPDATE ⭐
- ✅ "Usuarios pueden eliminar sus propios productos" - DELETE
- ✅ "Usuarios pueden ver productos de encuestas públicas" - SELECT

### Método 2: Prueba en tu App

Intenta subir imágenes de nuevo:

```typescript
const result = await addImagesBatchAction(productId, images, true);
console.log(result); // Debería ser { ok: true, uploaded: X }
```

---

## 🎯 ¿Por Qué Pasó Esto?

### Tu esquema original:

```sql
CREATE TABLE public.product (...);
-- ❌ Sin RLS ni políticas
```

### Cuando RLS está habilitado sin políticas:

```
1. Usuario crea producto → Puede o no funcionar (depende de config)
2. Usuario intenta UPDATE → ❌ BLOQUEADO (no hay política)
3. Error: "new row violates row-level security policy"
```

### Con las políticas RLS:

```
1. Usuario crea producto → ✅ Política INSERT lo permite
2. Usuario intenta UPDATE → ✅ Política UPDATE lo permite
3. Update exitoso → ✅ Imagen subida correctamente
```

---

## 📊 Comparación

| Operación | Sin RLS     | Con RLS (mal configurado) | Con RLS (bien configurado) |
| --------- | ----------- | ------------------------- | -------------------------- |
| INSERT    | ✅ Funciona | ❌ Bloqueado              | ✅ Funciona                |
| SELECT    | ✅ Funciona | ❌ Bloqueado              | ✅ Funciona                |
| UPDATE    | ✅ Funciona | ❌ **BLOQUEADO**          | ✅ **Funciona**            |
| DELETE    | ✅ Funciona | ❌ Bloqueado              | ✅ Funciona                |

---

## 🔒 Seguridad RLS

### ¿Qué hace cada parte?

```sql
CREATE POLICY "nombre"
    ON tabla
    FOR UPDATE                    -- Tipo de operación
    USING (admin_id = auth.uid()) -- ¿Qué filas puede ver?
    WITH CHECK (admin_id = auth.uid()) -- ¿Qué puede guardar?
```

### Ejemplo práctico:

```sql
-- Usuario A (ID: aaa-111)
-- Usuario B (ID: bbb-222)

-- Usuario A intenta actualizar producto de Usuario B:
UPDATE product
SET name = 'Hacked'
WHERE product_id = 'producto-de-B';

-- RLS evalúa:
USING (admin_id = auth.uid())
-- ¿admin_id (bbb-222) == auth.uid() (aaa-111)?
-- ❌ NO → BLOQUEADO

-- Usuario A intenta actualizar SU producto:
UPDATE product
SET name = 'Mi Producto'
WHERE product_id = 'producto-de-A';

-- RLS evalúa:
USING (admin_id = auth.uid())
-- ¿admin_id (aaa-111) == auth.uid() (aaa-111)?
-- ✅ SÍ → PERMITIDO
```

---

## 🐛 Troubleshooting

### Si aún tienes errores:

#### 1. Verifica autenticación

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("Usuario:", user?.id); // Debe tener un ID
```

#### 2. Verifica admin_id del producto

```sql
SELECT product_id, admin_id, name
FROM product
WHERE product_id = 'tu-product-id';
```

#### 3. Verifica políticas

```sql
SELECT * FROM pg_policies WHERE tablename = 'product';
```

#### 4. Desactiva RLS temporalmente (para debug)

```sql
-- ⚠️ Solo para DEBUG, NO en producción
ALTER TABLE public.product DISABLE ROW LEVEL SECURITY;

-- Prueba tu código
-- ...

-- Reactiva RLS
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;
```

#### 5. Elimina y recrea políticas

```sql
-- Si hay conflictos
DROP POLICY IF EXISTS "nombre_antiguo" ON public.product;

-- Recrea con el script completo
```

---

## ✅ Checklist de Solución

- [ ] Ejecuté el script SQL en Supabase
- [ ] Vi "Success. No rows returned"
- [ ] Verifiqué las políticas con `SELECT * FROM pg_policies WHERE tablename = 'product'`
- [ ] Veo 5-6 políticas para `product`
- [ ] Probé subir imágenes de nuevo
- [ ] ✅ **Funciona sin errores**

---

## 🎉 Resultado Esperado

Después de aplicar la solución:

```typescript
// Antes:
const result = await addImagesBatchAction(productId, images, true);
// ❌ Error: "new row violates row-level security policy"

// Después:
const result = await addImagesBatchAction(productId, images, true);
// ✅ { ok: true, error: null, uploaded: 36 }
```

---

## 📚 Archivos de Referencia

1. **`docs/PRODUCT_RLS_POLICIES.sql`** - Solo políticas de product
2. **`docs/COMPLETE_DATABASE_WITH_RLS.sql`** - Esquema completo con todas las políticas ⭐
3. **`docs/RLS_ERROR_FIX.md`** - Guía detallada del error

---

## 🚀 Próximos Pasos

Una vez resuelto el error:

1. ✅ Sube imágenes sin problemas
2. ✅ Los contadores (`size`, `num_images`) se actualizan automáticamente
3. ✅ La compresión WebP funciona
4. ✅ El sistema completo está operativo

---

¡Ejecuta el script y estarás listo! 🎊

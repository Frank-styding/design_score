# 🎯 SOLUCIÓN PASO A PASO: Error RLS

## 🚨 Error Actual

```
Error agregando imagen: new row violates row-level security policy
```

---

## ✅ SOLUCIÓN EN 3 PASOS

### **PASO 1: Ejecutar Script de Limpieza**

1. Ve a [app.supabase.com](https://app.supabase.com)
2. Abre tu proyecto
3. Click en **SQL Editor** → **New Query**
4. Copia y pega el contenido del archivo: `docs/CLEAN_AND_RECREATE_RLS.sql`
5. Click en **Run** o presiona `Ctrl+Enter`

**Resultado esperado:**

```
✅ Eliminada política: ...
✅ Columna admin_id ya existe
✅ Productos con admin_id NULL: 0
✅ Success: 5 políticas creadas
```

---

### **PASO 2: Verificar admin_id de Productos**

Ejecuta en **SQL Editor**:

```sql
-- Ver productos sin admin_id
SELECT
    product_id,
    name,
    admin_id,
    created_at
FROM public.product
WHERE admin_id IS NULL
ORDER BY created_at DESC;
```

**Si hay productos con admin_id NULL:**

```sql
-- Obtener tu user_id
SELECT id, email FROM auth.users;

-- Copiar tu ID y ejecutar (reemplaza 'tu-user-id'):
UPDATE public.product
SET admin_id = 'tu-user-id-aqui'
WHERE admin_id IS NULL;
```

---

### **PASO 3: Probar en tu Aplicación**

1. Abre la consola del navegador (`F12`)
2. Intenta subir imágenes
3. **Observa los logs:**

```
🔍 DEBUG - Usuario autenticado: { id: "xxx", email: "xxx@xxx.com", hasUser: true }
🔍 DEBUG - Producto: {
  product_id: "xxx",
  name: "xxx",
  admin_id: "xxx",
  current_user_id: "xxx",
  admin_id_match: true,  ← DEBE SER true
  error: null            ← DEBE SER null
}
```

**Si `admin_id_match` es `false`:**

- ❌ El producto tiene un admin_id diferente
- ✅ Ejecuta el UPDATE del Paso 2

**Si hay `error`:**

- ❌ Hay un problema con la query
- ✅ Revisa los logs completos en consola

---

## 📋 Checklist Completo

### Antes de Empezar:

- [ ] Tengo acceso al SQL Editor de Supabase
- [ ] Sé cuál es mi user_id (puedes verlo con `SELECT auth.uid()` desde la app)

### Durante la Ejecución:

- [ ] Ejecuté `CLEAN_AND_RECREATE_RLS.sql`
- [ ] Vi el mensaje "5 políticas creadas"
- [ ] Verifiqué que no hay productos con admin_id NULL
- [ ] Si había productos NULL, les asigné mi user_id

### Verificación Final:

- [ ] Los logs muestran `hasUser: true`
- [ ] Los logs muestran `admin_id_match: true`
- [ ] Los logs NO muestran errores
- [ ] Las imágenes se suben sin error RLS

---

## 🔍 Diagnóstico por Logs

### Caso 1: `hasUser: false`

```typescript
🔍 DEBUG - Usuario autenticado: { id: undefined, hasUser: false }
```

**Problema:** No estás autenticado  
**Solución:**

- Inicia sesión de nuevo
- Verifica que tu token no haya expirado
- Revisa la configuración de Supabase

---

### Caso 2: `admin_id_match: false`

```typescript
🔍 DEBUG - Producto: {
  admin_id: "aaa-111",
  current_user_id: "bbb-222",
  admin_id_match: false  ← PROBLEMA
}
```

**Problema:** El producto pertenece a otro usuario  
**Solución:**

```sql
UPDATE public.product
SET admin_id = 'bbb-222'  -- Tu user_id actual
WHERE product_id = 'el-product-id';
```

---

### Caso 3: `error: "..."`

```typescript
🔍 DEBUG - Producto: {
  error: "new row violates row-level security policy"
}
```

**Problema:** Las políticas RLS no se aplicaron correctamente  
**Solución:**

1. Ejecuta `CLEAN_AND_RECREATE_RLS.sql` de nuevo
2. Verifica con:
   ```sql
   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'product';
   ```
3. Deberías ver exactamente 5 políticas

---

### Caso 4: `admin_id: null`

```typescript
🔍 DEBUG - Producto: {
  admin_id: null,  ← PROBLEMA
  current_user_id: "xxx"
}
```

**Problema:** El producto no tiene admin_id asignado  
**Solución:**

```sql
UPDATE public.product
SET admin_id = 'tu-user-id'
WHERE product_id = 'el-product-id';
```

---

## 🛠️ Herramientas de Debug

### Ver todas las políticas:

```sql
SELECT
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

### Ver tu user_id (desde la app):

```typescript
const {
  data: { user },
} = await supabase.auth.getUser();
console.log("Mi user_id:", user?.id);
```

### Test de UPDATE directo:

```typescript
const { data, error } = await supabase
  .from("product")
  .update({ name: "Test" })
  .eq("product_id", productId)
  .select();
console.log({ data, error });
```

---

## ⚠️ Si NADA Funciona

### Opción 1: Desactivar RLS temporalmente (solo para debug)

```sql
-- SOLO PARA DEBUG - NO DEJAR ASÍ EN PRODUCCIÓN
ALTER TABLE public.product DISABLE ROW LEVEL SECURITY;
```

Prueba tu código. Si funciona, el problema es definitivamente con las políticas RLS.

Luego reactiva:

```sql
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;
```

Y ejecuta `CLEAN_AND_RECREATE_RLS.sql` de nuevo.

---

### Opción 2: Política permisiva temporal

```sql
-- Solo para debug
CREATE POLICY "debug_allow_all"
    ON public.product
    FOR ALL
    USING (true)
    WITH CHECK (true);
```

Si esto funciona, el problema es con la condición `admin_id = auth.uid()`.

Elimínala después:

```sql
DROP POLICY "debug_allow_all" ON public.product;
```

---

## 📞 Soporte

Si después de todos estos pasos el error persiste, comparte:

1. **Output del script de limpieza**
2. **Logs de debug de la consola** (los 🔍)
3. **Resultado de esta query:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'product';
   ```
4. **Resultado de esta query:**
   ```sql
   SELECT product_id, admin_id FROM product LIMIT 5;
   ```

---

## 🎉 Éxito

Cuando funcione, deberías ver:

```
🔍 DEBUG - Usuario autenticado: { id: "xxx", hasUser: true }
🔍 DEBUG - Producto: {
  admin_id_match: true,
  error: null
}
✅ Producto y 36 imágenes subidas correctamente
```

---

## 🗑️ Limpieza Final

Una vez que todo funcione, **puedes eliminar los logs de debug**:

1. Abre `src/app/actions/productActions.ts`
2. Elimina todos los `console.log("🔍 DEBUG...")`
3. Listo!

---

¡Sigue los 3 pasos en orden y el error desaparecerá! 🚀

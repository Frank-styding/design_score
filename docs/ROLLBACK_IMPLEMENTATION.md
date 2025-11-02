# 🔄 Rollback Automático en Subida de Productos

## 🎯 Problema

Si falla la subida de imágenes **después** de crear el producto, quedas con un producto "huérfano" en la base de datos sin imágenes.

### ❌ Escenario sin Rollback:

```
1. Crear producto → ✅ Producto creado (ID: abc-123)
2. Comprimir imágenes → ✅ OK
3. Subir imagen 1 → ✅ OK
4. Subir imagen 2 → ✅ OK
5. Subir imagen 3 → ❌ ERROR (falla conexión)
6. Mostrar error al usuario
7. Producto abc-123 queda en DB con 2 imágenes (debería tener 36)
   → Producto "huérfano" o incompleto ❌
```

---

## ✅ Solución: Rollback Automático

### Flujo con Rollback:

```
1. Crear producto → ✅ Producto creado (ID: abc-123)
2. Comprimir imágenes → ✅ OK
3. Subir imagen 1 → ✅ OK
4. Subir imagen 2 → ✅ OK
5. Subir imagen 3 → ❌ ERROR
6. Detectar error → Activar rollback
7. Eliminar producto abc-123 → ✅ Producto eliminado
8. Eliminar imágenes parciales del Storage → ✅ Limpiado
9. Mostrar error al usuario: "Error en subida. Producto eliminado automáticamente"
   → Sin productos huérfanos ✅
```

---

## 🔧 Implementación

### Código con Rollback:

```typescript
const product = await createProductAction({ ... });
if (!product) throw new Error("No se pudo crear el producto");

// Flag para controlar rollback
let needsRollback = true;

try {
  // Intentar subir imágenes
  for (let i = 0; i < images.length; i += batchSize) {
    const result = await addImagesBatchAction(
      product.id,
      batch,
      i === 0
    );

    if (!result.ok) {
      throw new Error(result.error); // Trigger rollback
    }
  }

  // Si llegamos aquí, todo OK
  needsRollback = false;
  setSuccess("✅ Producto y imágenes subidas");

} catch (uploadError: any) {
  // ROLLBACK: Eliminar producto si falla
  if (needsRollback && product.id) {
    console.warn("⚠️ Error en subida, eliminando producto...");

    const { deleteProductAction } = await import("./actions/productActions");
    const deleteResult = await deleteProductAction(product.id);

    if (deleteResult.ok) {
      console.log("✅ Producto eliminado (rollback)");
      setError(`${uploadError.message}. Producto eliminado automáticamente.`);
    } else {
      console.error("❌ No se pudo eliminar:", deleteResult.error);
      setError(`${uploadError.message}. ADVERTENCIA: Producto ${product.id} quedó huérfano.`);
    }
  }

  throw uploadError; // Re-throw para catch exterior
}
```

---

## 📊 Casos de Uso

### Caso 1: Todo Exitoso ✅

```
1. Crear producto
2. Subir 36 imágenes → ✅ Todas OK
3. needsRollback = false
4. Usuario ve: "✅ Producto y 36 imágenes subidas"
```

### Caso 2: Error en Imagen 15 ❌

```
1. Crear producto (ID: abc-123)
2. Subir imagen 1-14 → ✅ OK
3. Subir imagen 15 → ❌ ERROR
4. needsRollback = true → Activar rollback
5. Eliminar producto abc-123 → ✅
6. Eliminar 14 imágenes del Storage → ✅
7. Usuario ve: "Error en batch de imágenes. Producto eliminado automáticamente."
```

### Caso 3: Error en Creación ❌

```
1. Crear producto → ❌ ERROR (antes de subir imágenes)
2. throw Error("No se pudo crear el producto")
3. No se ejecuta rollback (no hay producto que eliminar)
4. Usuario ve: "No se pudo crear el producto"
```

### Caso 4: Rollback Falla ❌❌

```
1. Crear producto (ID: abc-123)
2. Subir imágenes → ❌ ERROR
3. Intentar eliminar producto → ❌ ERROR (conexión perdida)
4. Usuario ve: "Error en batch. ADVERTENCIA: Producto abc-123 quedó huérfano."
5. Admin puede eliminar manualmente después
```

---

## 🛡️ Ventajas del Rollback

### 1. **Consistencia de Datos**

- ✅ No hay productos sin imágenes
- ✅ No hay productos "a medias"
- ✅ Base de datos limpia

### 2. **Mejor UX**

- ✅ Usuario sabe que no hay productos huérfanos
- ✅ Puede reintentar sin preocupaciones
- ✅ Mensaje claro de lo que pasó

### 3. **Menos Trabajo Manual**

- ✅ No necesitas limpiar productos huérfanos manualmente
- ✅ Ahorro de tiempo del admin
- ✅ Menos soporte técnico

### 4. **Mejor para Testing**

- ✅ Puedes probar sin preocuparte de limpiar
- ✅ Entorno de desarrollo limpio
- ✅ Fácil detectar problemas

---

## 🔍 Logs y Debugging

### Logs en Consola:

**Caso exitoso:**

```
🔄 Comprimiendo 36 imágenes...
✅ Comprimido: 0_0.png (523.4KB → 78.2KB)
...
✅ Todas las imágenes comprimidas
→ Producto creado: abc-123
→ Batch 1/2 completado (20 imágenes)
→ Batch 2/2 completado (16 imágenes)
✅ Producto y 36 imágenes subidas correctamente
```

**Caso con rollback:**

```
🔄 Comprimiendo 36 imágenes...
✅ Todas las imágenes comprimidas
→ Producto creado: abc-123
→ Batch 1/2 completado (20 imágenes)
❌ Error en batch de imágenes: new row violates RLS policy
⚠️ Error en subida de imágenes, eliminando producto...
→ Eliminando producto abc-123...
→ Eliminando archivos del Storage...
✅ Producto eliminado correctamente (rollback)
```

---

## ⚙️ Configuración

### Variables de Control:

```typescript
// Flag para controlar si hacer rollback
let needsRollback = true;

// Si todo OK, desactivar rollback
needsRollback = false;

// Solo hacer rollback si:
if (needsRollback && product.id) {
  // Eliminar producto...
}
```

### Import Dinámico:

```typescript
// Evitar imports circulares
const { deleteProductAction } = await import("./actions/productActions");
```

---

## 🧪 Testing

### Test Manual:

1. **Simular error de red:**

   ```typescript
   // En addImagesBatchAction, agregar:
   if (Math.random() > 0.5) {
     throw new Error("Simulated network error");
   }
   ```

2. **Verificar rollback:**

   - Intenta subir producto
   - Debe fallar en algún batch
   - Verifica que el producto se eliminó
   - Verifica que las imágenes se eliminaron

3. **Verificar BD:**
   ```sql
   -- No debe haber productos huérfanos
   SELECT product_id, name, num_images
   FROM product
   WHERE num_images = 0 OR num_images IS NULL;
   ```

---

## 📋 Checklist de Implementación

- [x] Flag `needsRollback` implementado
- [x] Try-catch anidado para capturar errores de upload
- [x] Llamada a `deleteProductAction` en catch
- [x] Logs informativos (warn/error)
- [x] Mensajes de error claros al usuario
- [x] Import dinámico para evitar ciclos
- [x] Manejo de caso donde rollback falla
- [x] Re-throw del error para catch exterior

---

## 🎯 Resultado Final

### Usuario experimenta:

**Escenario 1 - Éxito:**

```
Subiendo carpeta...
✅ Producto y 36 imágenes subidas correctamente
```

**Escenario 2 - Error con Rollback Exitoso:**

```
Subiendo carpeta...
❌ Error en batch de imágenes: [razón].
   Producto eliminado automáticamente.
```

**Escenario 3 - Error y Rollback Falla:**

```
Subiendo carpeta...
❌ Error en batch de imágenes: [razón].
   ADVERTENCIA: Producto abc-123 quedó huérfano.
```

---

## 💡 Mejoras Futuras (Opcional)

### 1. Retry Logic

```typescript
let retries = 3;
while (retries > 0) {
  try {
    await addImagesBatchAction(...);
    break; // Éxito
  } catch (error) {
    retries--;
    if (retries === 0) throw error; // Último intento
    await sleep(1000); // Esperar 1s antes de reintentar
  }
}
```

### 2. Transacciones

```typescript
// Usar transacciones de DB si es posible
await db.transaction(async (tx) => {
  const product = await tx.insert(...);
  await tx.insertImages(...);
  // Si falla, todo se revierte automáticamente
});
```

### 3. Queue System

```typescript
// Encolar subida de imágenes para procesar después
await queueImageUpload(productId, images);
// Permite crear producto sin esperar a las imágenes
```

---

## ✅ Resumen

**Implementado:**

- ✅ Rollback automático si falla subida de imágenes
- ✅ Eliminación de producto y archivos parciales
- ✅ Logs informativos en consola
- ✅ Mensajes claros al usuario
- ✅ Manejo de casos edge (rollback falla)

**Beneficios:**

- ✅ No más productos huérfanos
- ✅ Base de datos limpia
- ✅ Mejor experiencia de usuario
- ✅ Menos trabajo manual de limpieza

---

¡El sistema ahora es más robusto y confiable! 🚀

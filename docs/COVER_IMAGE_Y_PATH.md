# Implementación de Cover Image y Path Automático

## 📋 Resumen de Cambios

Se ha implementado la funcionalidad para que al momento de crear un producto y subir sus imágenes:

1. **La primera imagen se convierte automáticamente en `cover_image`**
2. **Se genera automáticamente el `path` hacia la carpeta de imágenes**

---

## 🔧 Cambios Realizados

### 1. **API de Subida de Archivos RAR/ZIP** (`src/app/api/upload-rar-stream/route.ts`)

#### a) **Ordenamiento de Imágenes**

Se agregó ordenamiento alfabético-numérico para garantizar un orden consistente:

```typescript
// Convertir Map a array para procesamiento en lotes
const imageArray = Array.from(imageFiles.entries());

// Ordenar alfabéticamente por nombre de archivo para tener un orden consistente
// Esto asegura que la primera imagen sea predecible (ej: img_0.png, img_1.png, etc.)
imageArray.sort((a, b) => {
  const nameA = a[0].toLowerCase();
  const nameB = b[0].toLowerCase();
  return nameA.localeCompare(nameB, undefined, {
    numeric: true,
    sensitivity: "base",
  });
});
```

**Beneficios:**

- Orden predecible de imágenes
- La primera imagen es siempre la misma (ej: `img_0.png` antes de `img_1.png`)
- Ordenamiento inteligente que maneja números correctamente (`img_2.png` antes de `img_10.png`)

---

#### b) **Establecimiento de Cover Image**

Se obtiene la URL pública de la primera imagen subida:

```typescript
// 3. Obtener la URL de la primera imagen para usarla como cover_image
let coverImageUrl: string | null = null;
if (uploadedImages.length > 0) {
  const firstImagePath = uploadedImages[0];
  const { url } = await storageRepository.getFileUrl(firstImagePath);
  coverImageUrl = url;
  console.log(
    `✅ [upload-rar-stream] Cover image establecida: ${coverImageUrl}`
  );
} else {
  console.warn(
    `⚠️ [upload-rar-stream] No hay imágenes subidas para establecer cover_image`
  );
}
```

---

#### c) **Actualización del Producto**

Se actualiza el producto con `constants`, `path` (URL completa) y `cover_image`:

```typescript
// 3. Obtener la URL de la primera imagen para cover_image y path
let coverImageUrl: string | null = null;
let storagePathUrl: string | null = null;

if (uploadedImages.length > 0) {
  const firstImagePath = uploadedImages[0];
  const { url } = await storageRepository.getFileUrl(firstImagePath);
  coverImageUrl = url;

  // Extraer la URL base de la carpeta (sin el nombre del archivo)
  // Ejemplo: https://.../files/admin_id/product_id/img_0.png
  // Resultado: https://.../files/admin_id/product_id
  if (url) {
    const lastSlashIndex = url.lastIndexOf("/");
    storagePathUrl = url.substring(0, lastSlashIndex);
  }
}

// 4. Actualizar producto con las constantes, path y cover_image
const updateData: any = {
  constants: constants,
  path: storagePathUrl || storagePath, // ✅ URL completa: https://.../files/admin_id/product_id
  updated_at: new Date().toISOString(),
};

// Agregar cover_image solo si se obtuvo la URL de la primera imagen
if (coverImageUrl) {
  updateData.cover_image = coverImageUrl; // ✅ URL pública de la primera imagen
}

const { product, ok, error } = await productUseCase.updateProduct(
  product_id,
  updateData
);
```

---

#### d) **Mensaje de Finalización Mejorado**

Se incluye información sobre el cover_image en el mensaje de respuesta:

```typescript
// Enviar resultado final
sendMessage({
  type: "complete",
  message: "Procesamiento completado",
  constants,
  uploadedImages,
  imageCount: imageFiles.size,
  storagePath,
  coverImage: coverImageUrl, // ✅ Información del cover image
});
```

---

## 📊 Flujo Completo

```
1. Usuario sube archivo ZIP con imágenes
   ↓
2. Se extraen las imágenes del ZIP
   ↓
3. Las imágenes se ordenan alfabéticamente
   ↓
4. Se suben las imágenes a Supabase Storage
   - Ruta: admin_id/product_id/nombre_imagen.png
   ↓
5. Se obtiene la URL de la primera imagen
   ↓
6. Se extrae la URL base de la carpeta (path completo)
   ↓
7. Se actualiza el producto con:
   - constants: Configuración de KeyShot
   - path: URL completa (https://.../files/admin_id/product_id)
   - cover_image: URL pública de la primera imagen
   ↓
8. ✅ Producto completamente configurado
```

---

## 🎯 Ejemplos

### Ejemplo de Producto Actualizado

**Antes:**

```json
{
  "product_id": "abc123",
  "admin_id": "user456",
  "project_id": "proj789",
  "name": "Producto 1",
  "constants": null,
  "path": null,
  "cover_image": null
}
```

**Después:**

```json
{
  "product_id": "abc123",
  "admin_id": "user456",
  "project_id": "proj789",
  "name": "Producto 1",
  "constants": {
    /* constantes de KeyShot */
  },
  "path": "https://xxxxx.supabase.co/storage/v1/object/public/files/user456/abc123",
  "cover_image": "https://xxxxx.supabase.co/storage/v1/object/public/files/user456/abc123/img_0.png"
}
```

---

## 🔍 Verificación

Para verificar que todo funciona correctamente:

1. **Revisar la consola del servidor** para ver el log:

   ```
   ✅ [upload-rar-stream] Cover image establecida: https://...
   ```

2. **Verificar en la base de datos** que el producto tiene:

   - `cover_image` con URL válida
   - `path` con formato `admin_id/product_id`

3. **Verificar en la UI** que la tarjeta del producto muestra la imagen de portada

---

## 🧪 Casos de Prueba

### ✅ Caso Normal

- Archivo ZIP con imágenes: `img_0.png`, `img_1.png`, `img_2.png`
- **Resultado esperado:**
  - `cover_image` = `https://.../files/admin_id/product_id/img_0.png`
  - `path` = `https://.../files/admin_id/product_id`

### ✅ Caso con Nombres Desordenados

- Archivo ZIP con imágenes: `img_10.png`, `img_2.png`, `img_1.png`
- **Resultado esperado:**
  - Ordenamiento: `img_1.png`, `img_2.png`, `img_10.png`
  - `cover_image` = `https://.../files/admin_id/product_id/img_1.png`
  - `path` = `https://.../files/admin_id/product_id`

### ✅ Caso sin Imágenes

- Archivo ZIP sin imágenes válidas
- **Resultado esperado:**
  - `cover_image` = `null`
  - Log de advertencia en consola

---

## 📝 Notas Técnicas

1. **Ordenamiento:** Se usa `localeCompare` con opciones `numeric: true` para ordenamiento natural
2. **URL Pública:** Se obtiene mediante `storageRepository.getFileUrl()`
3. **Path (URL completa):** Se extrae de la URL de la primera imagen, eliminando el nombre del archivo
   - Ejemplo: De `https://.../files/admin/prod/img_0.png` se obtiene `https://.../files/admin/prod`
4. **Cover Image:** Solo se establece si hay al menos una imagen subida
5. **Fallback:** Si no se puede obtener la URL, se usa la ruta relativa como fallback

---

## 🚀 Próximos Pasos Posibles

- [ ] Permitir al usuario seleccionar manualmente el cover_image desde la UI
- [ ] Agregar vista previa del cover_image durante la creación del proyecto
- [ ] Implementar cambio de cover_image desde la página de edición
- [ ] Agregar opción para regenerar el cover_image si se agregan nuevas imágenes

---

**Fecha de Implementación:** 11 de noviembre de 2025  
**Autor:** GitHub Copilot  
**Archivos Modificados:**

- `src/app/api/upload-rar-stream/route.ts`

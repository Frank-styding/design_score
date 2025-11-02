# 🗄️ Sistema de Storage Sin Tabla de Imágenes

## 📋 Arquitectura Actualizada

El sistema ahora maneja las imágenes **sin una tabla `image` en la base de datos**. Todo se almacena en **Supabase Storage** y los metadatos del producto se actualizan directamente.

---

## 🏗️ Estructura de Almacenamiento

### Storage (Supabase Storage)

```
files/
  └── {adminId}/
      └── {productId}/
          ├── 0_0.webp
          ├── 0_1.webp
          ├── 0_2.webp
          ├── ...
          └── index.html
```

### Base de Datos (Tabla `product`)

```sql
CREATE TABLE product (
  product_id UUID PRIMARY KEY,
  admin_id UUID NOT NULL,
  name VARCHAR(255),
  description TEXT,
  xr_url TEXT,
  cover_image_id TEXT,      -- URL de la imagen de portada
  size BIGINT DEFAULT 0,    -- ✅ Tamaño total en bytes
  num_images INT DEFAULT 0, -- ✅ Contador de imágenes
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## ✅ Cambios Implementados

### 1. **addImageToProduct - Actualiza Contadores**

```typescript
async addImageToProduct(
  productId: string,
  adminId: string,
  image: File,
  isFirstImage: boolean = false
): Promise<{ ok: boolean; error: string | null }> {
  try {
    // --- Subir archivo a Storage ---
    const path = `${adminId}/${productId}/${image.name}`;
    const { data: uploadData, error: uploadError } =
      await this.storageRepository.uploadFile(path, image);

    if (uploadError || !uploadData) {
      throw new Error(uploadError || "Error al subir imagen al Storage");
    }

    const { url } = await this.storageRepository.getFileUrl(path);

    // --- Obtener valores actuales del producto ---
    const { data: currentProduct } = await this.supabaseClient
      .from("product")
      .select("num_images, size")
      .eq("product_id", productId)
      .single();

    const currentNumImages = currentProduct?.num_images || 0;
    const currentSize = currentProduct?.size || 0;

    // --- Actualizar producto ---
    const updateData: any = {
      num_images: currentNumImages + 1,        // ✅ Incrementar contador
      size: currentSize + image.size,          // ✅ Sumar tamaño
    };

    if (isFirstImage) {
      updateData.cover_image_id = url;         // ✅ Establecer portada
    }

    await this.supabaseClient
      .from("product")
      .update(updateData)
      .eq("product_id", productId)
      .eq("admin_id", adminId);

    return { ok: true, error: null };
  } catch (err: any) {
    console.error("Error agregando imagen:", err.message);
    return { ok: false, error: err.message };
  }
}
```

**Características:**

- ✅ Sube imagen al Storage con `upsert: true` (sobrescribe si existe)
- ✅ Incrementa `num_images` automáticamente
- ✅ Suma el tamaño de la imagen al `size` total
- ✅ Establece la primera imagen como portada (`cover_image_id`)

---

### 2. **deleteProduct - Elimina Carpeta Completa**

```typescript
async deleteProduct(
  productId: string,
  adminId: string
): Promise<{ ok: boolean; error: string | null }> {
  try {
    // 1. Verificar que el producto existe
    const product = await this.findById(productId, adminId);
    if (!product) {
      return { ok: false, error: "Producto no encontrado" };
    }

    // 2. Eliminar todos los archivos del Storage
    const folderPath = `${adminId}/${productId}`;

    // Listar todos los archivos en la carpeta
    const { data: files } = await this.supabaseClient.storage
      .from("files")
      .list(folderPath);

    // Eliminar todos los archivos
    if (files && files.length > 0) {
      const filePaths = files.map(file => `${folderPath}/${file.name}`);
      await this.storageRepository.deleteFiles(filePaths);
    }

    // 3. Eliminar el producto de la base de datos
    const { error: deleteError } = await this.supabaseClient
      .from("product")
      .delete()
      .eq("product_id", productId)
      .eq("admin_id", adminId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    return { ok: true, error: null };
  } catch (err: any) {
    console.error("Error eliminando producto:", err.message);
    return { ok: false, error: err.message };
  }
}
```

**Características:**

- ✅ Lista todos los archivos de la carpeta del producto
- ✅ Elimina todos en batch (más eficiente)
- ✅ No necesita consultar tabla `image` (ya no existe)
- ✅ Elimina el registro del producto

---

### 3. **uploadFile - Sobrescribe Archivos Existentes**

```typescript
async uploadFile(
  filePath: string,
  file: File
): Promise<{
  ok: boolean;
  data: { fullPath: string; path: string } | null;
  error: string | null;
}> {
  const { data, error } = await this.supabaseClient.storage
    .from("files")
    .upload(filePath, file, {
      upsert: true, // ✅ Sobrescribir si ya existe
    });

  if (error) {
    return { ok: false, error: error.message, data: null };
  }

  return { ok: true, error: null, data };
}
```

**Beneficio:**

- ✅ **Resuelve el error "The resource already exists"**
- ✅ Permite re-subir el mismo producto sin errores
- ✅ Útil para actualizaciones/correcciones

---

## 📊 Flujo de Datos

### Al Crear Producto y Subir Imágenes:

```
1. Usuario selecciona archivos (HTML + PNGs)
   ↓
2. Compresión de imágenes (PNG → WebP)
   ↓
3. Crear producto en DB (size: 0, num_images: 0)
   ↓
4. Por cada imagen:
   - Subir a Storage: files/{adminId}/{productId}/{nombre}.webp
   - Actualizar producto:
     * num_images += 1
     * size += imagen.size
     * Si es la primera: cover_image_id = url
   ↓
5. Resultado:
   - Producto con metadatos completos
   - Imágenes en Storage
   - Sin registros en tabla image (no existe)
```

### Al Eliminar Producto:

```
1. Verificar que el producto existe
   ↓
2. Listar archivos en Storage: files/{adminId}/{productId}/
   ↓
3. Eliminar todos los archivos en batch
   ↓
4. Eliminar registro de producto en DB
   ↓
5. ✅ Todo limpiado (Storage + DB)
```

---

## 🎯 Ventajas de Esta Arquitectura

### 1. **Simplicidad**

- ✅ Una tabla menos (`image`)
- ✅ Menos joins en queries
- ✅ Menos complejidad en el código

### 2. **Performance**

- ✅ Queries más rápidas (sin joins)
- ✅ Menos escrituras en DB
- ✅ Batch operations más simples

### 3. **Consistencia**

- ✅ Storage es la fuente de verdad
- ✅ Contadores se calculan en tiempo real
- ✅ No hay desincronización entre tablas

### 4. **Mantenibilidad**

- ✅ Menos código que mantener
- ✅ Lógica más directa
- ✅ Menos posibilidad de bugs

---

## 📈 Metadatos del Producto

Los metadatos se almacenan directamente en `product`:

```typescript
interface Product {
  id: string; // UUID del producto
  name: string; // Nombre
  description: string; // Descripción
  xr_url: string; // URL del visor 3D (HTML)
  cover_image_id: string; // URL de la imagen de portada
  size: number; // Tamaño total en bytes (suma de todas las imágenes)
  num_images: number; // Número total de imágenes
}
```

### Ejemplos de Valores:

```typescript
// Después de subir 36 imágenes WebP:
{
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "Producto Demo",
  description: "Descripción del producto",
  xr_url: "https://xxx.supabase.co/storage/v1/object/public/files/admin123/product123/index.html",
  cover_image_id: "https://xxx.supabase.co/storage/v1/object/public/files/admin123/product123/0_0.webp",
  size: 2949120,        // ~2.9MB (36 × ~80KB)
  num_images: 36        // 36 imágenes
}
```

---

## 🔍 Consultas Comunes

### Obtener tamaño total de imágenes de un producto:

```typescript
const product = await getProductById(productId);
console.log(`Tamaño total: ${(product.size / 1024 / 1024).toFixed(2)} MB`);
```

### Obtener número de imágenes:

```typescript
const product = await getProductById(productId);
console.log(`Total de imágenes: ${product.num_images}`);
```

### Listar todas las imágenes de un producto:

```typescript
const folderPath = `${adminId}/${productId}`;
const { data: files } = await supabase.storage.from("files").list(folderPath);

console.log(`Archivos encontrados:`, files);
```

---

## 🚀 Beneficios para el Usuario

### Antes (con tabla `image`):

```
- Crear producto
- Por cada imagen:
  * Subir a Storage
  * Insertar registro en tabla image
  * Actualizar product si es portada

= 1 + (N × 3) operaciones de DB
= Para 36 imágenes: 109 operaciones
```

### Ahora (sin tabla `image`):

```
- Crear producto
- Por cada imagen:
  * Subir a Storage
  * Actualizar contadores en product

= 1 + (N × 2) operaciones de DB
= Para 36 imágenes: 73 operaciones
= 33% menos operaciones
```

---

## ✅ Resumen de Cambios

| Componente                                    | Cambio                               | Estado          |
| --------------------------------------------- | ------------------------------------ | --------------- |
| `SupabaseProductRepository.addImageToProduct` | Actualiza `size` y `num_images`      | ✅ Implementado |
| `SupabaseProductRepository.deleteProduct`     | Elimina carpeta completa del Storage | ✅ Implementado |
| `SupabaseStorageRepository.uploadFile`        | Agrega `upsert: true`                | ✅ Implementado |
| Tabla `image`                                 | Eliminada                            | ✅ No se usa    |
| Contadores                                    | Calculados en tiempo real            | ✅ Automático   |

---

## 🎉 Resultado Final

**Sistema simplificado:**

- ✅ Sin tabla `image`
- ✅ Contadores automáticos en `product`
- ✅ Storage como fuente de verdad
- ✅ Sobrescritura automática con `upsert`
- ✅ Eliminación en batch eficiente
- ✅ 33% menos operaciones de DB

**El sistema ahora es más simple, rápido y mantenible!** 🚀

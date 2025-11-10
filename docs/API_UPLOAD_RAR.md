# API Upload RAR - Documentación

## 📦 Endpoint: `/api/upload-rar`

API para subir archivos RAR de KeyShot, descomprimirlos automáticamente, extraer constantes del HTML y subir imágenes a Supabase Storage.

---

## 🔹 Método: `POST`

### Request

**Content-Type:** `multipart/form-data`

**Body Parameters:**

| Campo        | Tipo   | Requerido | Descripción                                         |
| ------------ | ------ | --------- | --------------------------------------------------- |
| `file`       | File   | ✅ Sí     | Archivo RAR que contiene HTML e imágenes de KeyShot |
| `product_id` | string | ✅ Sí     | UUID del producto al que pertenecen los archivos    |
| `admin_id`   | string | ✅ Sí     | UUID del administrador (dueño del producto)         |

**Headers:**

- Requiere autenticación (cookie de sesión de Supabase)

---

### Response

**Success (200):**

```json
{
  "ok": true,
  "message": "Archivo procesado exitosamente",
  "constants": {
    "ksWidth": 800,
    "ksHeight": 600,
    "ksImageCount": 12,
    "ksViewAngle": 30,
    ...
  },
  "uploadedImages": [
    "user123/product456/0_0.png",
    "user123/product456/0_1.png",
    "user123/product456/1_0.png",
    ...
  ],
  "imageCount": 12,
  "storagePath": "user123/product456"
}
```

**Error (400):**

```json
{
  "error": "No se proporcionó archivo RAR"
}
```

**Error (401):**

```json
{
  "error": "Usuario no autenticado"
}
```

**Error (500):**

```json
{
  "ok": false,
  "error": "Error procesando archivo RAR"
}
```

---

## 🔹 ¿Qué hace la API?

1. **Validación:**

   - Verifica que el usuario esté autenticado
   - Valida que se haya enviado un archivo `.rar`
   - Valida que se proporcionen `product_id` y `admin_id`

2. **Extracción:**

   - Descomprime el archivo RAR
   - Busca el archivo HTML principal (no `instructions.html`)
   - Busca imágenes PNG (excluye iconos de KeyShot)

3. **Procesamiento:**

   - Extrae constantes JavaScript del HTML usando regex
   - Convierte valores a tipos apropiados (string, number, boolean)

4. **Almacenamiento:**

   - Sube todas las imágenes PNG a Supabase Storage
   - Path: `{admin_id}/{product_id}/nombre_imagen.png`
   - Usa `upsert: true` (sobrescribe si ya existe)

5. **Actualización de BD:**
   - Actualiza el producto en la tabla `products`
   - Guarda `constants` como JSONB
   - Guarda `path` del Storage
   - Actualiza `updated_at`

---

## 🧪 Ejemplo de Uso (JavaScript/TypeScript)

### Usando Fetch API

```typescript
async function uploadRarFile(file: File, productId: string, adminId: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("product_id", productId);
  formData.append("admin_id", adminId);

  const response = await fetch("/api/upload-rar", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// Uso
const fileInput = document.getElementById("file-input") as HTMLInputElement;
const file = fileInput.files[0];

const result = await uploadRarFile(
  file,
  "550e8400-e29b-41d4-a716-446655440000",
  "660e8400-e29b-41d4-a716-446655440000"
);

console.log(`Subidas ${result.imageCount} imágenes`);
console.log("Constantes:", result.constants);
```

### Usando React Component

```tsx
import UploadRarForm from "@/src/components/UploadRarForm";

export default function ProductPage() {
  return (
    <UploadRarForm
      productId="550e8400-e29b-41d4-a716-446655440000"
      adminId="660e8400-e29b-41d4-a716-446655440000"
      onSuccess={() => {
        console.log("¡Archivo procesado!");
        // Recargar datos, mostrar mensaje, etc.
      }}
    />
  );
}
```

---

## 📁 Estructura del RAR Esperada

```
producto.rar
├── main.html              ← Contiene las constantes JavaScript
├── 0_0.png               ← Imágenes del producto
├── 0_1.png
├── 1_0.png
├── 1_1.png
├── ...
├── instructions.html     ← Ignorado
├── ks_logo.png          ← Ignorado
└── GoFullScreenIcon.png ← Ignorado
```

**Archivos que se procesan:**

- ✅ `main.html` o cualquier `.html` (excepto `instructions.html`)
- ✅ Todos los `.png` (excepto iconos de KeyShot)

**Archivos ignorados:**

- ❌ `instructions.html`
- ❌ `ks_logo.png`
- ❌ `GoFullScreenIcon.png`
- ❌ `GoFixedSizeIcon.png`
- ❌ `80X80.png`

---

## 🔧 Constantes Extraídas

El archivo HTML de KeyShot contiene variables JavaScript como:

```javascript
var ksWidth = 800;
var ksHeight = 600;
var ksImageCount = 12;
var ksImageName = "image";
var ksAutoSpin = true;
```

La API extrae estas variables y las convierte a JSON:

```json
{
  "ksWidth": 800,
  "ksHeight": 600,
  "ksImageCount": 12,
  "ksImageName": "image",
  "ksAutoSpin": true
}
```

**Tipos soportados:**

- `string`: valores entre comillas `"valor"` o `'valor'`
- `number`: valores numéricos `800`, `3.14`
- `boolean`: `true` o `false`
- `object`: `{}`

---

## 🔒 Seguridad

- ✅ Requiere autenticación (Supabase Auth)
- ✅ Valida formato de archivo (solo `.rar`)
- ✅ Valida parámetros requeridos
- ✅ Row Level Security (RLS) en Supabase protege acceso a Storage
- ✅ Solo el admin del producto puede subir archivos

---

## ⚠️ Límites y Consideraciones

- **Tamaño máximo:** Depende de la configuración de Next.js (default: 4MB para body)
  - Para archivos grandes, ajustar en `next.config.ts`:
  ```typescript
  api: {
    bodyParser: {
      sizeLimit: "10mb";
    }
  }
  ```
- **Formato:** Solo archivos `.rar`
- **Contenido:** Debe contener al menos un archivo HTML y al menos una imagen PNG
- **Storage:** Las imágenes se suben a bucket `files` en Supabase Storage

---

## 🐛 Troubleshooting

### Error: "No se encontró archivo HTML principal en el RAR"

- Verifica que el RAR contenga un archivo `.html` (que no sea `instructions.html`)

### Error: "Error al subir imagen X"

- Verifica permisos de Storage en Supabase (RLS policies)
- Verifica que el bucket `files` exista
- Verifica que `admin_id` sea el dueño del producto

### Error: "Usuario no autenticado"

- Asegúrate de estar logueado
- Verifica que la sesión de Supabase esté activa

---

## 📊 Logs del Servidor

La API genera logs detallados en consola:

```
📦 Procesando archivo RAR: producto.rar
🔄 Extrayendo archivos del RAR...
✅ Extraídas 12 imágenes
✅ Constantes procesadas: 8 variables
📤 Subiendo imágenes a: user123/product456
✅ Subida: 0_0.png
✅ Subida: 0_1.png
...
✅ Producto actualizado con constantes y path
```

---

## 🔗 Archivos Relacionados

- **API Route:** `src/app/api/upload-rar/route.ts`
- **Procesamiento Server:** `src/lib/fileProcessingServer.ts`
- **Componente UI:** `src/components/UploadRarForm.tsx`
- **Procesamiento Client:** `src/lib/fileProcessing.ts`

---

## 🚀 Mejoras Futuras

- [ ] Soporte para archivos ZIP además de RAR
- [ ] Compresión de imágenes en el servidor
- [ ] Validación de dimensiones de imágenes
- [ ] Progress tracking para archivos grandes
- [ ] Procesamiento en background con queue
- [ ] Soporte para múltiples archivos simultáneos

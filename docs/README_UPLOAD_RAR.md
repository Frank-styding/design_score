# 📦 Upload RAR API - Sistema Completo

Sistema completo para procesar archivos RAR de KeyShot, extraer constantes del HTML y subir imágenes a Supabase.

---

## 🎯 ¿Qué hace este sistema?

1. **Recibe** un archivo `.rar` con archivos de KeyShot (HTML + imágenes PNG)
2. **Descomprime** el archivo en memoria (no guarda temporales en disco)
3. **Extrae** constantes JavaScript del archivo HTML principal
4. **Sube** todas las imágenes PNG a Supabase Storage
5. **Actualiza** el producto en la base de datos con las constantes y path

---

## 📁 Archivos Creados

### Backend

| Archivo                           | Descripción                                               |
| --------------------------------- | --------------------------------------------------------- |
| `src/app/api/upload-rar/route.ts` | API Route de Next.js para manejar upload de RAR           |
| `src/lib/fileProcessingServer.ts` | Lógica de procesamiento de archivos en servidor (Node.js) |

### Frontend

| Archivo                            | Descripción                              |
| ---------------------------------- | ---------------------------------------- |
| `src/components/UploadRarForm.tsx` | Componente React para subir archivos RAR |

### Documentación

| Archivo                        | Descripción                      |
| ------------------------------ | -------------------------------- |
| `docs/API_UPLOAD_RAR.md`       | Documentación completa de la API |
| `docs/EXAMPLE_UPLOAD_PAGE.tsx` | Ejemplo de página completa       |
| `docs/README_UPLOAD_RAR.md`    | Este archivo                     |

---

## 🔧 Dependencias Instaladas

```bash
npm install node-unrar-js  # Para descomprimir archivos RAR
```

**Dependencias ya existentes:**

- `formidable` - Para parsear multipart/form-data
- `@supabase/supabase-js` - Cliente de Supabase

---

## 🚀 Cómo Usar

### 1. Usando el componente React

```tsx
import UploadRarForm from "@/src/components/UploadRarForm";

export default function ProductPage() {
  return (
    <UploadRarForm
      productId="tu-product-id-uuid"
      adminId="tu-admin-id-uuid"
      onSuccess={() => {
        console.log("¡Procesado!");
        // Recargar datos, redirigir, etc.
      }}
    />
  );
}
```

### 2. Llamando directamente a la API

```typescript
const formData = new FormData();
formData.append("file", rarFile);
formData.append("product_id", productId);
formData.append("admin_id", adminId);

const response = await fetch("/api/upload-rar", {
  method: "POST",
  body: formData,
});

const result = await response.json();
console.log(result.constants); // Constantes extraídas
console.log(result.uploadedImages); // Rutas de imágenes
```

---

## 📊 Flujo de Datos

```
┌─────────────────┐
│  Usuario sube   │
│   archivo.rar   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│  POST /api/upload-rar       │
│  - Valida autenticación     │
│  - Valida formato .rar      │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  processRarFile()           │
│  - Extrae archivos del RAR  │
│  - Busca HTML e imágenes    │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  extractConstantsFromHTML() │
│  - Parsea variables JS      │
│  - Convierte tipos          │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Supabase Storage           │
│  - Sube cada imagen PNG     │
│  - Path: {admin}/{product}  │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│  Supabase Database          │
│  UPDATE products SET:       │
│  - constants = {...}        │
│  - path = "admin/product"   │
└─────────────────────────────┘
```

---

## 🔐 Seguridad

- ✅ **Autenticación obligatoria** - Requiere usuario logueado
- ✅ **Validación de formato** - Solo archivos `.rar`
- ✅ **Row Level Security** - Supabase RLS protege Storage y DB
- ✅ **Sin archivos temporales** - Todo se procesa en memoria
- ✅ **Validación de ownership** - Solo el admin puede actualizar su producto

---

## 📋 Requisitos del Archivo RAR

### ✅ Debe contener:

- **1 archivo HTML** (excepto `instructions.html`)
  - Ejemplo: `main.html`, `index.html`, `viewer.html`
  - Contiene las variables JavaScript con constantes
- **N imágenes PNG**
  - Ejemplo: `0_0.png`, `0_1.png`, `1_0.png`, etc.
  - Generadas por KeyShot Web Export

### ❌ Se ignoran:

- `instructions.html`
- `ks_logo.png`
- `GoFullScreenIcon.png`
- `GoFixedSizeIcon.png`
- `80X80.png`

---

## 🧪 Testing

### Probar localmente:

1. **Iniciar servidor de desarrollo:**

   ```bash
   npm run dev
   ```

2. **Crear un producto de prueba** (necesitas `product_id` y `admin_id`)

3. **Preparar archivo RAR:**

   - Exporta un modelo desde KeyShot (Web Export)
   - Comprime la carpeta en `.rar`

4. **Usar el componente:**

   ```tsx
   <UploadRarForm productId="tu-uuid-aqui" adminId="tu-uuid-aqui" />
   ```

5. **Verificar resultado:**
   - Revisa Storage en Supabase Dashboard
   - Revisa campo `constants` en tabla `products`

---

## 🐛 Troubleshooting

### "No se encontró archivo HTML principal"

**Problema:** El RAR no contiene un archivo `.html` válido  
**Solución:** Verifica que el RAR tenga un HTML (que no sea `instructions.html`)

### "Error al subir imagen X"

**Problema:** Permisos de Storage incorrectos  
**Solución:**

1. Verifica que el bucket `files` exista en Supabase
2. Revisa RLS policies del bucket
3. Verifica que `admin_id` sea el dueño del producto

### "Usuario no autenticado"

**Problema:** Sin sesión activa  
**Solución:** Asegúrate de estar logueado con Supabase Auth

### "El archivo debe ser .rar"

**Problema:** Formato incorrecto  
**Solución:** Solo se aceptan archivos `.rar` (no `.zip`)

---

## 🔄 Diferencias con el Procesamiento del Cliente

| Aspecto        | Cliente (`fileProcessing.ts`) | Servidor (`fileProcessingServer.ts`) |
| -------------- | ----------------------------- | ------------------------------------ |
| **Entorno**    | Navegador                     | Node.js                              |
| **Input**      | `FileList` (del `<input>`)    | `Buffer` (archivo RAR)               |
| **Compresión** | ✅ Comprime PNGs a WebP       | ❌ No comprime (sube PNG original)   |
| **Extracción** | ❌ No extrae RAR              | ✅ Extrae archivos del RAR           |
| **Librería**   | `browser-image-compression`   | `node-unrar-js`                      |
| **Uso**        | Componente `UploadFolderForm` | API Route `upload-rar`               |

---

## 📈 Mejoras Futuras

### Alta prioridad:

- [ ] Soporte para archivos `.zip` además de `.rar`
- [ ] Validación de tamaño máximo de archivo
- [ ] Progress tracking para uploads grandes

### Media prioridad:

- [ ] Compresión de imágenes en servidor (PNG → WebP)
- [ ] Validación de dimensiones de imágenes
- [ ] Límite de cantidad de imágenes por producto

### Baja prioridad:

- [ ] Procesamiento en background con queue (Bull/BullMQ)
- [ ] Soporte para múltiples archivos simultáneos
- [ ] Generación de thumbnails automática
- [ ] Soporte para otros formatos 3D

---

## 🔗 Referencias

- [node-unrar-js](https://www.npmjs.com/package/node-unrar-js) - Librería de extracción RAR
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) - Docs de API Routes
- [Supabase Storage](https://supabase.com/docs/guides/storage) - Docs de Storage
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData) - Para upload de archivos

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs del servidor (terminal donde corre `npm run dev`)
2. Revisa la consola del navegador
3. Verifica configuración de Supabase (RLS, bucket, permisos)
4. Lee la documentación completa en `docs/API_UPLOAD_RAR.md`

---

## ✅ Checklist de Implementación

- [x] Instalar `node-unrar-js`
- [x] Crear `fileProcessingServer.ts` con lógica de extracción
- [x] Crear API Route `/api/upload-rar`
- [x] Crear componente `UploadRarForm.tsx`
- [x] Documentar API completa
- [x] Crear ejemplo de uso
- [ ] Crear tests unitarios
- [ ] Configurar límites de tamaño en Next.js config
- [ ] Añadir validación de RLS policies en Supabase
- [ ] Deploy y testing en producción

---

**🎉 ¡Sistema completo y listo para usar!**

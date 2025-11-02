# Modularización de Componentes

## 📋 Resumen

Se ha refactorizado `src/app/page.tsx` (555 líneas) separando los componentes y utilidades en módulos independientes para mejorar la mantenibilidad, reusabilidad y organización del código.

## 🗂️ Estructura Creada

```
src/
├── app/
│   └── page.tsx (60 líneas) ✅ Reducido 88.9%
├── components/
│   ├── AuthForm.tsx ✅ Nuevo
│   ├── UploadFolderForm.tsx ✅ Nuevo
│   └── ViewProduct.tsx ✅ Nuevo
└── lib/
    └── fileProcessing.ts ✅ Nuevo
```

## 📦 Módulos Creados

### 1. `src/components/AuthForm.tsx`

**Responsabilidad:** Formulario de autenticación (login/signup)

**Props:**

```typescript
interface AuthFormProps {
  onAuthSuccess: (user: { id: string; email: string }) => void;
}
```

**Features:**

- Toggle entre login y signup
- Validación de errores
- Estados de carga (isSubmitting)
- Integración con authActions (signInAction, signUpAction)

---

### 2. `src/components/UploadFolderForm.tsx`

**Responsabilidad:** Formulario para subir carpetas KeyShot con productos 3D

**Props:**

```typescript
interface UploadFolderFormProps {
  adminId: string;
  onSuccess?: (productId: string) => void;
}
```

**Features:**

- Selector de carpetas (webkitdirectory)
- Compresión automática de imágenes PNG → WebP
- Procesamiento de archivos HTML (extracción de constantes)
- **Rollback automático:** Si falla la subida, elimina el producto creado
- Progreso de subida (mensajes de estado)
- Integración con productActions (createProductAction, addImagesBatchAction, deleteProductAction)

**Proceso:**

1. ✅ Crear producto en base de datos
2. 🔄 Comprimir imágenes (60-80% reducción)
3. 📤 Subir imágenes en batch
4. ❌ Si falla → Eliminar producto (rollback)

---

### 3. `src/components/ViewProduct.tsx`

**Responsabilidad:** Visualización de productos 3D con KeyShot XR Viewer

**Props:**

```typescript
interface ViewProductProps {
  adminId?: string; // Opcional
}
```

**Features:**

- Lista de productos en selector (dropdown)
- Carga asíncrona de productos
- Visor 3D con KeyShotXRViewer (importación dinámica)
- Manejo de estados (loading, empty, error)
- Botón de recarga manual
- Muestra metadata del producto (num_images, size)

**Datos mostrados:**

- Nombre del producto
- Número de imágenes
- Tamaño total (MB)

---

### 4. `src/lib/fileProcessing.ts`

**Responsabilidad:** Utilidades de procesamiento de archivos KeyShot

**Funciones exportadas:**

```typescript
// Extrae constantes JavaScript del HTML de KeyShot
export function extractConstantsFromHTML(htmlText: string): Record<string, any>;

// Comprime imágenes PNG → WebP manteniendo nombre original
export async function compressImage(file: File): Promise<File>;

// Procesa carpeta completa (HTML + PNGs)
export async function processFiles(selectedFiles: FileList): Promise<{
  parsedConstants: string;
  images: File[];
}>;
```

**Configuración de compresión:**

- `maxSizeMB`: 1 MB por imagen
- `maxWidthOrHeight`: 2048px (redimensionamiento automático)
- `useWebWorker`: true (no bloquea UI)
- `fileType`: image/webp (mejor compresión que PNG)
- `initialQuality`: 0.9 (alta calidad)

**Archivos filtrados:**

- ✅ Mantiene: `*.png` (imágenes del producto), `*.html` (configuración)
- ❌ Ignora: `instructions.*`, `GoFixedSizeIcon.*`, `GoFullScreenIcon.*`, `80X80.*`, `ks_logo.*`

---

## 🔧 `src/app/page.tsx` (Refactorizado)

**Antes:** 555 líneas (monolítico)  
**Después:** 60 líneas (componentes modulares)

**Estructura:**

```typescript
export default function Home() {
  // Estados
  const [displayView, setDisplayView] = useState(false); // Upload vs View
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  // Handlers
  const handleSignOut = async () => { ... }
  const handleAuthSuccess = (authenticatedUser: { ... }) => { ... }

  // Render
  return (
    {displayView ? (
      // Vista de UPLOAD
      !user ? <AuthForm /> : <UploadFolderForm />
    ) : (
      // Vista de VISUALIZACIÓN
      <ViewProduct />
    )}
  );
}
```

**Flujo:**

1. `displayView = false` → Muestra `ViewProduct` (por defecto)
2. Click "Subir Producto" → `displayView = true`
3. Si no hay usuario → Muestra `AuthForm`
4. Después de login → Muestra `UploadFolderForm`
5. Click "Ver Productos" → Regresa a `ViewProduct`

---

## 🎯 Beneficios de la Modularización

### ✅ Mantenibilidad

- Archivos más pequeños y enfocados (60 líneas vs 555)
- Responsabilidades claras (SRP - Single Responsibility Principle)
- Fácil localización de bugs

### ✅ Reusabilidad

- `AuthForm` puede reutilizarse en otras páginas
- `fileProcessing.ts` puede usarse en diferentes contextos
- Componentes independientes de la página principal

### ✅ Testabilidad

- Cada módulo puede testearse aisladamente
- Props bien definidas facilitan unit tests
- Funciones puras en `fileProcessing.ts`

### ✅ Performance

- Importación dinámica de KeyShotXRViewer (no SSR)
- Code splitting automático de Next.js
- Menor tamaño de bundle inicial

### ✅ Colaboración

- Múltiples desarrolladores pueden trabajar en paralelo
- Menos conflictos de merge en git
- Código más legible y auto-documentado

---

## 📊 Métricas

| Métrica                 | Antes  | Después       | Mejora |
| ----------------------- | ------ | ------------- | ------ |
| Líneas en page.tsx      | 555    | 60            | -88.9% |
| Archivos                | 1      | 5             | +400%  |
| Responsabilidades       | 6      | 1 por archivo | ✅     |
| Imports duplicados      | Muchos | Optimizados   | ✅     |
| Complejidad ciclomática | Alta   | Baja          | ✅     |

---

## 🔄 Cambios en Entidades

### `src/domain/entities/Product.ts`

Se agregó la propiedad `keyshot_constants`:

```typescript
export interface Product {
  id?: string;
  name: string;
  description?: string;
  size?: number;
  num_images?: number;
  coverImageId?: string;
  xr_url: string;
  keyshot_constants?: string; // ✅ Nuevo - JSON string con config KeyShot XR
}
```

**Uso:** Almacena la configuración JSON del visor 3D (folderName, uCount, vCount, etc.)

---

## 🚀 Próximos Pasos

### Recomendaciones de mejora:

1. **TypeScript estricto:**

   ```typescript
   // Cambiar de `as any` a tipos específicos
   createProductAction({ name: productName } as any); // ❌
   createProductAction({ name: productName } as Partial<Product>); // ✅
   ```

2. **Error boundaries:**

   ```tsx
   // Agregar manejo de errores React
   <ErrorBoundary fallback={<ErrorUI />}>
     <ViewProduct />
   </ErrorBoundary>
   ```

3. **Tests unitarios:**

   ```typescript
   // AuthForm.test.tsx
   it("should call onAuthSuccess with user data", async () => {
     // ...
   });
   ```

4. **Documentación JSDoc:**

   ```typescript
   /**
    * Comprime una imagen PNG a WebP manteniendo el nombre original
    * @param file - Archivo PNG a comprimir
    * @returns Archivo WebP con nombre .png original
    */
   export async function compressImage(file: File): Promise<File>;
   ```

5. **Manejo de loading states:**
   ```tsx
   // Suspense boundaries para lazy loading
   <Suspense fallback={<Spinner />}>
     <KeyShotXRViewer />
   </Suspense>
   ```

---

## 📝 Notas de Implementación

### ⚠️ Consideraciones Importantes:

1. **Browser Image Compression:**

   - Mantiene el nombre original `.png` aunque el formato sea WebP
   - Reduce tamaño en 60-80% promedio
   - Usa Web Workers para no bloquear UI

2. **Rollback Pattern:**

   - Si falla la subida de imágenes, elimina el producto creado
   - Evita productos huérfanos en la base de datos
   - Importación dinámica de `deleteProductAction` evita dependencias circulares

3. **Dynamic Import:**

   - KeyShotXRViewer no se renderiza en SSR
   - Reduce el bundle inicial de la página
   - Muestra loading spinner mientras carga

4. **Props Drilling:**

   - `adminId` se pasa desde `Home` → `UploadFolderForm`
   - Considerar Context API si crece la complejidad
   - Estado de autenticación podría centralizarse

5. **File Input:**
   - `webkitdirectory` solo funciona en navegadores modernos
   - Permite selección de carpetas completas
   - Alternativa: input multiple + drag & drop

---

## ✅ Estado Actual

- ✅ AuthForm extraído y funcional
- ✅ UploadFolderForm extraído con rollback
- ✅ ViewProduct extraído con KeyShotXR
- ✅ fileProcessing.ts creado con utilidades
- ✅ Product.ts actualizado con keyshot_constants
- ✅ page.tsx refactorizado (60 líneas)
- ✅ 0 errores de compilación TypeScript
- ✅ Importaciones correctas y optimizadas

---

## 🎉 Resultado Final

**Antes:**

```
src/app/page.tsx (555 líneas)
├── AuthForm (inline)
├── UploadFolderForm (inline)
├── ViewProduct (inline)
├── extractConstantsFromHTML (inline)
├── compressImage (inline)
└── processFiles (inline)
```

**Después:**

```
src/
├── app/
│   └── page.tsx (60 líneas) → Orquestador
├── components/
│   ├── AuthForm.tsx → Autenticación
│   ├── UploadFolderForm.tsx → Subida de productos
│   └── ViewProduct.tsx → Visualización 3D
└── lib/
    └── fileProcessing.ts → Utilidades
```

**Conclusión:** Código más limpio, mantenible y escalable ✅

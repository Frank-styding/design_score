# 📤 Modal de Subida Individual de Modelos

## 🎯 Descripción General

Nueva funcionalidad que permite subir un modelo 3D individual a través de un modal dedicado, con soporte para drag & drop y asignación de nombre personalizado.

## 📁 Archivos Creados/Modificados

### 1. Nuevo Componente: SingleFileUploadModal

**Ruta:** `src/components/SingleFileUploadModal.tsx`

Modal independiente para subir un solo archivo con las siguientes características:

- ✅ Drag & Drop de archivos
- ✅ Selector de archivos desde explorador
- ✅ Input para nombre del modelo
- ✅ Auto-relleno del nombre basado en el archivo
- ✅ Validación de tipo de archivo (.zip, .rar)
- ✅ Previsualización del archivo seleccionado
- ✅ Indicador de carga durante la subida
- ✅ Manejo de errores

### 2. Componente Actualizado: FileUploadSection

**Ruta:** `src/components/create-project/FileUploadSection.tsx`

**Cambios realizados:**

- ➕ Importación del modal `SingleFileUploadModal`
- ➕ Nuevo estado `isModalOpen` para controlar el modal
- ➕ Props adicionales: `adminId` y `projectId`
- ➕ Función `handleSingleFileUpload` para procesar archivos individuales
- ➕ Botón "Agregar Modelo Individual" en la interfaz
- ➕ Icono `PlusIcon` para el botón

## 🎨 Interfaz del Usuario

### Botón en FileUploadSection

```
┌─────────────────────────────────────────────────┐
│ Subir Archivos                                  │
│                                                 │
│              [➕ Agregar Modelo Individual]     │ ← Nuevo botón
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │   📁 Arrastra archivos aquí...            │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Modal de Subida Individual

```
┌─────────────────────────────────────────────────┐
│ Subir Modelo 3D                           [✕]  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Nombre del Modelo                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ Silla Moderna 2024                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         📤                                 │ │
│  │   Arrastra tu archivo aquí                │ │
│  │   o haz clic para seleccionar             │ │
│  │   Solo archivos .zip o .rar               │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│                     [Cancelar] [Subir Modelo]  │
└─────────────────────────────────────────────────┘
```

### Con Archivo Seleccionado

```
┌─────────────────────────────────────────────────┐
│ Subir Modelo 3D                           [✕]  │
├─────────────────────────────────────────────────┤
│                                                 │
│ Nombre del Modelo                               │
│ ┌─────────────────────────────────────────────┐ │
│ │ Silla Moderna 2024                          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 📄 modelo_silla.zip              🗑️       │ │
│  │    15.24 MB                                │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│                     [Cancelar] [Subir Modelo]  │
└─────────────────────────────────────────────────┘
```

## 🔧 Props del Modal

### SingleFileUploadModal

```typescript
interface SingleFileUploadModalProps {
  isOpen: boolean; // Controla la visibilidad del modal
  onClose: () => void; // Callback al cerrar el modal
  onUpload: (file: File, modelName: string) => Promise<void>; // Callback al subir
  adminId: string; // ID del administrador
  projectId?: string; // ID del proyecto (opcional)
}
```

### Uso del Modal

```typescript
<SingleFileUploadModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  onUpload={handleSingleFileUpload}
  adminId={adminId}
  projectId={projectId}
/>
```

## 🔄 Flujo de Uso

### Paso 1: Abrir Modal

```
Usuario → Click "Agregar Modelo Individual" → Modal se abre
```

### Paso 2: Seleccionar Archivo

```
Opción A: Drag & Drop
  Usuario arrastra archivo .zip/.rar → Archivo se valida → Se muestra

Opción B: Explorador
  Usuario click en área → File explorer se abre → Selecciona archivo
```

### Paso 3: Asignar Nombre

```
Campo "Nombre del Modelo" se auto-rellena con nombre del archivo
Usuario puede editar el nombre según necesite
```

### Paso 4: Subir

```
Usuario click "Subir Modelo" →
  Validación (archivo + nombre) →
  Llamada a onUpload() →
  Procesamiento →
  Éxito/Error
```

### Paso 5: Completar

```
Éxito: Modal se cierra, archivo agregado a la lista
Error: Se muestra mensaje de error, modal permanece abierto
```

## ✅ Validaciones

### Tipo de Archivo

- ✅ Solo acepta `.zip` y `.rar`
- ❌ Otros formatos muestran error

### Campos Requeridos

- ✅ Archivo seleccionado
- ✅ Nombre del modelo (no vacío)
- ❌ Botón "Subir" deshabilitado si falta alguno

### Durante Subida

- 🔒 Modal no se puede cerrar mientras se sube
- 🔒 Campos deshabilitados
- ⏳ Botón muestra "Subiendo..."

## 🎨 Características de UX

### Auto-relleno del Nombre

```typescript
// Al seleccionar "modelo_silla.zip"
// El input se llena automáticamente con "modelo_silla"
const nameWithoutExtension = file.name.replace(/\.(zip|rar)$/i, "");
setModelName(nameWithoutExtension);
```

### Drag & Drop Visual

```typescript
// Estados visuales
isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50";
```

### Indicadores de Estado

- 📤 Icono de upload (área drag & drop)
- 📄 Icono de archivo (cuando está seleccionado)
- ⏳ "Subiendo..." (durante la subida)
- ✅ Cierre automático en éxito
- ❌ Mensaje de error en fallo

## 🔌 Integración con FileUploadSection

### Props Actualizadas

```typescript
interface FileUploadSectionProps {
  initialFiles?: File[];
  onFilesUploaded: (files: File[]) => void;
  onBack: () => void;
  adminId?: string; // ← Nuevo
  projectId?: string; // ← Nuevo
}
```

### Handler de Subida Individual

```typescript
const handleSingleFileUpload = async (file: File, modelName: string) => {
  console.log("Subiendo archivo:", file.name, "con nombre:", modelName);
  // Agregar a la lista de archivos
  setFiles((prev) => [...prev, file]);
};
```

## 📊 Estados del Componente

### SingleFileUploadModal

```typescript
const [file, setFile] = useState<File | null>(null);
const [modelName, setModelName] = useState("");
const [isDragging, setIsDragging] = useState(false);
const [isUploading, setIsUploading] = useState(false);
const [error, setError] = useState("");
```

## 🎯 Eventos Manejados

### Drag & Drop

- `onDragOver` → Prevenir default, activar isDragging
- `onDragLeave` → Desactivar isDragging
- `onDrop` → Prevenir default, procesar archivo

### Archivos

- `onChange` → Procesar archivo seleccionado desde explorador
- Validación automática de tipo
- Auto-relleno de nombre

### Formulario

- `onSubmit` → Validar y ejecutar onUpload
- `onClose` → Limpiar estado y cerrar

## 🚀 Ejemplo de Implementación Completo

```typescript
import SingleFileUploadModal from "@/src/components/SingleFileUploadModal";

function MiComponente() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpload = async (file: File, modelName: string) => {
    try {
      // Tu lógica de subida aquí
      await subirArchivo(file, modelName);
      console.log("✅ Archivo subido:", modelName);
    } catch (error) {
      console.error("❌ Error:", error);
      throw error; // Re-lanzar para que el modal lo maneje
    }
  };

  return (
    <>
      <button onClick={() => setIsModalOpen(true)}>Agregar Modelo</button>

      <SingleFileUploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpload={handleUpload}
        adminId="user-123"
        projectId="project-456"
      />
    </>
  );
}
```

## 🎨 Estilos Personalizables

### Modal

- Overlay: `bg-black bg-opacity-50`
- Container: `bg-white rounded-lg shadow-xl`
- Max width: `max-w-md`

### Drag Area

- Normal: `border-gray-300 bg-gray-50`
- Dragging: `border-blue-500 bg-blue-50`
- Hover: `hover:border-gray-400`

### Botones

- Cancelar: `text-gray-700 hover:text-gray-900`
- Subir: `bg-blue-600 hover:bg-blue-700`
- Deshabilitado: `bg-gray-400 cursor-not-allowed`

## ✨ Mejoras Futuras Posibles

1. **Preview del contenido del ZIP** antes de subir
2. **Progreso de subida** con barra de progreso
3. **Múltiples archivos** en un solo modal
4. **Validación de tamaño** de archivo
5. **Previsualización de imágenes** del modelo
6. **Drag & Drop directo** en la lista de archivos
7. **Edición del nombre** después de subir
8. **Categorización** de modelos

---

✅ **Implementación completada** - Modal de subida individual listo para usar!

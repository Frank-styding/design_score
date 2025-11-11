# Página de Edición de Proyecto

## 📝 Descripción General

La página de edición de proyecto (`/edit-project/[id]`) permite a los usuarios modificar la información básica de un proyecto existente.

## 📍 Ubicación

**Archivo:** `src/app/edit-project/[id]/page.tsx`

**Ruta:** `/edit-project/{project_id}`

## 🎯 Funcionalidades

### 1. Carga del Proyecto

- Obtiene los datos del proyecto usando `getProjectByIdWithProductsAction`
- Muestra un spinner de carga mientras obtiene los datos
- Maneja errores si el proyecto no existe o no se puede cargar

### 2. Formulario de Edición

- **Nombre del Proyecto**: Campo de texto editable
- **Número de Productos**: Campo numérico (1-50)
- Validaciones:
  - Nombre no vacío
  - Número de productos entre 1 y 50

### 3. Información del Proyecto

Panel informativo que muestra:

- ID del proyecto
- Fecha de creación
- Número de productos actualmente creados

### 4. Actualización

- Usa `updateProjectAction` para guardar cambios
- Muestra feedback de éxito/error
- Redirecciona al dashboard tras actualización exitosa

## 🔄 Flujo de Usuario

```
1. Usuario hace clic en "Editar" desde el Dashboard
   ↓
2. Sistema carga datos del proyecto
   ↓
3. Usuario modifica campos (nombre, num_products)
   ↓
4. Usuario hace clic en "Guardar Cambios"
   ↓
5. Sistema valida y actualiza en la base de datos
   ↓
6. Redirección al Dashboard con mensaje de éxito
```

## 🛠️ Componentes Utilizados

- `Input`: Campo de texto personalizado
- `Button`: Botones de acción (Cancelar, Guardar)
- `useRouter`: Navegación y redirección
- `useParams`: Obtener ID del proyecto de la URL

## 📊 Estados del Componente

```typescript
const [isLoading, setIsLoading] = useState(true); // Carga inicial
const [isSaving, setIsSaving] = useState(false); // Guardando cambios
const [project, setProject] = useState<Project | null>(null); // Datos del proyecto
const [name, setName] = useState(""); // Nombre editable
const [numProducts, setNumProducts] = useState(1); // Número editable
const [error, setError] = useState(""); // Mensajes de error
```

## 🔗 Integración con el Dashboard

### Actualización en `dashboard/page.tsx`

El botón de editar en cada tarjeta de proyecto ahora redirige a:

```typescript
const handleEdit = (projectId: string) => {
  window.location.href = `/edit-project/${projectId}`;
};
```

## ⚠️ Advertencias y Notas

### Nota sobre Cambio de Número de Productos

Se muestra un mensaje informativo:

> ⚠️ **Nota:** Cambiar el número de productos no eliminará ni creará productos automáticamente. Solo actualiza la configuración del proyecto. Para agregar o eliminar productos específicos, usa las opciones correspondientes en el dashboard.

Esto significa que:

- Si cambias `num_products` de 4 a 6, NO se crearán automáticamente 2 productos nuevos
- Si cambias de 6 a 4, NO se eliminarán automáticamente 2 productos
- Solo se actualiza la configuración/metadata del proyecto

## 🔒 Seguridad

- Solo el usuario autenticado y dueño del proyecto puede editarlo
- `updateProjectAction` verifica la autenticación del usuario
- Validación en cliente y servidor

## 🎨 Diseño Visual

### Layout

- Máximo ancho: `max-w-2xl`
- Fondo: Gris claro (`bg-gray-50`)
- Formulario en tarjeta blanca con borde y sombra

### Estados Visuales

1. **Cargando**: Spinner animado con mensaje
2. **Error**: Mensaje en rojo con botón para volver
3. **Normal**: Formulario editable con información del proyecto
4. **Guardando**: Botones deshabilitados, texto "Guardando..."

## 📋 Ejemplo de Uso

```typescript
// URL de ejemplo
/edit-project/550e8400-e29b-41d4-a716-446655440000

// Datos que se pueden editar
{
  name: "Mi Proyecto 3D Actualizado",
  num_products: 6
}

// Respuesta exitosa
{
  ok: true,
  project: { ... },
  error: null
}
```

## 🧪 Casos de Prueba

### 1. Edición Exitosa

- Cambiar nombre y guardar ✅
- Cambiar número de productos y guardar ✅
- Redirección al dashboard ✅

### 2. Validaciones

- Nombre vacío → Mostrar alerta ❌
- Número de productos < 1 → Mostrar alerta ❌
- Número de productos > 50 → Mostrar alerta ❌

### 3. Errores

- Proyecto no encontrado → Mostrar mensaje de error ❌
- Error de red → Mostrar alerta con mensaje ❌
- Sin autenticación → Error del servidor ❌

### 4. Cancelación

- Botón "Cancelar" → Volver al dashboard sin guardar ✅

## 🔄 Server Actions Utilizadas

### `getProjectByIdWithProductsAction(projectId)`

```typescript
// Retorna el proyecto con sus productos
Project | null;
```

### `updateProjectAction(projectId, updates)`

```typescript
// Actualiza el proyecto
{
  project: Project | null,
  ok: boolean,
  error: string | null
}
```

## 📱 Responsividad

- Diseño adaptable a diferentes tamaños de pantalla
- Padding ajustado para móviles
- Formulario centrado con máximo ancho controlado

## 🚀 Mejoras Futuras Sugeridas

1. **Edición de Productos Individual**

   - Agregar sección para editar cada producto
   - Permitir cambiar nombres, reordenar, etc.

2. **Edición de Vistas**

   - Permitir modificar configuración de vistas
   - Agregar/eliminar vistas

3. **Subida de Archivos Adicionales**

   - Permitir subir más archivos ZIP para productos existentes
   - Reemplazar imágenes de productos

4. **Vista Previa**

   - Mostrar thumbnails de los productos del proyecto
   - Preview antes de guardar cambios

5. **Historial de Cambios**

   - Registrar modificaciones del proyecto
   - Mostrar última fecha de edición

6. **Validación en Tiempo Real**
   - Feedback inmediato en campos del formulario
   - Mensajes de validación inline

## 📚 Archivos Relacionados

- `src/app/edit-project/[id]/page.tsx` - Página principal
- `src/app/dashboard/page.tsx` - Dashboard con botón de editar
- `src/app/actions/projectActions.ts` - Server actions
- `src/components/ui/Input.tsx` - Componente de input
- `src/components/ui/Button.tsx` - Componente de botón
- `src/domain/entities/Project.ts` - Entidad del proyecto

## 📊 Diagrama de Flujo

```
┌─────────────────────────────────────────┐
│         Dashboard Page                  │
│  (User clicks Edit on project card)    │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│      Edit Project Page Load             │
│  - Get project ID from URL params       │
│  - Call getProjectByIdWithProductsAction│
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│      Display Project Data               │
│  - Show loading spinner                 │
│  - Populate form fields                 │
│  - Display project info panel           │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│      User Edits Fields                  │
│  - Modify name                          │
│  - Change num_products                  │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│      User Clicks "Guardar Cambios"      │
│  - Validate input fields                │
│  - Call updateProjectAction             │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│      Success Response                   │
│  - Show success alert                   │
│  - Redirect to /dashboard               │
└─────────────────────────────────────────┘
```

## ✅ Checklist de Implementación

- [x] Crear página de edición con ruta dinámica `[id]`
- [x] Implementar carga de datos del proyecto
- [x] Crear formulario con validaciones
- [x] Integrar con `updateProjectAction`
- [x] Agregar panel de información del proyecto
- [x] Actualizar dashboard para incluir link de edición
- [x] Agregar mensaje de advertencia sobre num_products
- [x] Implementar estados de carga y error
- [x] Agregar redirección tras guardar
- [x] Documentar funcionalidad

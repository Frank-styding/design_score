# 🚀 Página de Upload - Guía de Uso

## 📍 Ruta: `/upload`

Página completa y simple para autenticación y carga de archivos KeyShot (.rar).

---

## ✨ Características

### 🔐 Autenticación

- ✅ Login y registro de usuarios
- ✅ Gestión de sesión con Supabase Auth
- ✅ Cierre de sesión
- ✅ Protección de rutas (requiere autenticación)

### 📦 Gestión de Productos

- ✅ Ver lista de productos del usuario
- ✅ Crear nuevos productos
- ✅ Seleccionar producto para upload
- ✅ Ver detalles y constantes extraídas

### 📤 Upload de Archivos

- ✅ Subir archivos RAR de KeyShot
- ✅ Procesamiento automático
- ✅ Extracción de constantes del HTML
- ✅ Upload de imágenes a Supabase Storage
- ✅ Feedback visual del progreso

---

## 🎨 Diseño de la Interfaz

### Pantalla de Login (Usuario no autenticado)

```
┌─────────────────────────────────┐
│     📦 Upload KeyShot           │
│  Sube y procesa archivos RAR    │
│                                 │
│  ┌─────────────────────────┐   │
│  │  Iniciar Sesión         │   │
│  │  [email]                │   │
│  │  [password]             │   │
│  │  [Entrar]               │   │
│  │  ¿No tienes cuenta?     │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### Dashboard Principal (Usuario autenticado)

```
┌──────────────────────────────────────────────────────────────┐
│  📦 Upload KeyShot              [🚪 Cerrar Sesión]           │
│  Bienvenido, user@example.com                                │
├──────────────────┬───────────────────────────────────────────┤
│ Mis Productos    │  Producto Seleccionado                    │
│ [➕ Nuevo]       │  ┌─────────────────────────────────────┐  │
│                  │  │  Nombre del producto                │  │
│ ┌──────────────┐ │  │  Descripción                        │  │
│ │ Producto 1   │ │  │  ID: xxx-xxx                        │  │
│ │ ✅ Config.   │ │  │  Peso: 10 kg                        │  │
│ └──────────────┘ │  │  Constantes: 8 variables            │  │
│                  │  └─────────────────────────────────────┘  │
│ ┌──────────────┐ │                                           │
│ │ Producto 2   │ │  ┌─────────────────────────────────────┐  │
│ └──────────────┘ │  │  Subir Archivo KeyShot (.rar)       │  │
│                  │  │  [Seleccionar archivo]              │  │
│                  │  │  [Subir y Procesar]                 │  │
│                  │  └─────────────────────────────────────┘  │
│                  │                                           │
│                  │  📋 Instrucciones de uso                  │
└──────────────────┴───────────────────────────────────────────┘
```

---

## 🔧 Componentes Utilizados

| Componente             | Propósito                           |
| ---------------------- | ----------------------------------- |
| `AuthForm`             | Formulario de login/registro        |
| `UploadRarForm`        | Formulario de carga de archivos RAR |
| `getAllProductsAction` | Obtener productos del usuario       |
| `createProductAction`  | Crear nuevo producto                |
| `signOutAction`        | Cerrar sesión                       |

---

## 📝 Flujo de Usuario

### 1️⃣ Acceso Inicial

```
Usuario visita /upload
    ↓
¿Está autenticado?
    ├─ NO → Mostrar AuthForm
    │        ├─ Login exitoso → Dashboard
    │        └─ Registro → Dashboard
    └─ SÍ → Mostrar Dashboard
```

### 2️⃣ Crear Producto

```
Click en [➕ Nuevo]
    ↓
Formulario aparece
    ↓
Llenar datos:
  - Nombre
  - Descripción
  - Project ID
  - Peso
    ↓
[Crear Producto]
    ↓
Producto agregado a la lista
```

### 3️⃣ Subir Archivo RAR

```
Seleccionar producto de la lista
    ↓
Panel derecho muestra detalles
    ↓
Seleccionar archivo .rar
    ↓
[Subir y Procesar]
    ↓
Procesamiento:
  - Extracción del RAR
  - Procesamiento de HTML
  - Upload de imágenes
  - Actualización de DB
    ↓
✅ Completado
```

---

## 🎯 Estados de la Aplicación

### Estados Principales

- `user` - Usuario autenticado (null si no hay sesión)
- `products` - Lista de productos del usuario
- `selectedProduct` - Producto seleccionado
- `loading` - Estado de carga
- `showCreateProduct` - Toggle del formulario de creación

### Estados del Formulario de Producto

- `newProductName` - Nombre del nuevo producto
- `newProductDescription` - Descripción
- `newProductProjectId` - ID del proyecto padre
- `newProductWeight` - Peso del producto

---

## 🔐 Seguridad

- ✅ **Requiere autenticación** - No se puede acceder sin login
- ✅ **Filtrado por usuario** - Solo ve sus propios productos
- ✅ **Validación de datos** - Campos requeridos en formularios
- ✅ **RLS de Supabase** - Protección a nivel de base de datos
- ✅ **Sesiones seguras** - Manejo automático por Supabase Auth

---

## 📋 Datos del Producto

### Campos Requeridos

- ✅ `name` - Nombre del producto
- ✅ `project_id` - UUID del proyecto padre

### Campos Opcionales

- ⚪ `description` - Descripción del producto
- ⚪ `weight` - Peso del producto (default: 0)

### Campos Automáticos

- 🤖 `product_id` - Generado por Supabase
- 🤖 `admin_id` - Tomado del usuario autenticado
- 🤖 `created_at` - Timestamp de creación
- 🤖 `updated_at` - Timestamp de actualización

### Campos Procesados por Upload

- 📦 `constants` - Extraídas del HTML de KeyShot
- 📦 `path` - Ruta de Storage (`{admin_id}/{product_id}`)
- 📦 `cover_image` - Imagen de portada

---

## 🎨 Indicadores Visuales

### Estados del Producto

| Indicador      | Significado                   |
| -------------- | ----------------------------- |
| ✅ Configurado | Tiene constantes extraídas    |
| 📁 N imgs      | Número de imágenes en Storage |
| Resaltado azul | Producto seleccionado         |

### Estados del Upload

| Color       | Significado             |
| ----------- | ----------------------- |
| 🔵 Azul     | Archivo seleccionado    |
| 🟡 Amarillo | Procesando              |
| 🟢 Verde    | Completado exitosamente |
| 🔴 Rojo     | Error                   |

---

## 🚀 Cómo Acceder

### En Desarrollo

```bash
npm run dev
```

Luego visita: http://localhost:3000/upload

### En Producción

https://tu-dominio.com/upload

---

## 📱 Responsive

La página es completamente responsive:

- **Desktop (lg):** Layout de 3 columnas (1 sidebar + 2 contenido)
- **Tablet/Mobile:** Layout de 1 columna (stacked)

---

## 🔄 Actualizaciones Automáticas

### Después de Crear Producto

- ✅ Lista de productos se recarga
- ✅ Formulario se limpia
- ✅ Toggle de creación se cierra

### Después de Upload Exitoso

- ✅ Alert de confirmación
- ✅ Lista de productos se recarga (para ver nuevas constantes)

---

## ⚙️ Configuración Necesaria

### 1. Variables de Entorno

Asegúrate de tener configuradas:

```env
NEXT_PUBLIC_SUPABASE_URL=tu-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-key
```

### 2. Bucket de Supabase

- Nombre: `files`
- Permisos: Configurados con RLS

### 3. Tablas de Supabase

- `products` - Con campos actualizados
- `projects` - Referencia para `project_id`

---

## 🐛 Solución de Problemas

### "No se cargan los productos"

**Causa:** Error de autenticación o permisos  
**Solución:**

1. Cierra sesión y vuelve a iniciar
2. Verifica RLS policies en Supabase
3. Revisa console del navegador

### "Error al crear producto"

**Causa:** Falta `project_id` o datos inválidos  
**Solución:**

1. Verifica que el UUID del proyecto sea válido
2. Asegúrate que el proyecto existe en la BD
3. Revisa que todos los campos requeridos estén llenos

### "Error al subir archivo"

**Causa:** Formato incorrecto o producto no válido  
**Solución:**

1. Verifica que el archivo sea `.rar`
2. Asegúrate que el producto esté seleccionado
3. Revisa que el RAR contenga HTML + imágenes PNG

---

## 📊 Estadísticas Mostradas

Para cada producto seleccionado:

- 🆔 ID del producto (UUID)
- 📦 ID del proyecto (UUID)
- ⚖️ Peso del producto
- 📊 Número de constantes extraídas
- 🔍 Contenido de constantes (desplegable)

---

## 🎯 Mejoras Futuras

- [ ] Paginación de productos
- [ ] Búsqueda/filtrado de productos
- [ ] Edición de productos existentes
- [ ] Eliminación de productos
- [ ] Preview de imágenes subidas
- [ ] Historial de uploads
- [ ] Soporte para drag & drop
- [ ] Carga múltiple de archivos

---

## 📚 Archivos Relacionados

- **Página:** `src/app/upload/page.tsx`
- **Componentes:**
  - `src/components/AuthForm.tsx`
  - `src/components/UploadRarForm.tsx`
- **Actions:**
  - `src/app/actions/authActions.ts`
  - `src/app/actions/productActions.ts`
- **API:**
  - `src/app/api/upload-rar/route.ts`

---

**🎉 ¡Página lista para usar!**

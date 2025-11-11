# 📺 Visualizador de Proyectos

## 🎯 Descripción General

Funcionalidad para visualizar proyectos en modo presentación, mostrando las vistas configuradas en orden con sus productos asociados. El sistema diferencia automáticamente entre **RUTA** (un solo producto) y **COMPARATIVO** (múltiples productos).

## 📁 Archivos Creados

### 1. Página de Visualización

**Ruta:** `src/app/project/[id]/page.tsx`

Página principal que renderiza el visualizador del proyecto.

**Características:**

- ✅ Muestra vistas en orden según `idx`
- ✅ Diferencia entre RUTA y COMPARATIVO
- ✅ Navegación entre vistas (Siguiente/Anterior)
- ✅ Mensaje final al completar el recorrido
- ✅ Diseño responsivo para múltiples productos

### 2. Hook de Lógica

**Ruta:** `src/hooks/useProjectViewer.ts`

Hook personalizado que maneja toda la lógica del visualizador.

**Responsabilidades:**

- 📥 Carga proyecto y vistas
- 📥 Carga productos por vista
- 🔄 Gestión de navegación entre vistas
- 📊 Estado de carga y errores
- 🏁 Control de mensaje final

## 🎨 Estructura de la Interfaz

### Header

```
┌─────────────────────────────────────────────┐
│ Nombre del Proyecto          Vista X de Y   │
│ RUTA/COMPARATIVO 1          N productos     │
└─────────────────────────────────────────────┘
```

### Área de Visualización

#### RUTA (1 producto)

```
┌─────────────────────────────────────────────┐
│                                             │
│           [Visor 360 del Producto]          │
│                                             │
└─────────────────────────────────────────────┘
```

#### COMPARATIVO (2 productos)

```
┌────────────────────┬────────────────────┐
│ Producto 1         │ Producto 2         │
│ [Visor 360]        │ [Visor 360]        │
└────────────────────┴────────────────────┘
```

#### COMPARATIVO (3+ productos)

```
┌──────────┬──────────┬──────────┬──────────┐
│ Prod 1   │ Prod 2   │ Prod 3   │ Prod 4   │
│ [360]    │ [360]    │ [360]    │ [360]    │
└──────────┴──────────┴──────────┴──────────┘
```

### Footer de Navegación

```
┌─────────────────────────────────────────────┐
│ [Salir]               [← Anterior] [Siguiente →] │
└─────────────────────────────────────────────┘
```

### Pantalla de Mensaje Final

```
┌─────────────────────────────────────────────┐
│              ✓ Icono de Éxito               │
│                                             │
│       ¡Recorrido Completado!                │
│                                             │
│       [Mensaje final del proyecto]          │
│                                             │
│         [Volver al Dashboard]               │
└─────────────────────────────────────────────┘
```

## 🔄 Flujo de Navegación

```
Dashboard
    │
    ├─ Click en Play
    │
    ▼
Proyecto Viewer (Vista 1)
    │
    ├─ Click "Siguiente"
    │
    ▼
Proyecto Viewer (Vista 2)
    │
    ├─ Click "Siguiente"
    │
    ▼
    ...
    │
    ├─ Click "Finalizar" (última vista)
    │
    ▼
Mensaje Final
    │
    ├─ Click "Volver al Dashboard"
    │
    ▼
Dashboard
```

## 🛠️ Uso del Hook

```typescript
import { useProjectViewer } from "@/src/hooks/useProjectViewer";

function MiComponente() {
  const viewer = useProjectViewer(projectId);

  // Estados disponibles
  viewer.isLoading; // boolean
  viewer.error; // string | null
  viewer.project; // Project | null
  viewer.views; // View[]
  viewer.currentViewIndex; // number
  viewer.currentView; // View | null
  viewer.currentProducts; // Product[]
  viewer.totalViews; // number
  viewer.showFinalMessage; // boolean

  // Flags de navegación
  viewer.hasNextView; // boolean
  viewer.hasPreviousView; // boolean

  // Métodos
  viewer.handleNextView();
  viewer.handlePreviousView();
  viewer.handleBackToDashboard();
}
```

## 📋 Lógica de Tipo de Vista

```typescript
const viewType = products.length === 1 ? "RUTA" : "COMPARATIVO";
```

### RUTA

- **Condición:** Solo 1 producto en la vista
- **Layout:** Grid de 1 columna
- **Tamaño:** Visor ocupa todo el ancho disponible
- **Uso:** Mostrar un producto desde diferentes ángulos

### COMPARATIVO

- **Condición:** 2 o más productos en la vista
- **Layout:** Grid responsivo
  - 2 productos: 2 columnas
  - 3 productos: 3 columnas
  - 4+ productos: 2 columnas en móvil, 4 en desktop
- **Uso:** Comparar diferentes variantes o modelos

## 🎯 Integración con Dashboard

### useDashboard.ts

```typescript
const handlePlay = (projectId: string) => {
  console.log("Play project:", projectId);
  navigation.navigateToPlay(projectId);
};
```

### useProjectNavigation.ts

```typescript
const navigateToPlay = (projectId: string) => {
  // Abre el visualizador en una nueva pestaña
  window.open(`/project/${projectId}`, "_blank");
};
```

## 📊 Carga de Datos

### 1. Cargar Proyecto

```typescript
const projectData = await getProjectByIdAction(projectId);
```

### 2. Cargar Vistas (ordenadas)

```typescript
const viewsData = await getViewsByProjectIdAction(projectId);
const sortedViews = [...viewsData].sort((a, b) => {
  return parseInt(a.idx) - parseInt(b.idx);
});
```

### 3. Cargar Productos por Vista

```typescript
const products = await getProductsByViewIdAction(currentView.view_id);
```

## 🎨 Estilos y Diseño

### Tema Oscuro

- Fondo principal: `bg-gray-900`
- Header/Footer: `bg-gray-800`
- Tarjetas de productos: `bg-white`

### Dimensiones

- Altura de visor: `500px`
- Padding general: `p-8`
- Gap entre productos: `gap-6`

### Botones

- **Salir:** `bg-gray-600 hover:bg-gray-700`
- **Anterior:** `bg-gray-600 hover:bg-gray-700`
- **Siguiente/Finalizar:** `bg-blue-600 hover:bg-blue-700`

## 🔍 Consideraciones

### Manejo de Errores

- ❌ Proyecto no encontrado
- ❌ Sin vistas configuradas
- ❌ Sin productos en vista

### Estados de Carga

- ⏳ Cargando proyecto inicial
- ⏳ Cargando productos por vista (transparente)

### Navegación

- Primera vista: Solo botón "Siguiente"
- Vistas intermedias: "Anterior" y "Siguiente"
- Última vista: "Anterior" y "Finalizar"
- Mensaje final: Solo "Volver al Dashboard"

## 📝 Mensaje Final

El mensaje final se obtiene de `project.final_message` y se muestra:

- ✅ Al hacer click en "Finalizar" en la última vista
- ✅ Con formato `whitespace-pre-wrap` para respetar saltos de línea
- ✅ Con botón para volver al dashboard

## 🚀 Próximas Mejoras Posibles

1. **Preload de imágenes** de la siguiente vista
2. **Atajos de teclado** (flechas para navegar)
3. **Fullscreen mode** para presentaciones
4. **Indicador de progreso** (barra o puntos)
5. **Compartir proyecto** con link público
6. **Modo automático** (auto-avance con timer)
7. **Anotaciones/comentarios** en vistas
8. **Zoom sincronizado** en comparativos

## ✅ Testing Checklist

- [ ] Navegar entre vistas funciona correctamente
- [ ] RUTA se muestra en 1 columna
- [ ] COMPARATIVO se muestra en grid
- [ ] Mensaje final aparece al terminar
- [ ] Botón "Salir" vuelve al dashboard
- [ ] Vistas se ordenan correctamente por idx
- [ ] Productos se cargan para cada vista
- [ ] Manejo de errores funciona
- [ ] Estados de carga se muestran
- [ ] Diseño responsivo en móvil

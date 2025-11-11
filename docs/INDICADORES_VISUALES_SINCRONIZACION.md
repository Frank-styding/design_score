# Feature: Indicadores Visuales de Sincronización

## Descripción

Se agregaron **indicadores visuales** para mostrar cuando los visores 3D están en modo sincronizado/bloqueado, proporcionando feedback visual claro al usuario.

## Elementos Visuales Implementados

### 1. Badge de Sincronización con Animación

Cada visor muestra un badge en la esquina superior derecha cuando está sincronizado:

```tsx
{isSynced && hasMultipleProducts && (
  <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
    {/* Pulso animado de fondo */}
    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
    
    {/* Badge principal */}
    <div className="relative bg-blue-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
      <svg><!-- Icono de candado --></svg>
      <span>Sincronizado</span>
    </div>
  </div>
)}
```

**Características**:
- 🔵 Color azul que indica estado activo
- 📍 Posicionado en esquina superior derecha
- 🔒 Icono de candado para indicar bloqueo
- 💫 Animación de pulso en el fondo (`animate-ping`)
- ✨ Sombra para destacar del contenido

### 2. Borde Resaltado con Ring

Los contenedores de cada visor tienen un borde azul cuando están sincronizados:

```tsx
<div
  className={`relative w-full h-full flex items-center justify-center rounded-lg overflow-hidden transition-all duration-300 ${
    isSynced && hasMultipleProducts
      ? "ring-2 ring-blue-500 ring-offset-2 shadow-lg"
      : ""
  }`}
>
```

**Características**:
- 🔷 Ring azul de 2px alrededor del visor
- 📏 Offset de 2px para separación del contenido
- 🌟 Sombra adicional para efecto de profundidad
- 🎬 Transición suave de 300ms al activar/desactivar

## Comportamiento

### Condiciones de Activación

Los indicadores se muestran **solo cuando**:
1. `isSynced === true` (sincronización está activa)
2. `hasMultipleProducts === true` (hay múltiples productos en vista)

### Estados Visuales

#### Estado: Sincronización Desactivada
```
┌─────────────────┐  ┌─────────────────┐
│                 │  │                 │
│   Visor 3D      │  │   Visor 3D      │
│                 │  │                 │
└─────────────────┘  └─────────────────┘
```
- Sin bordes especiales
- Sin badges

#### Estado: Sincronización Activada
```
╔═════════════════╗  ╔═════════════════╗
║  [🔒 Sincronizado]║  [🔒 Sincronizado]║
║   Visor 3D      ║  ║   Visor 3D      ║
║                 ║  ║                 ║
╚═════════════════╝  ╚═════════════════╝
```
- Borde azul (ring-2 ring-blue-500)
- Badge "Sincronizado" en esquina superior derecha
- Pulso animado en el badge
- Sombra elevada

## Colores y Estilos

### Paleta de Colores
- **Badge fondo**: `bg-blue-500` (#3B82F6)
- **Badge pulso**: `bg-blue-400` (#60A5FA)
- **Borde**: `ring-blue-500` (#3B82F6)
- **Texto**: `text-white` (blanco)

### Animaciones
- **Pulso**: `animate-ping` - Animación de Tailwind CSS que hace crecer y desvanecer el elemento
- **Transición**: `transition-all duration-300` - Transición suave de 300ms para todos los cambios

### Espaciado
- **Posición del badge**: `top-3 right-3` (12px desde arriba y derecha)
- **Padding del badge**: `px-3 py-1.5` (12px horizontal, 6px vertical)
- **Ring offset**: `ring-offset-2` (8px de separación)

## Iconografía

Se utiliza el icono de **candado** de Heroicons:

```tsx
<svg
  xmlns="http://www.w3.org/2000/svg"
  className="h-4 w-4"
  viewBox="0 0 20 20"
  fill="currentColor"
>
  <path
    fillRule="evenodd"
    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
    clipRule="evenodd"
  />
</svg>
```

**Significado**: El candado cerrado representa que los visores están "bloqueados" juntos y se moverán de forma sincronizada.

## UX/UI Consideraciones

### Ventajas del Diseño

1. **Feedback Inmediato**: El usuario ve instantáneamente cuando la sincronización está activa
2. **No Intrusivo**: Los indicadores no obstruyen la vista del modelo 3D
3. **Consistencia Visual**: Todos los visores muestran el mismo indicador
4. **Animación Sutil**: El pulso llama la atención sin ser molesto
5. **Accesibilidad**: Iconografía clara + texto descriptivo

### Responsive

Los indicadores son responsive y funcionan en diferentes tamaños de grid:
- 1 columna (móvil)
- 2 columnas (tablet)
- 3 columnas (desktop)
- 4 columnas (pantallas grandes)

### Z-Index

El badge tiene `z-10` para asegurar que siempre esté visible sobre el contenido del iframe.

## Testing Visual

### Casos de Prueba

1. **Activar sincronización**: Verificar que aparezcan badges y bordes en todos los visores
2. **Desactivar sincronización**: Verificar que desaparezcan los indicadores con transición suave
3. **Un solo producto**: Verificar que NO aparezcan indicadores (no tiene sentido sincronizar uno solo)
4. **Cambio de vista**: Verificar que los indicadores se reseteen correctamente
5. **Animación de pulso**: Verificar que el pulso sea suave y no distraiga

### Checklist Visual

- [ ] Badge visible en esquina superior derecha
- [ ] Icono de candado renderizado correctamente
- [ ] Texto "Sincronizado" legible
- [ ] Animación de pulso funcionando
- [ ] Borde azul alrededor del visor
- [ ] Transiciones suaves al activar/desactivar
- [ ] No hay solapamiento con controles del visor
- [ ] Funciona en diferentes tamaños de pantalla

## Código Modificado

### Archivo: `src/components/OptimizedViewerPool.tsx`

#### Contenedor del Visor
```tsx
<div
  className={`relative w-full h-full flex items-center justify-center rounded-lg overflow-hidden transition-all duration-300 ${
    isSynced && hasMultipleProducts
      ? "ring-2 ring-blue-500 ring-offset-2 shadow-lg"
      : ""
  }`}
>
```

#### Badge de Sincronización
```tsx
{isSynced && hasMultipleProducts && (
  <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
    <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-75"></div>
    <div className="relative bg-blue-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
      <svg><!-- Icono de candado --></svg>
      <span>Sincronizado</span>
    </div>
  </div>
)}
```

## Mejoras Futuras (Opcional)

### Posibles Extensiones

1. **Contador de visores**: Mostrar "2/2 sincronizados"
2. **Indicador de actividad**: Mostrar cuando se está rotando
3. **Colores personalizables**: Permitir cambiar el tema del indicador
4. **Tooltips**: Agregar tooltips con información adicional
5. **Sonido**: Feedback auditivo al activar/desactivar (opcional)
6. **Indicador de líder**: Mostrar cuál visor está "guiando" la rotación

## Logs de Funcionamiento

Cuando la sincronización está activa, verás en consola:

```
🔘 [SYNC-TOGGLE] Usuario cambió sincronización: {anterior: false, nuevo: true}
✅ [SYNC] Habilitando sincronización en 2 iframes...
  ➡️ Habilitando en: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
  ➡️ Habilitando en: 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6
```

Y visualmente verás:
- ✅ Badges "Sincronizado" aparecer en todos los visores
- ✅ Bordes azules alrededor de cada visor
- ✅ Animación de pulso en los badges

## Archivos Modificados

- `src/components/OptimizedViewerPool.tsx`:
  - Agregado badge de sincronización con icono y animación
  - Agregado ring/borde condicional a contenedores
  - Transiciones CSS para efectos suaves

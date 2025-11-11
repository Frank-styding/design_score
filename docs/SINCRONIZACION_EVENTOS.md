# Sincronización de Movimientos mediante Captura Global de Mouse

## 📋 Resumen

Implementación de sincronización de movimientos entre múltiples modelos 3D KeyShotXR capturando eventos de mouse **desde el contenedor padre** y replicándolos en todos los iframes simultáneamente.

## 🎯 Concepto Mejorado

En lugar de capturar eventos dentro de cada iframe, esta implementación captura el mouse **directamente desde el contenedor React** que contiene todos los modelos. Cuando el usuario arrastra el mouse sobre el grid, los eventos se replican en **todos los iframes** como si un solo cursor estuviera moviendo todos los modelos al mismo tiempo.

## 🔧 Implementación

### 1. **Componentes Modificados**

#### `OptimizedViewerPool.tsx`
- ✅ Captura eventos de mouse desde el contenedor principal (`containerRef`)
- ✅ Mantiene referencias a todos los iframes (`iframesRef`)
- ✅ Replica eventos mousedown/mousemove/mouseup en todos los iframes simultáneamente
- ✅ Calcula coordenadas relativas para cada iframe
- ✅ Toggle visual: cambia cursor a `grab` cuando está sincronizado

#### `KeyShotXRViewer.tsx`
- ✅ Acepta props: `viewerId`, `onIframeReady`
- ✅ **NO captura eventos** - solo recibe eventos replicados
- ✅ Código simplificado - sin lógica de sincronización

#### `SyncToggle.tsx`
- ✅ Botón flotante para activar/desactivar sincronización
- ✅ Muestra estado visual: 🔗 Sincronizado / 🔓 Independiente

## 🔄 Flujo de Sincronización Simplificado

```
1. Usuario activa sincronización (click en toggle)
   ↓
2. Cursor cambia a 'grab' sobre el grid
   ↓
3. Usuario hace mousedown sobre cualquier parte del grid
   ↓
4. React captura el evento en containerRef
   ↓
5. Para CADA iframe:
   - Calcula posición relativa del mouse dentro del iframe
   - Encuentra elemento en esa posición (elementFromPoint)
   - Crea MouseEvent con coordenadas ajustadas
   - Despacha evento: targetElement.dispatchEvent(mouseEvent)
   ↓
6. KeyShotXR en cada iframe procesa el evento como si fuera real
   ↓
7. ✅ Todos los modelos rotan sincronizados con UN SOLO movimiento
```

## 🚀 Ventajas de esta Técnica

### ✅ **1. Extrema Simplicidad**
- Captura en UN SOLO LUGAR (contenedor React)
- NO requiere modificar código dentro de iframes
- NO necesita postMessage entre iframes
- Código más limpio y mantenible

### ✅ **2. Precisión Total**
- Replica exactamente el movimiento del usuario
- Mantiene proporciones y física de rotación
- Sin lag ni desincronización

### ✅ **3. Performance Superior**
- Sin overhead de postMessage
- Sin polling ni timers
- Solo procesa durante drag activo (mousedown → mouseup)

### ✅ **4. UX Mejorada**
- Cursor visual 'grab' indica modo sincronizado
- Usuario puede arrastrar desde cualquier parte del grid
- No importa sobre cuál modelo está el cursor

### ✅ **5. Sin Loops Infinitos**
- NO hay riesgo de eventos recursivos
- Flujo unidireccional: React → iframes
- Sin necesidad de flags isReplicating

## 📝 Código Clave

### Captura Global de Mouse (React)
```typescript
const container = containerRef.current;
let isDragging = false;

const handleMouseDown = (e: MouseEvent) => {
  isDragging = true;
  replicateEventInIframes('mousedown', e);
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isDragging) return;
  replicateEventInIframes('mousemove', e);
};

const handleMouseUp = (e: MouseEvent) => {
  if (isDragging) {
    replicateEventInIframes('mouseup', e);
    isDragging = false;
  }
};

container.addEventListener('mousedown', handleMouseDown);
container.addEventListener('mousemove', handleMouseMove);
container.addEventListener('mouseup', handleMouseUp);
window.addEventListener('mouseup', handleMouseUp); // Para capturar fuera
```

### Replicación con Cálculo de Coordenadas
```typescript
const replicateEventInIframes = (eventType: string, e: MouseEvent) => {
  iframesRef.current.forEach((iframe) => {
    const iframeDoc = iframe.contentDocument;
    const iframeRect = iframe.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    // Posición relativa del mouse en el contenedor
    const relativeX = e.clientX - containerRect.left;
    const relativeY = e.clientY - containerRect.top;
    
    // Mapear a posición dentro del iframe
    const iframeX = relativeX - (iframeRect.left - containerRect.left);
    const iframeY = relativeY - (iframeRect.top - containerRect.top);

    // Encontrar elemento y despachar evento
    const targetElement = iframeDoc.elementFromPoint(iframeX, iframeY);
    const mouseEvent = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      clientX: iframeX,
      clientY: iframeY,
    });
    
    targetElement.dispatchEvent(mouseEvent);
  });
};
```

## 🎮 Uso

1. **Abrir proyecto con múltiples productos** (vista comparativa 2-4 modelos)
2. **Hacer clic en "🔓 Independiente"** (esquina superior derecha)
3. El botón cambia a **"🔗 Sincronizado"**
4. El cursor sobre el grid cambia a **'grab'**
5. **Arrastrar el mouse sobre cualquier parte del grid**
6. ✅ **¡Todos los modelos rotan juntos como si fueran uno!**

## � Diferencia Clave vs Versión Anterior

### ❌ **Anterior** (Captura en cada iframe)
```
Iframe A captura evento → postMessage → React
    ↓
React recibe → replica en Iframes B, C, D
    ↓
Necesita prevenir loops con flags
```

### ✅ **Nueva** (Captura en contenedor padre)
```
React captura evento en contenedor
    ↓
React replica directamente en TODOS los iframes
    ↓
Sin postMessage, sin loops, más simple
```

## 🎯 Ventaja Conceptual

**Es como si el cursor del mouse estuviera en TODOS los modelos al mismo tiempo**, no como si un modelo "enviara" su movimiento a los otros.

## 📊 Comparación Técnica

| Aspecto | Captura en Iframe | Captura Global |
|---------|------------------|----------------|
| **Complejidad** | Media (postMessage) | Muy Baja |
| **Código** | ~60 líneas | ~40 líneas |
| **Performance** | Buena | Excelente |
| **Latencia** | Mínima (1 hop) | Ninguna |
| **Risk de Loops** | Medio | Cero |
| **Mantenibilidad** | Media | Alta |
| **Extensibilidad** | Media | Alta |

## 🔍 Debug

Logs en consola:
```
🔗 [SYNC] Sistema de sincronización activado - capturando desde contenedor
🔓 [SYNC] Sistema de sincronización desactivado
```

## 🚀 Próximos Pasos (Fácilmente Extensibles)

1. **Sincronizar Zoom**: Capturar eventos `wheel` del contenedor
2. **Touch Support**: Agregar `touchstart`, `touchmove`, `touchend`
3. **Momentum**: Aplicar velocidad de arrastre a todos los modelos
4. **Visual Feedback**: Overlay semi-transparente cuando está sincronizado
5. **Keyboard Controls**: Sincronizar flechas del teclado

## ✅ Ventaja Principal

**SIMPLICIDAD EXTREMA**: Todo el código de sincronización está en UN SOLO lugar (OptimizedViewerPool) y es muy fácil de entender, mantener y extender.

## 🎯 Resultado

Sistema de sincronización **ultra simple y ultra eficiente** que permite comparar múltiples productos rotándolos todos con un solo movimiento de mouse, sin complejidad técnica innecesaria.

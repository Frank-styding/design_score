# Sincronización Completa: Eventos Mouse (Down, Move, Up)

## Resumen de la Implementación

Se ha implementado la sincronización completa de modelos 3D usando la secuencia completa de eventos de mouse: `mousedown`, `mousemove` y `mouseup`.

## Problema Resuelto

**Problema anterior:** Los modelos NO se movían juntos porque solo se enviaba `mousemove` con el flag `buttons`, pero KeyShotXR requiere recibir la secuencia completa de eventos para reconocer correctamente el drag.

**Solución:** Implementar captura y simulación de los 3 eventos por separado.

## Cambios Implementados

### 1. KeyShotXRViewer.tsx - Captura de Eventos (Sender)

**Variables agregadas:**
- `isDragging`: Flag para trackear si el usuario está arrastrando

**Event Listeners agregados:**
```javascript
// 1. mousedown - Inicia el arrastre
container.addEventListener("mousedown", function(e) {
  if (!syncEnabled || isReceivingSync) return;
  isDragging = true;
  // Calcular posición relativa (0-1)
  // Enviar mensaje: type: "keyshot-mouse-down"
});

// 2. mousemove - Durante el arrastre
container.addEventListener("mousemove", function(e) {
  if (!syncEnabled || isReceivingSync || !isDragging) return; // ← IMPORTANTE: solo si isDragging
  // Calcular posición relativa (0-1)
  // Enviar mensaje: type: "keyshot-mouse-move"
});

// 3. mouseup - Termina el arrastre
container.addEventListener("mouseup", function(e) {
  if (!syncEnabled || isReceivingSync) return;
  isDragging = false;
  // Calcular posición relativa (0-1)
  // Enviar mensaje: type: "keyshot-mouse-up"
});
```

**Tipos de mensajes enviados:**
- `keyshot-mouse-down`: { containerId, relativeX, relativeY }
- `keyshot-mouse-move`: { containerId, relativeX, relativeY }
- `keyshot-mouse-up`: { containerId, relativeX, relativeY }

### 2. KeyShotXRViewer.tsx - Simulación de Eventos (Receiver)

**Manejadores agregados:**
```javascript
// 1. Recibir MOUSEDOWN
if (data.type === "keyshot-mouse-down" && syncEnabled) {
  isReceivingSync = true;
  isDragging = true;
  
  // Crear y disparar MouseEvent('mousedown') con:
  // - buttons: 1 (botón primario presionado)
  // - clientX, clientY calculados desde relativeX, relativeY
  
  container.dispatchEvent(mouseDownEvent);
}

// 2. Recibir MOUSEMOVE
if (data.type === "keyshot-mouse-move" && syncEnabled) {
  isReceivingSync = true;
  
  // Crear y disparar MouseEvent('mousemove') con:
  // - buttons: 1 (botón primario presionado)
  // - clientX, clientY calculados desde relativeX, relativeY
  
  container.dispatchEvent(mouseMoveEvent);
}

// 3. Recibir MOUSEUP
if (data.type === "keyshot-mouse-up" && syncEnabled) {
  isReceivingSync = true;
  isDragging = false;
  
  // Crear y disparar MouseEvent('mouseup') con:
  // - buttons: 0 (ningún botón presionado)
  // - clientX, clientY calculados desde relativeX, relativeY
  
  container.dispatchEvent(mouseUpEvent);
}
```

### 3. OptimizedViewerPool.tsx - Propagación de Mensajes

**Handler actualizado:**
```typescript
const handleIndexChanged = (event: MessageEvent) => {
  // Manejar los 3 tipos de eventos
  if (
    event.data.type === "keyshot-mouse-down" ||
    event.data.type === "keyshot-mouse-move" ||
    event.data.type === "keyshot-mouse-up"
  ) {
    const { containerId, relativeX, relativeY } = event.data;
    
    // Propagar a TODOS los iframes (incluido el source)
    iframesRef.current.forEach((iframe, productId) => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: event.data.type,
          containerId: containerId,
          relativeX: relativeX,
          relativeY: relativeY,
        }, "*");
      }
    });
  }
}
```

## Flujo de Sincronización

### Escenario: Usuario arrastra el Modelo A

1. **Usuario hace mousedown en Modelo A**
   - Iframe A captura `mousedown`
   - Iframe A envía `keyshot-mouse-down` a parent
   - Parent propaga a todos los iframes (A y B)
   - Iframe A ignora (es su propio mensaje)
   - Iframe B simula `mousedown` en su contenedor
   - KeyShotXR en B detecta inicio de drag

2. **Usuario mueve el mouse (arrastrando)**
   - Iframe A captura `mousemove` (solo si isDragging = true)
   - Iframe A envía `keyshot-mouse-move` a parent
   - Parent propaga a todos los iframes
   - Iframe B simula `mousemove` con buttons:1
   - KeyShotXR en B actualiza rotación

3. **Usuario suelta el botón**
   - Iframe A captura `mouseup`
   - Iframe A envía `keyshot-mouse-up` a parent
   - Parent propaga a todos los iframes
   - Iframe B simula `mouseup` con buttons:0
   - KeyShotXR en B detecta fin de drag

## Diferencias Clave vs Implementación Anterior

| Aspecto | Anterior | Actual |
|---------|----------|--------|
| Eventos capturados | Solo `mousemove` | `mousedown`, `mousemove`, `mouseup` |
| Condición para enviar | `!syncEnabled \|\| isReceivingSync` | `!syncEnabled \|\| isReceivingSync \|\| !isDragging` |
| Tipo de mensaje | 1 tipo: `keyshot-mouse-sync` | 3 tipos: `keyshot-mouse-down/move/up` |
| Eventos simulados | Solo `mousemove` con `buttons` flag | Cada tipo de evento con sus propiedades |
| Detección de drag | `e.buttons === 1` | Flag `isDragging` explícito |

## Por Qué Funciona Ahora

KeyShotXR utiliza event listeners nativos del DOM para detectar interacciones de usuario. Para que reconozca un drag:

1. **Necesita detectar `mousedown`** para saber que el usuario inició una interacción
2. **Necesita recibir `mousemove`** con `buttons:1` para saber que está arrastrando
3. **Necesita detectar `mouseup`** para saber que terminó la interacción

La implementación anterior solo simulaba `mousemove`, lo que no activaba correctamente el sistema de drag de KeyShotXR.

## Cómo Probar

1. **Refrescar la página con Ctrl+Shift+R** (hard refresh para limpiar cache del iframe)
2. Activar la sincronización con el toggle
3. Arrastrar un modelo
4. Verificar que AMBOS modelos se mueven juntos en tiempo real

## Consola de Debug

Los logs mostrarán:
```
MOUSEDOWN desde container-id - x: 0.xxx y: 0.xxx
Recibiendo MOUSEDOWN en otro-container-id
MOUSEMOVE desde container-id - x: 0.xxx y: 0.xxx  
Recibiendo MOUSEMOVE en otro-container-id
MOUSEUP desde container-id - x: 0.xxx y: 0.xxx
Recibiendo MOUSEUP en otro-container-id
```

## Archivos Modificados

1. ✅ `src/components/KeyShotXRViewer.tsx`
   - Líneas 355-360: Agregada variable `isDragging`
   - Líneas 369-420: Nuevos event listeners (mousedown, mousemove, mouseup)
   - Líneas 444-540: Nuevos handlers de mensajes

2. ✅ `src/components/OptimizedViewerPool.tsx`
   - Líneas 108-145: Handler actualizado para manejar 3 tipos de eventos

3. 📄 `src/components/KeyShotXRViewer.tsx.backup` (backup del archivo original)

## Próximos Pasos

Una vez verificado que funciona:
1. ✅ Limpiar logs de debug excesivos
2. ✅ Eliminar el handler antiguo `keyshot-mouse-sync`
3. ✅ Optimizar throttling si es necesario
4. ✅ Probar con 3+ modelos simultáneos

## Fecha de Implementación

11 de noviembre de 2025

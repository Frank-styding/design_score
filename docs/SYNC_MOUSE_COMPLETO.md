# Sincronización Completa por Eventos de Mouse

## Problema Actual
- Solo se captura `mousemove` sin distinguir si el usuario está arrastrando
- KeyShotXR necesita que el mouse esté presionado (dragging) para rotar

## Solución
Capturar los eventos `mousedown`, `mousemove` y `mouseup` por separado y simularlos en el iframe receptor.

## Código para KeyShotXRViewer.tsx

Reemplazar la sección de eventos de mouse (líneas 355-400 aproximadamente) con:

```javascript
// 🔄 SINCRONIZACIÓN: Variables de estado
var syncEnabled = false;
var lastSentX = -1;
var lastSentY = -1;
var isReceivingSync = false;
var isDragging = false;

// Sobrescribir el método de carga completa
var originalRaMethod = keyshotXR.Ra;
keyshotXR.Ra = function() {
  originalRaMethod.call(keyshotXR);
  
  var container = document.getElementById("${cfg.nameOfDiv}");
  if (container) {
    // MOUSEDOWN
    container.addEventListener("mousedown", function(e) {
      isDragging = true;
      if (syncEnabled && !isReceivingSync) {
        var rect = container.getBoundingClientRect();
        var relativeX = (e.clientX - rect.left) / rect.width;
        var relativeY = (e.clientY - rect.top) / rect.height;
        
        console.log("[IFRAME] MouseDown en ${cfg.nameOfDiv}");
        
        window.parent.postMessage({
          type: "keyshot-mouse-event",
          containerId: "${cfg.nameOfDiv}",
          eventType: "mousedown",
          relativeX: relativeX,
          relativeY: relativeY
        }, "*");
      }
    });
    
    // MOUSEUP
    container.addEventListener("mouseup", function(e) {
      isDragging = false;
      if (syncEnabled && !isReceivingSync) {
        console.log("[IFRAME] MouseUp en ${cfg.nameOfDiv}");
        
        window.parent.postMessage({
          type: "keyshot-mouse-event",
          containerId: "${cfg.nameOfDiv}",
          eventType: "mouseup"
        }, "*");
      }
    });
    
    // MOUSEMOVE (solo cuando está dragging)
    container.addEventListener("mousemove", function(e) {
      if (!syncEnabled || isReceivingSync || !isDragging) return;
      
      var rect = container.getBoundingClientRect();
      var relativeX = (e.clientX - rect.left) / rect.width;
      var relativeY = (e.clientY - rect.top) / rect.height;
      
      if (Math.abs(relativeX - lastSentX) > 0.005 || Math.abs(relativeY - lastSentY) > 0.005) {
        lastSentX = relativeX;
        lastSentY = relativeY;
        
        console.log("[IFRAME] Enviando posición desde ${cfg.nameOfDiv} - x:", relativeX.toFixed(3), "y:", relativeY.toFixed(3));
        
        window.parent.postMessage({
          type: "keyshot-mouse-event",
          containerId: "${cfg.nameOfDiv}",
          eventType: "mousemove",
          relativeX: relativeX,
          relativeY: relativeY
        }, "*");
      }
    });
    
    console.log("[IFRAME] Sistema de sincronización por mouse configurado para:", "${cfg.nameOfDiv}");
  }
  
  window.parent.postMessage({
    type: 'keyshot-loaded',
    containerId: '${cfg.nameOfDiv}'
  }, '*');
};
```

## Listener para recibir eventos (reemplazar también en KeyShotXRViewer.tsx):

```javascript
window.addEventListener("message", function(event) {
  var data = event.data;
  
  if (data.type === "keyshot-sync-enable") {
    syncEnabled = data.enabled;
    console.log("[IFRAME] Sincronización " + (syncEnabled ? "habilitada" : "deshabilitada") + " en: ${cfg.nameOfDiv}");
  }
  
  if (data.type === "keyshot-mouse-event" && syncEnabled) {
    if (data.containerId === "${cfg.nameOfDiv}") return;
    
    isReceivingSync = true;
    
    var container = document.getElementById("${cfg.nameOfDiv}");
    if (container) {
      var rect = container.getBoundingClientRect();
      var absoluteX = rect.left + (data.relativeX * rect.width);
      var absoluteY = rect.top + (data.relativeY * rect.height);
      
      var eventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: absoluteX,
        clientY: absoluteY,
        pageX: absoluteX + window.pageXOffset,
        pageY: absoluteY + window.pageYOffset,
        buttons: data.eventType === "mousemove" ? 1 : 0
      };
      
      var mouseEvent = new MouseEvent(data.eventType, eventInit);
      container.dispatchEvent(mouseEvent);
      
      console.log("[IFRAME] Evento", data.eventType, "simulado en ${cfg.nameOfDiv}");
    }
    
    setTimeout(function() {
      isReceivingSync = false;
    }, 50);
  }
});
```

## Actualizar OptimizedViewerPool.tsx:

Cambiar `keyshot-mouse-sync` por `keyshot-mouse-event` en el listener (línea 118 aprox):

```typescript
if (event.data.type === "keyshot-mouse-event") {
  const { containerId, eventType, relativeX, relativeY } = event.data;
  
  console.log("[SYNC] Evento de mouse:", eventType, "en:", containerId);
  
  iframesRef.current.forEach((iframe, productId) => {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: "keyshot-mouse-event",
        containerId: containerId,
        eventType: eventType,
        relativeX: relativeX,
        relativeY: relativeY
      }, "*");
    }
  });
}
```

## Cómo aplicar:
1. Abrir KeyShotXRViewer.tsx
2. Buscar la sección con `var syncEnabled = false;` (línea ~355)
3. Reemplazar todo el bloque hasta `}, '*');` después de `keyshotXR.Ra`
4. Aplicar los mismos cambios al listener de mensajes
5. Actualizar OptimizedViewerPool.tsx para escuchar `keyshot-mouse-event`
6. Guardar y hacer Ctrl+Shift+R

El nuevo flujo:
1. Usuario hace mousedown en modelo A → envía evento mousedown
2. Modelo B recibe mousedown y lo simula → activa modo arrastre en KeyShotXR
3. Usuario mueve mouse (mousemove) → envía posiciones mientras arrastra
4. Modelo B recibe mousemove y rota en sync
5. Usuario suelta mouse (mouseup) → envía evento mouseup
6. Modelo B recibe mouseup y desactiva arrastre

# Debug de Sincronización de Modelos

## Cómo Probar

### 1. Abrir un proyecto con múltiples modelos
   - Ir a una vista con 2 o más productos

### 2. Verificar que aparece el toggle
   - Debe aparecer un botón "Sincronizar modelos" en la esquina superior derecha

### 3. Activar la sincronización
   - Click en el toggle
   - El texto debe cambiar a "Modelos sincronizados"
   - El toggle debe estar en negro

### 4. Abrir DevTools Console
   - F12 → Console
   - Limpiar consola (Ctrl+L)

### 5. Activar el toggle y verificar logs:

```
🔄 Actualizando estado de sync en iframe: { viewerId: "...", isSynced: true }
📬 Iframe solicita estado de sync, enviando: true
🔄 Estado de sync actualizado: true
```

### 6. Arrastrar uno de los modelos
   - Deberías ver:

```
🔄 Rotación detectada: { viewerId: "...", deltaU: 1, deltaV: 0, currentU: 18, currentV: 0 }
📤 Propagando rotación desde ...
🔗 Propagando sincronización desde ...
📡 Sincronizando a otros viewers: { currentU: 18, currentV: 0 }
📨 Enviando a ...
📥 Recibiendo sincronización: { ... }
```

### 7. Verificar resultado visual
   - Todos los modelos deben rotar al mismo tiempo
   - La rotación debe ser suave y sin lag

## Estado Actual

Se ha implementado un sistema completo de sincronización de rotación entre múltiples modelos KeyShotXR.

### Arquitectura

```
Usuario arrastra Modelo A
    ↓
KeyShotXR detecta cambio en índices (f, c)
    ↓
requestAnimationFrame monitorea continuamente
    ↓
Detecta cambio → postMessage('keyshot-rotation-change')
    ↓
KeyShotXRViewer.useEffect escucha
    ↓
Guarda _lastRotation en iframe
    ↓
Llama onRotationChange(deltaU, deltaV, viewerId)
    ↓
OptimizedViewerPool.handleRotationChange
    ↓
Obtiene _lastRotation del iframe fuente
    ↓
Envía postMessage('sync-rotation') a cada iframe target
    ↓
Iframes reciben y actualizan keyshotXR.f y keyshotXR.c
    ↓
keyshotXR.Ba() fuerza actualización de imagen
```

## Logs de Consola

### Cuando se activa la sincronización:

```
🔄 Sincronización inicializada: { viewerId: "...", enabled: true }
🔄 Estado de sync actualizado: true
```

### Cuando se arrastra un modelo:

```
🔄 Rotación detectada: { viewerId: "...", deltaU: 1, deltaV: 0, currentU: 18, currentV: 0 }
📤 Propagando rotación desde ... { deltaU: 1, deltaV: 0, ... }
🔗 Propagando sincronización desde ... { deltaU: 1, deltaV: 0 }
📡 Sincronizando a otros viewers: { currentU: 18, currentV: 0 }
📨 Enviando a ...
📥 Recibiendo sincronización: { type: "sync-rotation", ... }
```

## Puntos de Verificación

### 1. ¿Se detectan rotaciones?
Buscar en consola: `🔄 Rotación detectada`
- Si NO aparece: KeyShotXR no está cambiando `f` o `c`
- Solución: Verificar nombres de propiedades en KeyShotXR.js

### 2. ¿Se propagan eventos?
Buscar: `📤 Propagando rotación`
- Si NO aparece: El event listener de window.message no está funcionando
- Verificar que viewerId coincida

### 3. ¿Se guardan rotaciones?
En OptimizedViewerPool, verificar:
```javascript
console.log('Rotación guardada:', (sourceIframe as any)?._lastRotation);
```
- Si es `undefined`: El iframe no se está guardando correctamente

### 4. ¿Se envían a otros iframes?
Buscar: `📨 Enviando a ...`
- Debe aparecer N-1 veces (todos excepto el fuente)

### 5. ¿Se reciben en iframes?
Buscar: `📥 Recibiendo sincronización`
- Debe aparecer en los iframes destino

## Problemas Comunes

### Problema: No se detectan rotaciones

**Causa:** KeyShotXR usa propiedades diferentes en versión minificada

**Solución:** Inspeccionar el objeto keyshotXR en consola:
```javascript
// En DevTools, dentro del iframe:
console.log(window.keyshotXR);
// Buscar propiedades que cambien al arrastrar
```

Propiedades candidatas:
- `f`, `c` (columna, fila)
- `currentCol`, `currentRow`
- `Da`, `Ea` (en versiones antiguas)

### Problema: Se detectan pero no se aplican

**Causa:** El método de actualización no existe o tiene otro nombre

**Solución:** Probar diferentes métodos:
```javascript
keyshotXR.Ba();  // Actual
keyshotXR.update();
keyshotXR.render();
keyshotXR.draw();
```

### Problema: Lag o saltos

**Causa:** requestAnimationFrame se ejecuta muchas veces

**Solución:** Agregar throttle:
```javascript
var lastEmit = 0;
var throttleDelay = 16; // ~60fps

if (Date.now() - lastEmit > throttleDelay) {
  // Enviar postMessage
  lastEmit = Date.now();
}
```

## Comandos de Debug en DevTools

### Ver estado de sincronización:
```javascript
// En consola del navegador (no iframe)
document.querySelectorAll('iframe').forEach((iframe, i) => {
  console.log(`Iframe ${i}:`, iframe._lastRotation);
});
```

### Forzar sincronización manual:
```javascript
// Dentro de un iframe
window.parent.postMessage({
  type: 'keyshot-rotation-change',
  viewerId: 'VIEWER_ID_AQUI',
  deltaU: 1,
  deltaV: 0,
  currentU: 20,
  currentV: 0
}, '*');
```

### Ver propiedades de KeyShotXR:
```javascript
// Dentro del iframe
Object.keys(window.keyshotXR).filter(k => 
  typeof window.keyshotXR[k] === 'number'
);
```

## Próximos Pasos si No Funciona

1. **Verificar nombres de propiedades:**
   - Abrir DevTools → Ir a iframe → Consola
   - Ejecutar: `console.log(Object.keys(window.keyshotXR))`
   - Buscar propiedades relacionadas a índices/columnas/filas

2. **Simplificar el test:**
   - Crear un botón que llame directamente a `handleRotationChange`
   - Verificar que la propagación funciona sin depender de detección

3. **Inspeccionar KeyShotXR.js:**
   - Buscar la función que maneja `mousemove`
   - Identificar qué variables se actualizan durante el drag

4. **Hook alternativo:**
   - Si KeyShotXR no expone las propiedades, interceptar eventos DOM antes que lleguen al iframe
   - Requiere calcular manualmente los índices según el movimiento del mouse


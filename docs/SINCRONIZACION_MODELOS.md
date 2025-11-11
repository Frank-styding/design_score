# Sincronización de Modelos 3D

## Implementación

### Componentes Modificados

#### 1. SyncToggle.tsx
- Botón de alternancia (toggle) para activar/desactivar sincronización
- Se muestra solo cuando hay múltiples productos
- Estilo: negro/blanco con indicador visual cuando está activo
- Ubicación: esquina superior derecha (fixed)

#### 2. OptimizedViewerPool.tsx
- Integra el `SyncToggle` component
- Gestiona el estado `isSynced` (boolean)
- Mantiene referencias a todos los contenedores de viewers mediante `viewersRef`
- Escucha mensajes `postMessage` del tipo `keyshot-rotation`
- Propaga eventos de rotación a todos los demás iframes (excepto el que originó el evento)

### Cómo Funciona

#### Arquitectura de Sincronización

```
Usuario arrastra en Modelo A
     ↓
Iframe A captura mouse event
     ↓
postMessage({ type: 'keyshot-rotation', deltaX, deltaY, viewerId })
     ↓
OptimizedViewerPool.useEffect escucha
     ↓
Propaga a Iframe B, C, D... (excepto A)
     ↓
Cada iframe recibe: { type: 'keyshot-sync-rotation', deltaX, deltaY }
     ↓
Modelos B, C, D rotan sincronizados con A
```

### Limitación Actual

KeyShotXR.js no expone eventos de rotación nativamente. La implementación actual en `OptimizedViewerPool` tiene la infraestructura lista pero requiere:

1. **Modificar KeyShotXR.js** para emitir eventos de rotación:
   ```javascript
   // Dentro del método que maneja mouse/touch move
   window.parent.postMessage({
     type: 'keyshot-rotation',
     deltaX: dx,
     deltaY: dy,
     viewerId: this.nameOfDiv
   }, '*');
   ```

2. **O implementar captura de eventos en el contenedor del iframe** y replicarlos
   - Más complejo porque los eventos de mouse están dentro del iframe
   - Requeriría usar `pointer-events: none` y manejar eventos en el padre

### Solución Recomendada

La forma más limpia es modificar `KeyShotXR.js` una vez para todos los proyectos:

**Archivo:** `public/js/KeyShotXR.js`

Buscar el método que maneja `mousemove` o `touchmove` (probablemente algo como `onMouseMove` o similar) y agregar:

```javascript
// Después de calcular deltaX y deltaY
if (window.parent !== window) {
  window.parent.postMessage({
    type: 'keyshot-rotation',
    deltaX: deltaX,
    deltaY: deltaY,
    viewerId: this.divId || this.nameOfDiv
  }, '*');
}
```

Y también agregar un listener para recibir sincronización:

```javascript
// Al inicio del script, fuera de la clase
window.addEventListener('message', function(event) {
  if (event.data.type === 'keyshot-sync-rotation' && window.keyshotXRInstance) {
    // Aplicar la rotación programáticamente
    window.keyshotXRInstance.rotate(event.data.deltaX, event.data.deltaY);
  }
});
```

### Estado Actual

✅ UI de toggle creado y funcionando
✅ Estado de sincronización gestionado
✅ Infraestructura de postMessage preparada
✅ Referencias a iframes configuradas
⚠️ Pendiente: Modificar KeyShotXR.js para emitir/recibir eventos

### Próximos Pasos

1. Inspeccionar `public/js/KeyShotXR.js` para encontrar métodos de rotación
2. Agregar emisión de eventos `postMessage` en rotación
3. Agregar listener para eventos de sincronización entrantes
4. Probar con 2-4 modelos simultáneos
5. Ajustar sensibilidad si es necesario

### Alternativa Sin Modificar KeyShotXR.js

Si no queremos modificar la biblioteca:

1. Crear un overlay transparent sobre cada iframe
2. Capturar eventos mouse/touch en el overlay
3. Enviar eventos sintéticos a todos los iframes
4. Requiere deshabilitar `pointer-events` en iframes cuando sync está activo
5. Más complejo pero mantiene KeyShotXR.js intacto

## Testing

### Casos de Prueba

1. **Un solo modelo:** Toggle NO debe aparecer
2. **Dos modelos:** Toggle visible, al activar ambos rotan juntos
3. **Tres+ modelos:** Todos siguen al que se está arrastrando
4. **Desactivar sync:** Cada modelo vuelve a rotar independientemente
5. **Cambio de vista:** Sync se mantiene activo entre vistas
6. **Zoom durante sync:** Zoom NO debe sincronizarse (solo rotación)


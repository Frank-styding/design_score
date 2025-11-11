# Sincronización Deshabilitada - Análisis del Problema

## Por Qué Se Deshabilitó

La funcionalidad de sincronización de modelos ha sido temporalmente deshabilitada debido a problemas críticos de rendimiento y arquitectura.

## Problemas Identificados

### 1. **Recreación de Iframes al Cambiar de Vista**

**Problema:**
```typescript
const viewerId = `${productId}-${currentViewIndex}`; // ❌ Cambia en cada vista
```

Cada vez que el usuario cambiaba de vista, el `viewerId` cambiaba, causando que React destruyera y recreara todos los componentes KeyShotXRViewer y sus iframes internos.

**Impacto:**
- Lag de 500-800ms al cambiar de vista
- Pérdida del estado de zoom/rotación
- Re-descarga de todas las imágenes

**Intento de solución:**
```typescript
const viewerId = `viewer-${productId}`; // ✅ Constante por producto
```

Pero esto no fue suficiente porque el `baseUrl` y `config` cambian en cada vista, y el useEffect de KeyShotXRViewer detecta el cambio y recrea el iframe.

### 2. **Arquitectura Incompatible con KeyShotXR**

KeyShotXR se carga en un iframe aislado con sus propias variables y estado interno. Los intentos de sincronización tenían estos problemas:

#### Intento 1: postMessage bidireccional
```javascript
// Iframe detecta cambio → envía mensaje → React propaga → Otros iframes aplican
// ❌ Problema: KeyShotXR no expone índices de rotación consistentemente
// ❌ Problema: Propiedades varían entre versiones (f/c vs currentCol/currentRow)
```

#### Intento 2: requestAnimationFrame continuo
```javascript
// Monitorear keyshotXR.f y keyshotXR.c cada frame
// ❌ Problema: 60fps constantes incluso sin sync activo
// ❌ Problema: Consume 5-15% CPU en reposo
```

#### Intento 3: Eventos DOM capturados
```javascript
// Capturar mousedown/mousemove en contenedor padre
// ❌ Problema: Eventos están dentro del iframe, no en el padre
// ❌ Problema: No se pueden simular eventos de mouse cross-iframe
```

### 3. **KeyShotXR.js Minificado**

El archivo `KeyShotXR.js` está minificado y ofuscado:
- Variables tienen nombres como `f`, `c`, `Ba`, `Ra`
- No hay API pública para controlar rotación programáticamente
- No emite eventos personalizados

## Soluciones Intentadas (Fallidas)

| Intento | Enfoque | Por Qué Falló |
|---------|---------|---------------|
| 1 | Monitoreo con RAF en iframe | Alto consumo de CPU, propiedades inconsistentes |
| 2 | postMessage con índices U/V | KeyShotXR no expone índices de forma confiable |
| 3 | Eventos DOM en contenedor | Eventos atrapados dentro del iframe |
| 4 | Simular eventos sintéticos | Cross-origin y sandboxing lo impiden |
| 5 | Modificar KeyShotXR.js | Archivo minificado, difícil mantener |

## Solución Correcta (Futura)

Para implementar sincronización correctamente se necesita:

### Opción A: Modificar KeyShotXR.js (Recomendado)

1. **Desminificar** el archivo KeyShotXR.js
2. **Agregar API pública** para controlar rotación:
   ```javascript
   keyshotXR.setRotation(columnIndex, rowIndex);
   keyshotXR.onRotationChange(callback);
   ```
3. **Emitir eventos** cuando cambie la rotación
4. **Mantener versión modificada** en el proyecto

**Ventajas:**
- Control total sobre el comportamiento
- Sin overhead de monitoreo
- Eventos nativos y eficientes

**Desventajas:**
- Requiere conocimiento del código KeyShotXR
- Mantenimiento si se actualiza la biblioteca

### Opción B: Viewer Alternativo

1. **Reemplazar KeyShotXR** con una biblioteca más moderna:
   - three.js con PointerLockControls
   - babylon.js
   - pannellum (para 360°)

2. **Implementar sincronización nativa** desde el diseño

**Ventajas:**
- Control total
- Mejor rendimiento
- Más funcionalidades (VR, AR, etc.)

**Desventajas:**
- Requiere reimplementar todo
- Posible incompatibilidad con assets existentes

### Opción C: WebWorker + SharedArrayBuffer

1. **Usar Web Worker** para monitoreo
2. **SharedArrayBuffer** para comunicación sin postMessage
3. **Interceptar eventos** a nivel de window

**Ventajas:**
- Sin bloquear el thread principal
- Comunicación más rápida

**Desventajas:**
- Requiere headers CORS especiales
- Complejidad alta
- No funciona en todos los navegadores

## Estado Actual

- ✅ **Zoom funciona** (0.5x - 2.0x)
- ✅ **Precarga funciona** (sin delay entre vistas)
- ✅ **Tamaños normalizados** en comparaciones
- ❌ **Sincronización deshabilitada** (toggle comentado)
- ✅ **Rendimiento optimizado** (sin RAF innecesarios)

## Cómo Reactivar (Para Testing)

Si quieres probar la sincronización pese a los problemas:

1. Descomentar en `OptimizedViewerPool.tsx`:
```typescript
{hasMultipleProducts && (
  <SyncToggle isSynced={isSynced} onToggle={setIsSynced} />
)}
```

2. Aceptar los problemas:
- Lag al cambiar de vista
- Posible desincronización
- Alto uso de CPU

## Recomendación

**Opción A** (Modificar KeyShotXR.js) es la más viable:

1. Descargar versión no-minificada de KeyShotXR
2. Agregar hooks en los métodos de rotación
3. Emitir eventos `window.dispatchEvent(new CustomEvent('keyshotRotate', { detail: {...} }))`
4. Escuchar estos eventos en React
5. Propagar a otros viewers

Esto requiere ~2-4 horas de trabajo pero sería una solución permanente y performante.


# Fix Crítico: Sincronización de Visores No Funcionaba

## Problema Reportado

Después de implementar los indicadores visuales de sincronización, se descubrió que **la sincronización no estaba funcionando**. Solo se movía un modelo al rotar, en lugar de mover ambos modelos sincronizados.

## Causa Raíz

El código de sincronización tenía **dos piezas implementadas** pero **faltaba la tercera pieza crítica**:

### ✅ Implementado Correctamente
1. **OptimizedViewerPool** - Enviaba mensajes `postMessage` a los iframes
2. **OptimizedViewerPool** - Escuchaba mensajes de cambios de índices

### ❌ FALTABA
3. **KeyShotXRViewer (iframe)** - **NO tenía listener de mensajes** para recibir y procesar las instrucciones de sincronización

## El Flujo Completo (Antes vs Después)

### ❌ Antes (Roto)
```
OptimizedViewerPool                    Iframe 1                Iframe 2
      |                                   |                       |
      |--[keyshot-sync-enable]---------->| ❌ No hace nada      |
      |--[keyshot-sync-enable]---------------------------------->| ❌ No hace nada
      |                                   |                       |
Usuario rota Iframe 1                    |                       |
      |<--[keyshot-index-changed]--------|                       |
      |                                   |                       |
      |--[keyshot-sync-indices]------------------------------>  | ❌ No hace nada
      |                                   |                       |
                                          ✅ Rota                 ❌ NO rota
```

**Resultado**: Solo un visor rota, el otro se queda estático.

### ✅ Después (Funcionando)
```
OptimizedViewerPool                    Iframe 1                Iframe 2
      |                                   |                       |
      |--[keyshot-sync-enable]---------->| ✅ syncEnabled=true  |
      |--[keyshot-sync-enable]---------------------------------->| ✅ syncEnabled=true
      |                                   |                       |
Usuario rota Iframe 1                    |                       |
      |<--[keyshot-index-changed]--------| (envia u=10, v=2)    |
      |                                   |                       |
      |--[keyshot-sync-indices]--------------------------------->| ✅ keyshotXR.o(10,2)
      |                                   |                       |
                                          ✅ Rota                ✅ Rota SINCRONIZADO
```

**Resultado**: Ambos visores rotan juntos sincronizadamente.

## Solución Implementada

Se agregó el código de sincronización **dentro del iframe HTML** generado por `KeyShotXRViewer`:

### 1. Variables de Estado de Sincronización

```javascript
var syncEnabled = false;
var lastSentU = -1;
var lastSentV = -1;
```

### 2. Listener de Mensajes

```javascript
window.addEventListener("message", function(event) {
  var data = event.data;
  
  // Habilitar/deshabilitar sincronización
  if (data.type === "keyshot-sync-enable") {
    syncEnabled = data.enabled;
  }
  
  // Recibir índices sincronizados
  if (data.type === "keyshot-sync-indices" && syncEnabled) {
    if (data.containerId === containerId) return; // Evitar loop
    
    var uIndex = data.uIndex;
    var vIndex = data.vIndex;
    
    // Actualizar los índices del visor
    keyshotXR.o(uIndex, vIndex);
    lastSentU = uIndex;
    lastSentV = vIndex;
  }
});
```

### 3. Interceptar Cambios de Índices

```javascript
var originalOMethod = keyshotXR.o;
keyshotXR.o = function(uIndex, vIndex) {
  // Llamar al método original
  originalOMethod.call(keyshotXR, uIndex, vIndex);
  
  // Si sincronización activa y los índices cambiaron, propagar
  if (syncEnabled && (uIndex !== lastSentU || vIndex !== lastSentV)) {
    lastSentU = uIndex;
    lastSentV = vIndex;
    
    window.parent.postMessage({
      type: "keyshot-index-changed",
      containerId: containerId,
      uIndex: uIndex,
      vIndex: vIndex
    }, "*");
  }
};
```

## Detalles Técnicos

### Método `keyshotXR.o(uIndex, vIndex)`

Este es el método interno de KeyShotXR que:
- Actualiza los índices de rotación del modelo 3D
- Se llama cuando el usuario arrastra/rota el modelo
- Acepta dos parámetros: índice horizontal (u) e índice vertical (v)

### Prevención de Loops Infinitos

Se implementan dos mecanismos para evitar loops:

1. **Ignorar mensajes del mismo contenedor**:
   ```javascript
   if (data.containerId === containerId) return;
   ```

2. **Trackear últimos índices enviados**:
   ```javascript
   if (uIndex !== lastSentU || vIndex !== lastSentV)
   ```

### Flujo de Mensajes

1. **Usuario activa toggle** → OptimizedViewerPool envía `keyshot-sync-enable` a todos los iframes
2. **Cada iframe** → Actualiza su variable `syncEnabled = true`
3. **Usuario rota un modelo** → Iframe intercepta el cambio en `keyshotXR.o()`
4. **Iframe envía** → `keyshot-index-changed` al padre (OptimizedViewerPool)
5. **OptimizedViewerPool** → Reenvía `keyshot-sync-indices` a TODOS los iframes
6. **Cada iframe** → Llama a `keyshotXR.o(uIndex, vIndex)` para actualizar su rotación
7. **Resultado** → Todos los modelos rotan sincronizados

## Testing

### Caso de Prueba 1: Activar Sincronización
1. Abrir proyecto con 2 productos en vista comparativa
2. Activar toggle de sincronización
3. **Verificar logs**:
   ```
   🔄 [IFRAME] Sincronización habilitada en: producto-1
   🔄 [IFRAME] Sincronización habilitada en: producto-2
   ```

### Caso de Prueba 2: Rotar un Modelo
1. Con sincronización activa
2. Rotar el primer modelo
3. **Verificar**: El segundo modelo rota al mismo tiempo
4. **Verificar logs**:
   ```
   📥 [IFRAME] Recibiendo índices en producto-2: u: 10 v: 2 desde: producto-1
   ```

### Caso de Prueba 3: Desactivar Sincronización
1. Desactivar toggle
2. Rotar un modelo
3. **Verificar**: El otro modelo NO rota
4. **Verificar logs**:
   ```
   🔄 [IFRAME] Sincronización deshabilitada en: producto-1
   🔄 [IFRAME] Sincronización deshabilitada en: producto-2
   ```

## Logs Esperados

### Al activar sincronización:
```
🔘 [SYNC-TOGGLE] Usuario cambió sincronización: {anterior: false, nuevo: true}
✅ [SYNC] Habilitando sincronización en 2 iframes...
🔄 [IFRAME] Sincronización habilitada en: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
🔄 [IFRAME] Sincronización habilitada en: 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6
```

### Al rotar un modelo:
```
📥 [IFRAME] Recibiendo índices en 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6: u: 15 v: 2 desde: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
```

## Archivos Modificados

- `src/components/KeyShotXRViewer.tsx`:
  - Agregado listener `window.addEventListener("message")` dentro del iframe
  - Agregadas variables de estado `syncEnabled`, `lastSentU`, `lastSentV`
  - Interceptado método `keyshotXR.o()` para detectar cambios
  - Implementada lógica de propagación de índices

## Lecciones Aprendidas

1. **Comunicación bidireccional**: No basta con enviar mensajes, hay que escucharlos en el destino
2. **Debugging por capas**: Verificar cada capa de la comunicación (padre → iframe → KeyShotXR)
3. **Prevención de loops**: Siempre implementar guards para evitar bucles infinitos en sincronización
4. **Testing incremental**: Probar cada pieza de la comunicación por separado

## Estado Final

✅ **Sincronización funcional**: Ambos modelos rotan juntos  
✅ **Indicadores visuales**: Badges y bordes muestran estado  
✅ **Prevención de loops**: No hay bucles infinitos  
✅ **Logs completos**: Fácil de debuggear  
✅ **Toggle funcional**: Activar/desactivar sincronización  

🎉 **La sincronización ahora funciona completamente!**

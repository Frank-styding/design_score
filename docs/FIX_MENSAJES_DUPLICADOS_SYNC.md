# Fix: Mensajes Duplicados en Sincronización

## Problema Identificado

Se estaban enviando mensajes `keyshot-sync-enable` duplicados múltiples veces a los iframes cuando el usuario activaba la sincronización:

```
OptimizedViewerPool.tsx:91     📤 Enviando mensaje keyshot-sync-enable a: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
OptimizedViewerPool.tsx:91     📤 Enviando mensaje keyshot-sync-enable a: 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6
OptimizedViewerPool.tsx:91     📤 Enviando mensaje keyshot-sync-enable a: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
OptimizedViewerPool.tsx:91     📤 Enviando mensaje keyshot-sync-enable a: 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6
OptimizedViewerPool.tsx:91     📤 Enviando mensaje keyshot-sync-enable a: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
OptimizedViewerPool.tsx:91     📤 Enviando mensaje keyshot-sync-enable a: 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6
```

## Causa Raíz

Había **dos `useEffect` separados** que respondían al cambio de `isSynced`:

1. **Primer useEffect (líneas 32-45)**: Enviaba mensajes cuando `isSynced` cambiaba
2. **Segundo useEffect (líneas 48-113)**: También enviaba mensajes cuando `isSynced` cambiaba, y además:
   - Enviaba el mensaje inmediatamente
   - Reenviaba con `setTimeout` a 100ms, 500ms y 1000ms
   - Total: **4 envíos por iframe por useEffect**

**Resultado**: 5+ envíos duplicados del mismo mensaje a cada iframe.

## Solución Implementada

### 1. Consolidación de useEffects

Se eliminó el primer useEffect duplicado y se consolidó toda la lógica en un solo useEffect.

### 2. Reducción de Reintentos

Se redujo el número de reintentos de 4 (inmediato + 3 timeouts) a solo 2:
- Envío inmediato
- Un solo reintento después de 500ms

### 3. Limpieza de Timeouts

Se agregó `clearTimeout` en el cleanup del useEffect para evitar envíos de mensajes después de que el componente se desmonte o el estado cambie.

### 4. Función Centralizada

Se creó una función `sendSyncState(enabled)` que centraliza el envío de mensajes a todos los iframes, evitando duplicación de código.

## Cambios en el Código

**Antes**:
```tsx
// useEffect #1 - Enviaba mensajes
useEffect(() => {
  iframesRef.current.forEach((iframe) => {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: "keyshot-sync-enable",
        enabled: isSynced,
      }, "*");
    }
  });
}, [isSynced]);

// useEffect #2 - También enviaba mensajes (4 veces cada uno)
useEffect(() => {
  // ... lógica de sincronización con múltiples envíos
  sendEnableMessage();
  setTimeout(sendEnableMessage, 100);
  setTimeout(sendEnableMessage, 500);
  setTimeout(sendEnableMessage, 1000);
}, [isSynced, hasMultipleProducts]);
```

**Después**:
```tsx
// Un solo useEffect consolidado
useEffect(() => {
  const sendSyncState = (enabled: boolean) => {
    // Función centralizada para enviar mensajes
    iframesRef.current.forEach((iframe, productId) => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: "keyshot-sync-enable",
          enabled: enabled,
        }, "*");
      }
    });
  };

  if (!isSynced || !hasMultipleProducts) {
    sendSyncState(false);
    return;
  }

  // Envío único inmediato
  sendSyncState(true);

  // Solo un reintento después de 500ms
  const retryTimeout = setTimeout(() => {
    sendSyncState(true);
  }, 500);

  // Cleanup
  return () => {
    clearTimeout(retryTimeout);
    // ... resto del cleanup
  };
}, [isSynced, hasMultipleProducts]);
```

## Beneficios

1. **Reducción de mensajes**: De 5+ envíos a solo 2 (inicial + 1 reintento)
2. **Código más limpio**: Lógica consolidada en un solo lugar
3. **Mejor rendimiento**: Menos postMessage calls y menos timeouts activos
4. **Más mantenible**: Función centralizada `sendSyncState` reutilizable
5. **Limpieza apropiada**: Timeouts se limpian correctamente en el cleanup
6. **Sincronización reactiva**: Se ejecuta automáticamente cuando los iframes se registran

## Mejora Adicional: Timing de Sincronización

Se identificó un problema secundario donde el useEffect se ejecutaba antes de que los iframes estuvieran registrados, resultando en:

```
🔧 [SYNC] iframes registrados: []
❌ [SYNC] Deshabilitando sincronización en 0 iframes...
```

### Solución

1. **Estado `iframesReady`**: Contador que se incrementa/decrementa cuando se registran/eliminan iframes
2. **Dependencia del useEffect**: Se agregó `iframesReady` a las dependencias para re-ejecutar cuando cambien los iframes
3. **Guard clauses**: Se valida que haya iframes antes de intentar enviar mensajes
4. **Logs informativos**: Mensajes claros cuando se salta la ejecución por falta de iframes

```tsx
const [iframesReady, setIframesReady] = useState(0);

// En onIframeReady
if (iframe) {
  iframesRef.current.set(product.product_id!, iframe);
  setIframesReady(prev => prev + 1); // ✨ Trigger useEffect
} else {
  iframesRef.current.delete(product.product_id!);
  setIframesReady(prev => prev - 1); // ✨ Trigger useEffect
}

// En useEffect
useEffect(() => {
  // Validar que haya iframes antes de enviar mensajes
  if (!hasIframes) {
    console.log("⏭️ [SYNC] Esperando a que los iframes se registren...");
    return;
  }
  // ... resto de la lógica
}, [isSynced, hasMultipleProducts, iframesReady]); // ✨ Nueva dependencia
```

## Resultado Esperado

Ahora al activar la sincronización, deberías ver en los logs:

```
🎯 [IFRAME] Registrando iframe para producto: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
📝 [IFRAME] Total de iframes registrados: 1
🎯 [IFRAME] Registrando iframe para producto: 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6
📝 [IFRAME] Total de iframes registrados: 2
🔘 [SYNC-TOGGLE] Usuario cambió sincronización: {anterior: false, nuevo: true}
✅ [SYNC] Habilitando sincronización en 2 iframes...
  ➡️ Habilitando en: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
  ➡️ Habilitando en: 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6
👂 [SYNC] Registrando listener de mensajes...
🔄 [SYNC] Reintentando habilitar sincronización...
✅ [SYNC] Habilitando sincronización en 2 iframes...
  ➡️ Habilitando en: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
  ➡️ Habilitando en: 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6
```

Solo 2 rondas de mensajes en total, en lugar de 5+. Además, los mensajes solo se envían cuando los iframes están realmente registrados.

## Testing

Para verificar el fix:
1. Abre un proyecto con múltiples productos en vista comparativa
2. Activa la sincronización con el toggle
3. Verifica en la consola que solo se envían 2 mensajes por iframe (inicial + reintento)
4. Verifica que la sincronización funciona correctamente al rotar los modelos

## Archivos Modificados

- `src/components/OptimizedViewerPool.tsx`: Consolidación de useEffects y reducción de reintentos

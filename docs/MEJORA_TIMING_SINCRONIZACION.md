# Mejora: Timing de Sincronización con Iframes

## Problema Detectado

Después de corregir los mensajes duplicados, se identificó un problema de **timing** donde el `useEffect` de sincronización se ejecutaba **antes** de que los iframes estuvieran registrados:

```
🔧 [SYNC] useEffect ejecutado - isSynced: false hasMultipleProducts: true
🔧 [SYNC] iframes registrados: []
❌ [SYNC] Deshabilitando sincronización en 0 iframes...
```

Luego, cuando los iframes se registraban, no se activaba automáticamente la sincronización si el usuario ya había habilitado el toggle.

## Causa

El `useEffect` solo tenía como dependencias `[isSynced, hasMultipleProducts]`, por lo que **no se re-ejecutaba** cuando los iframes se registraban dinámicamente después del primer render.

## Solución Implementada

### 1. Estado Reactivo para Iframes

Se agregó un estado `iframesReady` que actúa como contador y trigger para el useEffect:

```tsx
const [iframesReady, setIframesReady] = useState(0);

// Resetear al cambiar de vista
useEffect(() => {
  setIsSynced(false);
  iframesRef.current.clear();
  setIframesReady(0);
}, [currentViewIndex]);
```

### 2. Actualización en onIframeReady

Cada vez que un iframe se registra o elimina, se actualiza el contador:

```tsx
onIframeReady={(iframe) => {
  if (iframe) {
    iframesRef.current.set(product.product_id!, iframe);
    setIframesReady(prev => prev + 1); // ✨ Trigger re-render
  } else {
    iframesRef.current.delete(product.product_id!);
    setIframesReady(prev => prev - 1); // ✨ Trigger re-render
  }
}}
```

### 3. Nueva Dependencia en useEffect

Se agregó `iframesReady` a las dependencias:

```tsx
useEffect(() => {
  // ... lógica de sincronización
}, [isSynced, hasMultipleProducts, iframesReady]); // ✨ Nueva dependencia
```

### 4. Guard Clauses

Se agregaron validaciones para evitar enviar mensajes cuando no hay iframes:

```tsx
const sendSyncState = (enabled: boolean) => {
  const iframeCount = iframesRef.current.size;
  
  // No hacer nada si no hay iframes
  if (iframeCount === 0) {
    console.log(`⏭️ [SYNC] Saltando ${action.toLowerCase()} - no hay iframes registrados aún`);
    return;
  }
  
  // ... enviar mensajes
};

// Al habilitar
if (!hasIframes) {
  console.log("⏭️ [SYNC] Esperando a que los iframes se registren...");
  return;
}
```

## Beneficios

1. **Sincronización Reactiva**: El useEffect se ejecuta automáticamente cuando los iframes se registran
2. **Logs Más Limpios**: No se intenta sincronizar cuando no hay iframes disponibles
3. **UX Mejorada**: Si el usuario activa la sincronización antes de que los iframes estén listos, se aplicará automáticamente cuando estén disponibles
4. **Menos Mensajes Innecesarios**: Se evita enviar mensajes a iframes que aún no existen

## Flujo de Ejecución

### Antes
```
1. Component mounts → useEffect se ejecuta
2. iframes registrados: [] → No hace nada útil
3. Iframes se registran → useEffect NO se re-ejecuta
4. Usuario activa toggle → useEffect se ejecuta con iframes ya disponibles ✅
```

### Después
```
1. Component mounts → useEffect se ejecuta
2. iframes registrados: [] → Se salta (guard clause)
3. Primer iframe se registra → setIframesReady(1) → useEffect se re-ejecuta
4. Segundo iframe se registra → setIframesReady(2) → useEffect se re-ejecuta
5. Usuario activa toggle → useEffect se ejecuta inmediatamente ✅
6. Si toggle ya estaba activo → Sincronización se aplica automáticamente ✅
```

## Ejemplo de Logs

### Caso 1: Toggle activado después de que los iframes se registran

```
🎯 [IFRAME] Registrando iframe para producto: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
📝 [IFRAME] Total de iframes registrados: 1
🎯 [IFRAME] Registrando iframe para producto: 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6
📝 [IFRAME] Total de iframes registrados: 2
🔘 [SYNC-TOGGLE] Usuario cambió sincronización: {anterior: false, nuevo: true}
✅ [SYNC] Habilitando sincronización en 2 iframes...
  ➡️ Habilitando en: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
  ➡️ Habilitando en: 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6
```

### Caso 2: Toggle ya estaba activado antes de que los iframes se registren (edge case)

```
🔘 [SYNC-TOGGLE] Usuario cambió sincronización: {anterior: false, nuevo: true}
🔧 [SYNC] useEffect ejecutado - isSynced: true hasMultipleProducts: true hasIframes: false
⏭️ [SYNC] Esperando a que los iframes se registren...
🎯 [IFRAME] Registrando iframe para producto: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
🔧 [SYNC] useEffect ejecutado - isSynced: true hasMultipleProducts: true hasIframes: true
✅ [SYNC] Habilitando sincronización en 1 iframes...  // ✨ Se activa automáticamente!
```

## Testing

Para probar esta mejora:

1. **Test de timing normal**: Activa el toggle después de que los modelos carguen
2. **Test de timing rápido**: Activa el toggle inmediatamente después de entrar a la vista (antes de que los iframes se registren)
3. **Test de cambio de vista**: Cambia entre vistas y verifica que la sincronización se resetea correctamente

## Archivos Modificados

- `src/components/OptimizedViewerPool.tsx`:
  - Agregado estado `iframesReady`
  - Actualizado `onIframeReady` para incrementar/decrementar contador
  - Agregado `iframesReady` a dependencias del useEffect
  - Agregadas guard clauses para validar presencia de iframes

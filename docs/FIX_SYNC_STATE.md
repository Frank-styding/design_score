# Fix: Sincronización de Modelos - Estado de Sync

## Problema Detectado

Los logs mostraban:
```
🔄 Estado de sync actualizado: false
```

Esto indicaba que aunque el componente React cambiaba `isSynced` a `true`, el iframe no lo recibía correctamente.

## Cambios Realizados

### 1. KeyShotXRViewer.tsx

#### Cambio 1: Solicitar estado al cargar
```javascript
// Después de que KeyShotXR se carga completamente
window.parent.postMessage({
  type: 'request-sync-state',
  viewerId: syncViewerId
}, '*');
```

**Por qué:** El iframe se carga ANTES de que React monte el componente completamente. Necesitamos que el iframe solicite el estado inicial.

#### Cambio 2: Responder a solicitudes de estado
```javascript
else if (
  event.data.type === "request-sync-state" &&
  event.data.viewerId === viewerId
) {
  // Responder con el estado actual
  iframeRef.current.contentWindow.postMessage({
    type: "update-sync-state",
    isSynced: isSynced,
  }, "*");
}
```

**Por qué:** Cuando el iframe solicita el estado, React responde con el valor actual de `isSynced`.

#### Cambio 3: Agregar viewerId a dependencias
```javascript
useEffect(() => {
  // ...
}, [isSynced, viewerId]); // viewerId agregado
```

**Por qué:** Asegurar que el efecto se ejecute cuando cambie viewerId.

#### Cambio 4: Logs de debug
```javascript
console.log('🔄 Actualizando estado de sync en iframe:', { viewerId, isSynced });
console.log('📬 Iframe solicita estado de sync, enviando:', isSynced);
```

**Por qué:** Visibilidad del flujo de mensajes para debugging.

### 2. Flujo de Sincronización Mejorado

```
Montaje Inicial:
1. React monta KeyShotXRViewer con isSynced=false
2. Iframe se crea y carga KeyShotXR
3. KeyShotXR termina de cargar → envía 'request-sync-state'
4. React responde con isSynced actual
5. Iframe actualiza isSyncEnabled

Usuario Activa Toggle:
1. Usuario hace click en toggle
2. OptimizedViewerPool actualiza isSynced=true
3. KeyShotXRViewer recibe nuevo prop
4. useEffect detecta cambio y envía 'update-sync-state'
5. Todos los iframes actualizan isSyncEnabled=true
6. requestAnimationFrame comienza a monitorear rotaciones

Usuario Arrastra Modelo:
1. KeyShotXR cambia índices (f, c)
2. requestAnimationFrame detecta cambio
3. Iframe envía 'keyshot-rotation-change'
4. React recibe y guarda _lastRotation
5. React llama onRotationChange
6. OptimizedViewerPool propaga a otros iframes
7. Otros iframes reciben 'sync-rotation'
8. Otros iframes actualizan sus índices
9. Todos los modelos rotan sincronizados
```

## Próximos Pasos de Testing

1. **Limpiar consola** (Ctrl+L)
2. **Activar toggle** y verificar:
   ```
   🔄 Actualizando estado de sync en iframe: { viewerId: "...", isSynced: true }
   ```

3. **Arrastrar modelo** y verificar secuencia completa:
   ```
   🔄 Rotación detectada
   📤 Propagando rotación
   🔗 Propagando sincronización
   📡 Sincronizando a otros viewers
   📨 Enviando a [viewer-id]
   📥 Recibiendo sincronización
   ```

4. **Si no funciona**, verificar:
   - ¿Aparece `📬 Iframe solicita estado`? → Si NO, el iframe no se cargó bien
   - ¿Aparece `🔄 Rotación detectada`? → Si NO, KeyShotXR usa otras propiedades
   - ¿Aparece `📨 Enviando a`? → Si NO, refs no están configuradas

## Archivos Modificados

- `src/components/KeyShotXRViewer.tsx` - Sistema de sincronización bidireccional
- `src/components/OptimizedViewerPool.tsx` - Propagación de rotaciones
- `src/components/SyncToggle.tsx` - UI de toggle
- `docs/DEBUG_SINCRONIZACION.md` - Guía de debugging
- `docs/SINCRONIZACION_MODELOS.md` - Documentación técnica


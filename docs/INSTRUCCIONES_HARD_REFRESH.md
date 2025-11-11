# 🔄 Instrucciones: Recargar Completamente la Aplicación

## ⚠️ Problema

Los iframes de KeyShotXR se crearon con el código **anterior** al fix de sincronización, por lo que no tienen el listener de mensajes implementado.

## ✅ Solución: Hard Refresh

Para aplicar los cambios necesitas hacer un **hard refresh** del navegador:

### Windows/Linux
```
Ctrl + Shift + R
```
o
```
Ctrl + F5
```

### Mac
```
Cmd + Shift + R
```

## 🔍 Cómo Verificar que Funcionó

Después del hard refresh, al activar la sincronización deberías ver estos logs:

```
🔘 [SYNC-TOGGLE] Usuario cambió sincronización: {anterior: false, nuevo: true}
✅ [SYNC] Habilitando sincronización en 2 iframes...
  ➡️ Habilitando en: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
  ➡️ Habilitando en: 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6
🔄 [IFRAME] Sincronización habilitada en: d103ba5a-38aa-42e7-9cd8-8bb32b92db78  ← ✨ ESTE LOG DEBE APARECER
🔄 [IFRAME] Sincronización habilitada en: 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6  ← ✨ ESTE LOG DEBE APARECER
```

Y al rotar un modelo:

```
📥 [IFRAME] Recibiendo índices en 73efb7a2-1180-45eb-9bb6-c1e6d9b374e6: u: 15 v: 2 desde: d103ba5a-38aa-42e7-9cd8-8bb32b92db78
```

## 🎯 Pasos Completos

1. **Hard Refresh** del navegador (`Ctrl + Shift + R`)
2. Navega al proyecto con vista comparativa
3. Activa el toggle de sincronización
4. **Verifica los logs** - deben aparecer los mensajes del iframe
5. **Rota un modelo** - ambos deben moverse juntos

## 📋 Checklist

- [ ] Hice hard refresh (`Ctrl + Shift + R`)
- [ ] Los logs muestran "🔄 [IFRAME] Sincronización habilitada"
- [ ] Al rotar un modelo, el otro también rota
- [ ] Los badges "Sincronizado" aparecen en ambos visores
- [ ] Los bordes azules rodean ambos visores

## 💡 Alternativa: Cerrar y Abrir Pestaña

Si el hard refresh no funciona:

1. **Cierra completamente la pestaña** del navegador
2. **Abre una nueva pestaña**
3. Navega nuevamente a `localhost:3000`

Esto forzará la recarga completa de todos los recursos.

## 🐛 Si Aún No Funciona

Si después del hard refresh aún no funciona:

1. **Verifica que el servidor de desarrollo se haya recargado** correctamente
2. **Para el servidor** (`Ctrl + C` en la terminal)
3. **Inicia de nuevo** (`npm run dev`)
4. **Hard refresh** del navegador nuevamente

---

**Nota**: El HMR (Hot Module Reload) de Next.js no siempre actualiza el contenido de los iframes porque son documentos HTML completos embebidos. Por eso es necesario el hard refresh manual.

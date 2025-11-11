# Zoom en KeyShotXR: Cómo Funciona Realmente

## Respuesta Rápida: NO Necesitas Imágenes Adicionales ✅

**Buenas noticias:** KeyShotXR usa **zoom digital/CSS** mediante `transform: scale()`, lo que significa:

- ✅ **NO necesitas** imágenes pre-renderizadas con zoom
- ✅ **NO necesitas** múltiples conjuntos de imágenes
- ✅ El zoom funciona con las mismas imágenes que ya tienes
- ✅ Es un zoom de la imagen existente (como hacer zoom en una foto)

## Cómo Funciona Técnicamente

### Zoom Digital vs Zoom de Alta Resolución

KeyShotXR tiene dos modos de zoom:

#### 1. Zoom Digital (CSS Transform) - LO QUE TENEMOS
```javascript
// El script usa CSS transform
img.style.transform = "scale(1.5)";  // 150% zoom
```

**Ventajas:**
- ✅ Funciona con imágenes existentes
- ✅ Rápido e inmediato
- ✅ No requiere descargas adicionales

**Desventajas:**
- ⚠️ Puede verse pixelado si haces zoom muy grande
- ⚠️ La calidad depende de la resolución original

#### 2. Zoom de Alta Resolución (downloadOnInteraction) - AVANZADO
```javascript
downloadOnInteraction: true  // Descarga imágenes HD al hacer zoom
```

**Requiere:**
- Imágenes adicionales de alta resolución
- Configuración especial en KeyShot al exportar
- Estructura de carpetas específica

**No lo necesitamos** para zoom básico.

## Por Qué el Zoom Podría No Funcionar

### Causa 1: Eventos del Mouse Bloqueados

El iframe puede estar bloqueando los eventos de scroll.

**Prueba esto en la consola del navegador:**

1. Abre DevTools (F12)
2. Ve a Console
3. Pega este código:

```javascript
// Prueba si el evento wheel se dispara
document.querySelectorAll('iframe').forEach(iframe => {
  try {
    iframe.contentWindow.document.addEventListener('wheel', (e) => {
      console.log('Wheel event detectado:', e.deltaY);
    });
  } catch(e) {
    console.log('No se puede acceder al iframe:', e);
  }
});
```

Si **NO** ves mensajes al hacer scroll sobre el modelo = Los eventos están bloqueados.

### Causa 2: El Zoom Está Funcionando pero es Sutil

Con un rango de 1.0x a 1.5x, el cambio es **gradual**. Puede que el zoom esté funcionando pero el cambio sea tan pequeño que no se nota.

**Prueba:**
1. Haz scroll **muchas veces** en la misma dirección (10-15 veces)
2. Observa si el modelo cambia de tamaño aunque sea ligeramente

### Causa 3: downScaleToBrowser Interfiriendo

La opción `downScaleToBrowser` puede estar afectando el zoom.

**Solución:** Voy a deshabilitarla.

## Solución: Habilitar Zoom Forzado

Voy a hacer varios cambios para asegurar que el zoom funcione:

### 1. Deshabilitar downScaleToBrowser

Esto puede estar interfiriendo con el zoom CSS.

### 2. Ampliar el Rango de Zoom (Para Hacer el Efecto Más Obvio)

Cambiaré temporalmente a un rango más amplio para que el zoom sea más notorio:
```typescript
minZoom: 0.5  // Más obvio al alejar
maxZoom: 2.0  // Más obvio al acercar
```

### 3. Agregar Logs de Debug

Añadiré logs para ver si el zoom se está ejecutando internamente.

## Testing del Zoom

### Test Visual Rápido

Voy a crear un test para verificar si el zoom funciona:

```javascript
// Pega esto en la consola después de cargar un proyecto
setTimeout(() => {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe, i) => {
    try {
      const viewer = iframe.contentWindow.document.querySelector('[id*="KeyShot"]');
      if (viewer) {
        const img = viewer.querySelector('img');
        if (img) {
          console.log(`Modelo ${i + 1}:`, {
            transform: img.style.transform,
            width: img.width,
            height: img.height
          });
        }
      }
    } catch(e) {
      console.log('No se puede acceder al iframe', i);
    }
  });
}, 2000);
```

Esto te mostrará si hay transformaciones CSS aplicadas.

### Test Manual Mejorado

1. **Abre un proyecto**
2. **Abre DevTools → Console**
3. **Observa el modelo mientras haces scroll**
4. **Busca el mensaje:** "Wheel event detectado"
5. **Si ves el mensaje pero no hay zoom** = El evento se detecta pero no se aplica
6. **Si NO ves el mensaje** = Los eventos están bloqueados

## Tipos de Zoom en KeyShot

### Al Exportar desde KeyShot

Cuando exportas un modelo XR desde KeyShot, tienes opciones:

#### Opción 1: Single Resolution (LO QUE PROBABLEMENTE TIENES)
- Una sola resolución de imagen
- Zoom digital/CSS funciona
- Puede verse pixelado con zoom muy grande

#### Opción 2: Multi-Resolution (AVANZADO)
- Múltiples resoluciones (ej: 1024px, 2048px, 4096px)
- Descarga imágenes HD al hacer zoom
- Requiere `downloadOnInteraction: true`
- Requiere estructura especial de carpetas

**La mayoría de modelos usan Opción 1**, así que el zoom digital debería funcionar.

## Alternativas Si el Zoom No Funciona

### Alternativa 1: Usar CSS Zoom en el Contenedor

Si KeyShotXR no responde al zoom, podemos aplicar zoom CSS directamente al contenedor desde React:

```typescript
// En el componente padre
const [zoomLevel, setZoomLevel] = useState(1.0);

<div style={{ transform: `scale(${zoomLevel})` }}>
  <KeyShotXRViewer ... />
</div>

// Controles
<button onClick={() => setZoomLevel(z => Math.min(z + 0.1, 2))}>+</button>
<button onClick={() => setZoomLevel(z => Math.max(z - 0.1, 0.5))}>-</button>
```

### Alternativa 2: Zoom con Botones UI

En lugar de rueda del mouse, agregar botones de zoom visibles:

```
┌──────────────────┐
│     Modelo       │
│                  │
│  [+]  1.0x  [-] │  ← Controles de zoom
└──────────────────┘
```

### Alternativa 3: Usar Pinch-to-Zoom Nativo del Navegador

Permitir que el navegador maneje el zoom:

```css
#KeyShotXR {
  touch-action: pinch-zoom;  /* Permitir zoom touch */
}
```

## Próximos Pasos

Voy a hacer estos cambios:

1. ✅ Cambiar `downScaleToBrowser` a `false`
2. ✅ Ampliar el rango de zoom temporalmente (0.5 - 2.0)
3. ✅ Agregar logs de eventos de zoom
4. ✅ Crear un componente de prueba con botones de zoom

Esto nos ayudará a diagnosticar si:
- El zoom está habilitado pero no se nota
- Los eventos no se capturan
- Necesitamos una solución alternativa

## Estructura de Archivos KeyShot (Referencia)

### Con Zoom Digital (Lo que tienes)
```
modelo/
  ├── 0_0.png
  ├── 0_1.png
  ├── ...
  └── 4_35.png
```

### Con Multi-Resolution (No necesario)
```
modelo/
  ├── low/
  │   ├── 0_0.png  (1024px)
  │   └── ...
  ├── medium/
  │   ├── 0_0.png  (2048px)
  │   └── ...
  └── high/
      ├── 0_0.png  (4096px)
      └── ...
```

Solo necesitas la primera estructura (archivos directos) para zoom digital.

## Resumen

- ✅ **NO necesitas imágenes adicionales** para zoom básico
- ✅ KeyShotXR usa **CSS transform scale** para zoom
- ⚠️ El zoom puede no funcionar por eventos bloqueados
- 🔧 Voy a implementar mejoras para diagnosticar y solucionar

Déjame hacer los cambios ahora...

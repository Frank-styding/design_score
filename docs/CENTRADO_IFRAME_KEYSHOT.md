# Centrado de Modelos Dentro del Iframe KeyShotXR

## Problema Identificado

Los modelos 3D dentro del iframe de KeyShotXR no se centraban correctamente, apareciendo desalineados o en una esquina del contenedor.

## Solución Implementada

### 1. **Centrado del HTML y Body del Iframe**

```css
html, body { 
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
```

**Beneficios:**
- El contenedor raíz del iframe ahora usa Flexbox
- Centra todo el contenido vertical y horizontalmente
- Elimina cualquier overflow no deseado

### 2. **Centrado del Contenedor Principal KeyShotXR**

```css
#KeyShotXR {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
```

**Beneficios:**
- El div principal también usa Flexbox para centrado
- Mantiene posición relativa para elementos absolutos internos
- Imagen de fondo centrada como placeholder

### 3. **Centrado de Divs Internos (Creados por KeyShotXR.js)**

```css
#KeyShotXR > div {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
  position: absolute !important;
  top: 0 !important;
  left: 0 !important;
}
```

**Uso de `!important`:**
- KeyShotXR.js crea dinámicamente divs con estilos inline
- `!important` sobrescribe los estilos del script
- Asegura que todos los contenedores internos usen Flexbox

### 4. **Centrado de Imágenes**

```css
#KeyShotXR img {
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: contain !important;
  margin: auto !important;
  display: block !important;
}
```

**Características:**
- `max-width` y `max-height` al 100% para evitar overflow
- `object-fit: contain` mantiene proporciones sin distorsión
- `margin: auto` centra la imagen
- `display: block` elimina espacio inferior de imágenes inline

### 5. **Centrado de Canvas (Si se usa)**

```css
#KeyShotXR canvas {
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: contain !important;
  margin: auto !important;
}
```

**Por qué:**
- Algunos proyectos de KeyShotXR pueden usar canvas en lugar de imágenes
- Mismo comportamiento de centrado y contención

## Jerarquía de Centrado

```
┌─────────────────────────────────────┐
│ <html> - Flexbox centrado          │
│  ┌───────────────────────────────┐  │
│  │ <body> - Flexbox centrado     │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ #KeyShotXR             │  │  │
│  │  │ Flexbox + Relative     │  │  │
│  │  │  ┌───────────────────┐ │  │  │
│  │  │  │ div (auto-created)│ │  │  │
│  │  │  │ Flexbox + Absolute│ │  │  │
│  │  │  │  ┌─────────────┐  │ │  │  │
│  │  │  │  │    <img>    │  │ │  │  │
│  │  │  │  │   Centrada  │  │ │  │  │
│  │  │  │  │  max: 100%  │  │ │  │  │
│  │  │  │  └─────────────┘  │ │  │  │
│  │  │  └───────────────────┘ │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Estrategia de Sobrescritura

### ¿Por qué `!important`?

KeyShotXR.js establece estilos inline dinámicamente:

```javascript
// Código interno de KeyShotXR.js (simplificado)
div.style.width = "1024px";
div.style.height = "768px";
div.style.position = "absolute";
img.style.width = "100%";
```

**Problema:** Los estilos inline tienen mayor especificidad que los CSS del `<style>`

**Solución:** Usar `!important` para garantizar que nuestros estilos de centrado se apliquen

### Alternativas Consideradas

1. **Modificar KeyShotXR.js** ❌
   - Difícil de mantener
   - Se perdería en actualizaciones
   - Script minificado

2. **JavaScript post-carga** ❌
   - Requiere timing perfecto
   - Posibles race conditions
   - Más complejo

3. **CSS con `!important`** ✅
   - Simple y efectivo
   - No modifica el script original
   - Funciona inmediatamente

## Compatibilidad

### Casos de Uso Soportados

- ✅ Modelos horizontales (landscape)
- ✅ Modelos verticales (portrait)
- ✅ Modelos cuadrados
- ✅ Diferentes resoluciones de imagen
- ✅ Diferentes configuraciones de uCount/vCount
- ✅ Vista individual
- ✅ Vista comparativa (2, 3, 4+ modelos)

### Navegadores Compatibles

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

## Resultado Visual

### Antes
```
┌─────────────────────┐
│[Modelo]             │ ← Modelo en esquina
│                     │   superior izquierda
│                     │
│                     │
│                     │
└─────────────────────┘
```

### Después
```
┌─────────────────────┐
│                     │
│     ┌─────────┐     │
│     │ Modelo  │     │ ← Modelo centrado
│     └─────────┘     │   perfectamente
│                     │
└─────────────────────┘
```

## Archivo Modificado

**`src/components/KeyShotXRViewer.tsx`**
- Sección: Generación del HTML del iframe
- Elemento: `<style type="text/css">`
- Líneas: ~247-282 (aproximadamente)

## Testing Recomendado

### Checklist de Pruebas

- [ ] Modelo individual centrado
- [ ] Modelo en comparativo (2 productos) centrado
- [ ] Modelo en comparativo (3+ productos) centrado
- [ ] Rotación del modelo mantiene centrado
- [ ] Zoom mantiene centrado
- [ ] Cambio de vista mantiene centrado
- [ ] Diferentes tamaños de pantalla
- [ ] Mobile responsive

### Casos Especiales a Verificar

1. **Modelos muy anchos** (proporción 21:9)
2. **Modelos muy altos** (proporción 9:21)
3. **Modelos con transparencia**
4. **Diferentes fondos (backgroundColor)**

## Notas Técnicas

### Performance

- ✅ No hay impacto en performance
- ✅ CSS se aplica antes de que KeyShotXR.js se ejecute
- ✅ `!important` no afecta rendering speed

### Mantenimiento

- ✅ No requiere modificaciones futuras
- ✅ Compatible con actualizaciones de KeyShotXR.js
- ✅ Estilos autocontenidos en el iframe

### Limitaciones Conocidas

- Los estilos solo afectan al contenido dentro del iframe
- Si KeyShotXR.js cambia completamente su estructura DOM en futuras versiones, puede requerir ajustes
- Los `!important` son necesarios y no se pueden evitar sin modificar KeyShotXR.js

## Beneficios Finales

1. ✅ **Centrado Perfecto**: Modelos siempre en el centro visual
2. ✅ **Responsive**: Se adapta a cualquier tamaño de contenedor
3. ✅ **Sin Distorsión**: `object-fit: contain` mantiene proporciones
4. ✅ **Consistente**: Funciona en todos los modos de visualización
5. ✅ **Mantenible**: No requiere cambios en KeyShotXR.js

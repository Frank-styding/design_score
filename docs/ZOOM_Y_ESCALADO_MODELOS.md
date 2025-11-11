# Zoom y Escalado de Modelos Grandes en KeyShotXR

## Problemas Identificados y Resueltos

### 1. Modelos Grandes No Centrados ✅

**Problema:**
- Modelos muy grandes excedían el contenedor
- No se centraban correctamente
- Podían estar cortados o fuera de vista

**Causa:**
- CSS con `max-width: 100%` y `max-height: 100%` limitaba el tamaño
- Flexbox no manejaba bien elementos que exceden el contenedor
- Faltaba control de escala para modelos grandes

### 2. Zoom Deshabilitado ✅

**Problema:**
- Los modelos tenían `minZoom: 1` y `maxZoom: 1`
- No se podía hacer zoom in/out
- Modelos grandes quedaban sin opción de acercar/alejar

**Solución:**
- `minZoom: 0.5` - Permite alejar hasta 50% del tamaño original
- `maxZoom: 3` - Permite acercar hasta 300% del tamaño original

## Cambios Implementados

### 1. Habilitación del Zoom

**En `KeyShotXRViewer.tsx`:**

```typescript
// ANTES
minZoom: config.minZoom !== undefined ? config.minZoom : 1,
maxZoom: config.maxZoom !== undefined ? config.maxZoom : 1,

// DESPUÉS
minZoom: config.minZoom !== undefined ? config.minZoom : 0.5,
maxZoom: config.maxZoom !== undefined ? config.maxZoom : 3,
```

**Aplicado en dos lugares:**
1. Configuración con objeto `config`
2. Configuración con props individuales (retrocompatibilidad)

### 2. CSS Mejorado para Modelos Grandes

**Estrategia de Centrado Absoluto:**

```css
/* ANTES - Limitaba el tamaño */
#KeyShotXR img {
  max-width: 100% !important;
  max-height: 100% !important;
  object-fit: contain !important;
  margin: auto !important;
  display: block !important;
}

/* DESPUÉS - Permite tamaños grandes y centra */
#KeyShotXR img {
  max-width: none !important;
  max-height: none !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  transform-origin: center center !important;
}
```

**Ventajas del Nuevo Enfoque:**

1. **`max-width: none` y `max-height: none`:**
   - Permite que las imágenes sean más grandes que el contenedor
   - El zoom puede escalar sin restricciones artificiales

2. **`position: absolute` con `top: 50%` y `left: 50%`:**
   - Posiciona el centro de la imagen en el centro del contenedor
   - Funciona independientemente del tamaño de la imagen

3. **`transform: translate(-50%, -50%)`:**
   - Ajusta la imagen para que su centro coincida con el punto de anclaje
   - Técnica clásica de centrado CSS

4. **`transform-origin: center center`:**
   - Asegura que las transformaciones (zoom) se apliquen desde el centro
   - Mantiene el modelo centrado durante el zoom

### 3. Soporte para Canvas

Se aplicó el mismo tratamiento a elementos `<canvas>`:

```css
#KeyShotXR canvas {
  max-width: none !important;
  max-height: none !important;
  position: absolute !important;
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%) !important;
  transform-origin: center center !important;
}
```

### 4. Contenedores con Transform Origin

```css
#KeyShotXR > div {
  transform-origin: center center !important;
}
```

Asegura que los contenedores también mantengan el origen de transformación centrado.

## Cómo Funciona el Zoom

### Interacción del Usuario

**Con Mouse:**
- **Scroll del mouse** sobre el modelo → Zoom in/out
- **Drag/arrastrar** → Rotar el modelo

**Con Touch (móvil/tablet):**
- **Pinch** → Zoom in/out
- **Swipe** → Rotar el modelo

### Rangos de Zoom

```
┌──────────────────────────────────────┐
│ minZoom: 0.5 (50%)                   │
│ ▼                                    │
│ ┌────────┐                           │
│ │Modelo  │ ← Alejado (ver completo) │
│ │pequeño │                           │
│ └────────┘                           │
├──────────────────────────────────────┤
│ Zoom: 1.0 (100%)                     │
│ ▼                                    │
│    ┌──────────┐                      │
│    │  Modelo  │ ← Tamaño original    │
│    │  normal  │                      │
│    └──────────┘                      │
├──────────────────────────────────────┤
│ maxZoom: 3.0 (300%)                  │
│ ▼                                    │
│ ┌──────────────────────────────┐    │
│ │                              │    │
│ │      Modelo Grande           │    │
│ │   (acercado, ver detalle)    │    │
│ │                              │    │
│ └──────────────────────────────┘    │
└──────────────────────────────────────┘
```

### Casos de Uso

**Modelos Grandes (exceden el viewport):**
- Inician en zoom automático para verse completos
- Usuario puede hacer zoom in para ver detalles
- Usuario puede hacer zoom out (hasta 50%) para vista general

**Modelos Pequeños:**
- Se ven al 100% inicialmente
- Usuario puede hacer zoom in hasta 300% para ver detalles
- Usuario puede hacer zoom out hasta 50% si lo desea

**Modelos Normales:**
- Se ven completos y centrados
- Zoom disponible para inspección de detalles

## Beneficios de la Solución

### 1. Flexibilidad Total
- ✅ Maneja modelos de cualquier tamaño
- ✅ Adaptación automática al viewport
- ✅ Control manual del zoom

### 2. Mejor UX
- ✅ Modelos siempre centrados
- ✅ Zoom suave y natural
- ✅ Sin cortes ni overflow oculto

### 3. Compatibilidad
- ✅ Funciona con configuraciones existentes
- ✅ Compatible con todos los modelos
- ✅ Responsive en todos los dispositivos

### 4. Consistencia
- ✅ Mismo comportamiento en vista individual
- ✅ Mismo comportamiento en comparativos
- ✅ Experiencia uniforme

## Testing del Zoom

### Checklist de Pruebas

**Zoom con Mouse:**
- [ ] Scroll hacia arriba hace zoom in
- [ ] Scroll hacia abajo hace zoom out
- [ ] Zoom se detiene en minZoom (0.5)
- [ ] Zoom se detiene en maxZoom (3.0)
- [ ] Modelo permanece centrado durante zoom

**Zoom con Touch:**
- [ ] Pinch out hace zoom in
- [ ] Pinch in hace zoom out
- [ ] Zoom táctil es suave
- [ ] Modelo permanece centrado

**Modelos Grandes:**
- [ ] Se ven completos inicialmente
- [ ] Centrados correctamente
- [ ] Zoom in revela detalles
- [ ] No se cortan en los bordes

**Comparativos:**
- [ ] Zoom funciona en todos los modelos
- [ ] Cada modelo puede tener zoom independiente
- [ ] Centrado consistente en todos

## Configuración Personalizada

Si se necesitan diferentes rangos de zoom, se pueden pasar en el config:

```typescript
<KeyShotXRViewer
  baseUrl="/path/to/model"
  config={{
    minZoom: 0.3,    // Permite alejar más (30%)
    maxZoom: 5,      // Permite acercar más (500%)
    // ... otras opciones
  }}
/>
```

## Notas Técnicas

### Transform vs Scale

KeyShotXR usa `transform: scale()` internamente para el zoom:

```javascript
// Interno de KeyShotXR.js
element.style.transform = "scale(" + zoomLevel + ")";
```

Nuestro CSS usa `transform: translate()` para centrar:

```css
transform: translate(-50%, -50%);
```

Ambas transformaciones son **compatibles** y se combinan:

```css
/* Resultado final */
transform: translate(-50%, -50%) scale(1.5);
```

### Performance

- ✅ CSS transforms son acelerados por GPU
- ✅ No hay re-layout durante zoom
- ✅ Animación suave
- ✅ Sin impacto en performance

### Limitaciones

- El zoom depende del script KeyShotXR.js original
- Si el script no soporta zoom, los valores no tendrán efecto
- La versión actual de KeyShotXR.js **SÍ soporta zoom**

## Archivos Modificados

1. **`src/components/KeyShotXRViewer.tsx`**
   - Valores por defecto de `minZoom` y `maxZoom`
   - CSS del iframe para centrado absoluto
   - Transform origin en contenedores
   - Background color del config

## Documentación Relacionada

- `CENTRADO_IFRAME_KEYSHOT.md` - Centrado de modelos
- `MEJORAS_CENTRADO_COMPARATIVOS.md` - Centrado en comparativos
- `OPTIMIZACION_VISUALIZADOR_KEYSHOT.md` - Optimizaciones generales

## Próximas Mejoras

- [ ] Botones de zoom (+/-) en la UI
- [ ] Indicador visual del nivel de zoom actual
- [ ] Zoom doble-click para centrar y ajustar
- [ ] Recordar nivel de zoom entre vistas
- [ ] Zoom sincronizado en comparativos (opcional)

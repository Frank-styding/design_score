# 📝 KeyShotXR Configuration Guide

## 🎯 Configuración Completa

El componente `KeyShotXRViewer` ahora soporta **2 formas de uso**:

1. **Objeto de configuración completo** (recomendado para configuraciones avanzadas)
2. **Props individuales** (retrocompatibilidad y uso simple)

---

## 📦 Opción 1: Usando Objeto de Configuración

### Interfaz KeyShotXRConfig

```typescript
interface KeyShotXRConfig {
  nameOfDiv?: string; // ID del contenedor (default: "KeyShotXR")
  folderName: string; // URL base de las imágenes (REQUERIDO)
  viewPortWidth?: number; // Ancho del visor (default: 1024)
  viewPortHeight?: number; // Alto del visor (default: 575)
  backgroundColor?: string; // Color de fondo (default: "#000000")
  uCount?: number; // Número de columnas (default: 36)
  vCount?: number; // Número de filas (default: 5)
  uWrap?: boolean; // Wrap horizontal (default: true)
  vWrap?: boolean; // Wrap vertical (default: false)
  uMouseSensitivity?: number; // Sensibilidad mouse X (default: -0.1)
  vMouseSensitivity?: number; // Sensibilidad mouse Y (default: 0.0625)
  uStartIndex?: number; // Columna inicial (default: uCount/2)
  vStartIndex?: number; // Fila inicial (default: 0)
  minZoom?: number; // Zoom mínimo (default: 1)
  maxZoom?: number; // Zoom máximo (default: 1)
  rotationDamping?: number; // Inercia de rotación (default: 0.96)
  downScaleToBrowser?: boolean; // Escalar a navegador (default: true)
  addDownScaleGUIButton?: boolean; // Botón de escala (default: false)
  downloadOnInteraction?: boolean; // Descargar al interactuar (default: false)
  imageExtension?: string; // Extensión de imagen (default: "png")
  showLoading?: boolean; // Mostrar spinner (default: true)
  loadingIcon?: string; // Icono del spinner (default: "80X80.png")
  allowFullscreen?: boolean; // Permitir fullscreen (default: true)
  uReverse?: boolean; // Invertir dirección X (default: false)
  vReverse?: boolean; // Invertir dirección Y (default: false)
  hotspots?: Record<string, any>; // Hotspots (default: {})
  isIBooksWidget?: boolean; // Es widget iBooks (default: false)
}
```

### Ejemplo de Uso con Config

```tsx
import KeyShotXRViewer from "@/components/KeyShotXRViewer";

function ProductViewer() {
  // Configuración completa exactamente como la exporta KeyShot
  const config = {
    nameOfDiv: "KeyShotXR",
    folderName: "CMF NB Shoe Demo Scene.4063",
    viewPortWidth: 1024,
    viewPortHeight: 575,
    backgroundColor: "#000000",
    uCount: 36,
    vCount: 5,
    uWrap: true,
    vWrap: false,
    uMouseSensitivity: -0.1,
    vMouseSensitivity: 0.0625,
    uStartIndex: 18,
    vStartIndex: 0,
    minZoom: 1,
    maxZoom: 1,
    rotationDamping: 0.96,
    downScaleToBrowser: true,
    addDownScaleGUIButton: false,
    downloadOnInteraction: false,
    imageExtension: "png",
    showLoading: true,
    loadingIcon: "80X80.png",
    allowFullscreen: true,
    uReverse: false,
    vReverse: false,
    hotspots: {},
    isIBooksWidget: false,
  };

  return (
    <KeyShotXRViewer
      config={config}
      onLoad={() => console.log("Cargado!")}
      onProgress={(p) => console.log(`${p}%`)}
    />
  );
}
```

### Desde JSON (Ideal para datos desde API)

```tsx
function ProductViewerFromAPI() {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    // Cargar configuración desde API
    fetch("/api/keyshot-config")
      .then((res) => res.json())
      .then((data) => setConfig(data));
  }, []);

  if (!config) return <div>Cargando...</div>;

  return <KeyShotXRViewer config={config} />;
}
```

### Desde String JSON

```tsx
function ProductViewerFromString() {
  const configString = `{
    "nameOfDiv":"KeyShotXR",
    "folderName":"CMF NB Shoe Demo Scene.4063",
    "viewPortWidth":1024,
    "viewPortHeight":575,
    "backgroundColor":"#000000",
    "uCount":36,
    "vCount":5,
    "uWrap":true,
    "vWrap":false,
    "uMouseSensitivity":-0.1,
    "vMouseSensitivity":0.0625,
    "uStartIndex":18,
    "vStartIndex":0,
    "minZoom":1,
    "maxZoom":1,
    "rotationDamping":0.96,
    "downScaleToBrowser":true,
    "addDownScaleGUIButton":false,
    "downloadOnInteraction":false,
    "imageExtension":"png",
    "showLoading":true,
    "loadingIcon":"80X80.png",
    "allowFullscreen":true,
    "uReverse":false,
    "vReverse":false,
    "hotspots":{},
    "isIBooksWidget":false
  }`;

  const config = JSON.parse(configString);

  return <KeyShotXRViewer config={config} />;
}
```

---

## 🔧 Opción 2: Usando Props Individuales (Retrocompatibilidad)

### Interfaz Simple

```tsx
<KeyShotXRViewer
  containerId="my-viewer"
  baseUrl="https://..."
  width={1024}
  height={575}
  columns={36}
  rows={5}
  backgroundColor="#000000"
  imageExt="png"
/>
```

### Props Disponibles

| Prop              | Tipo     | Default       | Descripción          |
| ----------------- | -------- | ------------- | -------------------- |
| `containerId`     | `string` | `"KeyShotXR"` | ID del contenedor    |
| `baseUrl`         | `string` | -             | URL base de imágenes |
| `width`           | `number` | `1024`        | Ancho del visor      |
| `height`          | `number` | `575`         | Alto del visor       |
| `columns`         | `number` | `36`          | Número de columnas   |
| `rows`            | `number` | `5`           | Número de filas      |
| `backgroundColor` | `string` | `"#000000"`   | Color de fondo       |
| `imageExt`        | `string` | `"png"`       | Extensión de imagen  |

---

## 🔄 Mapeo de Props

Si usas props individuales, internamente se convierten a la configuración completa:

| Props Individuales | Config Object    |
| ------------------ | ---------------- |
| `containerId`      | `nameOfDiv`      |
| `baseUrl`          | `folderName`     |
| `width`            | `viewPortWidth`  |
| `height`           | `viewPortHeight` |
| `columns`          | `uCount`         |
| `rows`             | `vCount`         |
| `imageExt`         | `imageExtension` |

---

## 📋 Valores por Defecto

Todos los valores tienen defaults sensatos basados en la configuración estándar de KeyShot:

```typescript
{
  nameOfDiv: "KeyShotXR",
  viewPortWidth: 1024,
  viewPortHeight: 575,
  backgroundColor: "#000000",
  uCount: 36,
  vCount: 5,
  uWrap: true,
  vWrap: false,
  uMouseSensitivity: -0.1,
  vMouseSensitivity: 0.0625,
  uStartIndex: 18, // Mitad de uCount
  vStartIndex: 0,
  minZoom: 1,
  maxZoom: 1,
  rotationDamping: 0.96,
  downScaleToBrowser: true,
  addDownScaleGUIButton: false,
  downloadOnInteraction: false,
  imageExtension: "png",
  showLoading: true,
  loadingIcon: "80X80.png",
  allowFullscreen: true,
  uReverse: false,
  vReverse: false,
  hotspots: {},
  isIBooksWidget: false
}
```

---

## 🎨 Casos de Uso Avanzados

### 1. Configuración Dinámica desde Base de Datos

```tsx
function DynamicViewer({ productId }: { productId: string }) {
  const { data: config, loading } = useQuery(
    `SELECT xr_config FROM products WHERE id = $1`,
    [productId]
  );

  if (loading) return <Spinner />;

  return (
    <KeyShotXRViewer
      config={JSON.parse(config.xr_config)}
      onLoad={() => console.log("Product loaded")}
    />
  );
}
```

### 2. Override Parcial de Config

```tsx
function CustomViewer() {
  const baseConfig = {
    /* config desde DB */
  };

  // Override solo algunos valores
  const customConfig = {
    ...baseConfig,
    backgroundColor: "#FFFFFF", // Cambiar fondo
    allowFullscreen: false, // Desactivar fullscreen
  };

  return <KeyShotXRViewer config={customConfig} />;
}
```

### 3. Múltiples Configuraciones

```tsx
function ComparisonViewer() {
  const configs = [
    { nameOfDiv: "viewer-1", folderName: "product-1" /* ... */ },
    { nameOfDiv: "viewer-2", folderName: "product-2" /* ... */ },
    { nameOfDiv: "viewer-3", folderName: "product-3" /* ... */ },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {configs.map((config, i) => (
        <KeyShotXRViewer key={i} config={config} />
      ))}
    </div>
  );
}
```

### 4. Configuración con Hotspots

```tsx
function ViewerWithHotspots() {
  const config = {
    nameOfDiv: "KeyShotXR",
    folderName: "product",
    /* ... otros valores ... */
    hotspots: {
      "0_18": {
        text: "¡Haz clic aquí!",
        position: { x: 512, y: 300 },
        options: {
          fontSize: "16px",
          bgColor: "#ffffff",
          color: "#000000",
          link: "https://example.com",
        },
      },
    },
  };

  return <KeyShotXRViewer config={config} />;
}
```

---

## ⚙️ Configuraciones Comunes

### Producto Estándar (Default)

```typescript
{
  uCount: 36,
  vCount: 5,
  uMouseSensitivity: -0.1,
  vMouseSensitivity: 0.0625,
}
```

### Rotación Rápida

```typescript
{
  uCount: 36,
  vCount: 5,
  uMouseSensitivity: -0.2,  // Más sensible
  rotationDamping: 0.98,     // Más inercia
}
```

### Rotación 360° Simple

```typescript
{
  uCount: 36,
  vCount: 1,      // Solo una fila
  uWrap: true,    // Wrap completo
  vWrap: false,   // Sin wrap vertical
}
```

### Vista Vertical (Arriba/Abajo)

```typescript
{
  uCount: 1,      // Solo una columna
  vCount: 18,     // Múltiples filas
  uWrap: false,
  vWrap: true,
}
```

### Con Zoom Habilitado

```typescript
{
  minZoom: 0.5,   // Permite alejar
  maxZoom: 2,     // Permite acercar 2x
}
```

### Sin Animación/Inercia

```typescript
{
  rotationDamping: 0,  // Sin inercia
}
```

---

## 🐛 Troubleshooting

### El visor no aparece

- ✅ Verifica que `folderName` esté correcto
- ✅ Asegúrate que las imágenes existan en `folderName/{row}_{col}.{ext}`
- ✅ Usa `onError` para capturar errores

### La rotación es muy lenta/rápida

- Ajusta `uMouseSensitivity` (valores negativos invierten dirección)
- Valores típicos: `-0.05` (lento) a `-0.2` (rápido)

### nameOfDiv debe ser único

- Si tienes múltiples visores, asigna IDs únicos
- Ejemplo: `viewer-1`, `viewer-2`, etc.

### Configuración no se aplica

- Verifica que el JSON sea válido
- Usa `JSON.parse()` si viene como string
- Comprueba la consola por errores

---

## 📚 Ejemplos Completos

### Ejemplo Mínimo con Config

```tsx
<KeyShotXRViewer
  config={{
    folderName: "https://example.com/product",
  }}
/>
```

### Ejemplo Completo con Todos los Parámetros

```tsx
<KeyShotXRViewer
  config={{
    nameOfDiv: "my-product-viewer",
    folderName: "https://cdn.example.com/products/shoe-360",
    viewPortWidth: 800,
    viewPortHeight: 600,
    backgroundColor: "#F5F5F5",
    uCount: 72, // Más frames = rotación más suave
    vCount: 1, // Solo horizontal
    uWrap: true,
    vWrap: false,
    uMouseSensitivity: -0.15,
    vMouseSensitivity: 0,
    uStartIndex: 36, // Comenzar al frente
    vStartIndex: 0,
    minZoom: 0.8,
    maxZoom: 2.5,
    rotationDamping: 0.94, // Buena inercia
    imageExtension: "webp", // Usar WebP para mejor compresión
    showLoading: true,
    allowFullscreen: true,
    hotspots: {},
  }}
  onLoad={() => console.log("✅ Cargado")}
  onProgress={(p) => console.log(`Progreso: ${p}%`)}
  onError={(e) => console.error("❌ Error:", e)}
  className="rounded-lg shadow-xl"
/>
```

---

## ✅ Checklist de Migración

Si tienes código existente con props individuales:

- [ ] Decide si necesitas la configuración completa
- [ ] El código existente seguirá funcionando (retrocompatibilidad)
- [ ] Para nuevos features, considera usar `config`
- [ ] Para migrar, crea objeto config y reemplaza props
- [ ] Prueba que todo funcione correctamente

---

**Versión**: 3.0  
**Fecha**: 1 de noviembre de 2025  
**Autor**: GitHub Copilot

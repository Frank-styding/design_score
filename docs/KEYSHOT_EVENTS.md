# 📡 KeyShotXR Events - Documentación

## ✨ Nuevas Características

El componente `KeyShotXRViewer` ahora soporta **3 eventos** para monitorear el estado de carga del visor 3D:

1. **`onLoad`** - Se dispara cuando todas las imágenes se han cargado
2. **`onProgress`** - Se dispara durante la carga con el progreso (0-100%)
3. **`onError`** - Se dispara cuando hay un error

---

## 🎯 Uso Básico

### 1. onLoad - Detectar Carga Completa

```tsx
<KeyShotXRViewer
  containerId="my-viewer"
  baseUrl="https://..."
  width={500}
  height={280}
  columns={36}
  rows={5}
  onLoad={() => {
    console.log("✅ Visor completamente cargado");
    // Aquí puedes ejecutar lógica después de la carga
  }}
/>
```

**Casos de Uso**:

- Mostrar un overlay de "Cargando..." hasta que esté listo
- Iniciar una animación o tour guiado
- Habilitar controles adicionales
- Enviar analytics de tiempo de carga

---

### 2. onProgress - Monitorear Progreso

```tsx
const [progress, setProgress] = useState(0);

<KeyShotXRViewer
  containerId="my-viewer"
  baseUrl="https://..."
  width={500}
  height={280}
  columns={36}
  rows={5}
  onProgress={(progress) => {
    setProgress(progress); // 0-100
    console.log(`Cargando: ${progress}%`);
  }}
/>;

{
  /* Mostrar barra de progreso */
}
{
  progress < 100 && (
    <div className="progress-bar">
      <div style={{ width: `${progress}%` }} />
    </div>
  );
}
```

**Casos de Uso**:

- Mostrar barra de progreso
- Feedback visual durante la carga
- Estimar tiempo restante
- Preload spinner personalizado

---

### 3. onError - Manejar Errores

```tsx
<KeyShotXRViewer
  containerId="my-viewer"
  baseUrl="https://..."
  width={500}
  height={280}
  columns={36}
  rows={5}
  onError={(error) => {
    console.error("❌ Error:", error);
    // Mostrar mensaje al usuario
    alert(`No se pudo cargar el visor: ${error}`);
  }}
/>
```

**Casos de Uso**:

- Mostrar mensaje de error amigable
- Reintentar carga automáticamente
- Enviar logs de errores a analytics
- Fallback a imagen estática

---

## 🚀 Ejemplo Completo con Todos los Eventos

```tsx
"use client";
import { useState } from "react";
import KeyShotXRViewer from "@/components/KeyShotXRViewer";

export default function ProductViewer() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="relative">
      {/* Overlay de carga */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
          <div className="text-white text-lg mb-4">Cargando modelo 3D...</div>
          <div className="w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-white text-sm mt-2">{progress}%</div>
        </div>
      )}

      {/* Mensaje de error */}
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded z-20">
          ⚠️ {error}
        </div>
      )}

      {/* Visor 3D */}
      <KeyShotXRViewer
        containerId="product-viewer"
        baseUrl="https://storage.supabase.co/..."
        width={800}
        height={450}
        columns={36}
        rows={5}
        onLoad={() => {
          console.log("✅ Carga completada");
          setIsLoading(false);
          // Opcional: mostrar tutorial
        }}
        onProgress={(progress) => {
          setProgress(progress);
        }}
        onError={(error) => {
          console.error("❌ Error:", error);
          setError(error);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
```

---

## 🎨 Ejemplo con Múltiples Visores

```tsx
function MultipleViewers() {
  const [viewer1Loaded, setViewer1Loaded] = useState(false);
  const [viewer2Loaded, setViewer2Loaded] = useState(false);
  const [viewer1Progress, setViewer1Progress] = useState(0);
  const [viewer2Progress, setViewer2Progress] = useState(0);

  const allLoaded = viewer1Loaded && viewer2Loaded;

  return (
    <div>
      {!allLoaded && (
        <div className="text-center mb-4">
          <p>Visor 1: {viewer1Progress}%</p>
          <p>Visor 2: {viewer2Progress}%</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <KeyShotXRViewer
          containerId="viewer-1"
          baseUrl="..."
          onLoad={() => setViewer1Loaded(true)}
          onProgress={setViewer1Progress}
        />
        <KeyShotXRViewer
          containerId="viewer-2"
          baseUrl="..."
          onLoad={() => setViewer2Loaded(true)}
          onProgress={setViewer2Progress}
        />
      </div>

      {allLoaded && (
        <div className="text-center text-green-500 mt-4">
          ✅ Todos los modelos cargados
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 Implementación Técnica

### Cómo Funciona

Los eventos se comunican usando **`postMessage`** entre el iframe y el componente React:

1. **Dentro del iframe** (KeyShotXR.js):

   - Se sobrescriben los métodos `Sa()` (progreso) y `Ra()` (carga completa)
   - Se envían mensajes al parent window

2. **En el componente React**:
   - Se escucha el evento `message` en window
   - Se filtran mensajes por `containerId` para evitar conflictos
   - Se ejecutan los callbacks correspondientes

```typescript
// Dentro del iframe
window.parent.postMessage(
  {
    type: "keyshot-loaded",
    containerId: "viewer-1",
  },
  "*"
);

// En el componente React
window.addEventListener("message", (event) => {
  if (event.data.type === "keyshot-loaded") {
    onLoad?.();
  }
});
```

---

## 📊 Performance Tips

### 1. Evitar Re-renders Innecesarios

```tsx
const handleLoad = useCallback(() => {
  console.log("Loaded!");
}, []);

<KeyShotXRViewer onLoad={handleLoad} />;
```

### 2. Debounce del Progreso

```tsx
const [progress, setProgress] = useState(0);

const handleProgress = useMemo(
  () => debounce((p: number) => setProgress(p), 100),
  []
);

<KeyShotXRViewer onProgress={handleProgress} />;
```

### 3. Cleanup de Listeners

El componente automáticamente hace cleanup de los event listeners cuando se desmonta:

```typescript
return () => {
  window.removeEventListener("message", handleMessage);
};
```

---

## 🐛 Troubleshooting

### El evento onLoad no se dispara

**Posibles causas**:

1. Las imágenes no se están cargando correctamente
2. Error en la URL base
3. CORS bloqueando las imágenes
4. KeyShotXR.js no se cargó

**Solución**: Usa `onError` para debuggear:

```tsx
<KeyShotXRViewer
  onError={(error) => console.error(error)}
  onLoad={() => console.log("Loaded!")}
/>
```

### El progreso se queda en 0%

**Causa**: El método `Sa()` no está siendo llamado en KeyShotXR.js

**Solución**: Verifica que el script KeyShotXR.js se esté cargando correctamente

### Múltiples visores reciben los mismos eventos

**Causa**: `containerId` duplicado

**Solución**: Asegúrate de que cada visor tenga un `containerId` único:

```tsx
<KeyShotXRViewer containerId="viewer-1" />
<KeyShotXRViewer containerId="viewer-2" />
```

---

## 📚 API Reference

### Props

| Prop          | Tipo                         | Requerido | Default | Descripción                    |
| ------------- | ---------------------------- | --------- | ------- | ------------------------------ |
| `containerId` | `string`                     | ✅        | -       | ID único del contenedor        |
| `baseUrl`     | `string`                     | ✅        | -       | URL base de las imágenes       |
| `width`       | `number`                     | ❌        | `1024`  | Ancho del visor                |
| `height`      | `number`                     | ❌        | `575`   | Alto del visor                 |
| `columns`     | `number`                     | ❌        | `36`    | Número de columnas             |
| `rows`        | `number`                     | ❌        | `5`     | Número de filas                |
| `onLoad`      | `() => void`                 | ❌        | -       | Callback cuando carga completa |
| `onProgress`  | `(progress: number) => void` | ❌        | -       | Callback con progreso 0-100    |
| `onError`     | `(error: string) => void`    | ❌        | -       | Callback cuando hay error      |

### Events

#### onLoad()

- **Cuándo**: Todas las imágenes del visor se han cargado
- **Frecuencia**: Una vez por visor
- **Uso**: Ocultar spinners, habilitar features

#### onProgress(progress: number)

- **Cuándo**: Durante la carga de imágenes
- **Frecuencia**: Múltiples veces (cada imagen cargada)
- **Parámetro**: `progress` 0-100
- **Uso**: Barras de progreso, feedback visual

#### onError(error: string)

- **Cuándo**: Fallo al cargar script o imágenes
- **Frecuencia**: Solo cuando hay error
- **Parámetro**: `error` mensaje descriptivo
- **Uso**: Manejo de errores, fallbacks

---

## 🎓 Best Practices

1. **Siempre proporciona onError**: Para manejar errores gracefully
2. **Usa containerId único**: Especialmente con múltiples visores
3. **Memoiza callbacks**: Para evitar re-renders
4. **Muestra feedback visual**: Loading spinners y progress bars
5. **Cleanup automático**: Confía en el cleanup del componente

---

## ✅ Checklist de Implementación

- [ ] Importar el componente actualizado
- [ ] Agregar `onLoad` callback
- [ ] Agregar `onProgress` para feedback visual
- [ ] Agregar `onError` para manejo de errores
- [ ] Usar `containerId` único para cada visor
- [ ] Testear con diferentes conexiones (3G, 4G, WiFi)
- [ ] Verificar que los eventos se disparen correctamente
- [ ] Agregar fallback UI para errores

---

**Versión**: 2.0  
**Fecha**: 1 de noviembre de 2025  
**Autor**: GitHub Copilot

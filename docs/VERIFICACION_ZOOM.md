# Verificación y Uso del Zoom en KeyShotXR

## Estado Actual

✅ **El zoom YA ESTÁ HABILITADO** en el código con la siguiente configuración:

```typescript
minZoom: 0.5  // Permite alejar hasta 50% del tamaño
maxZoom: 3    // Permite acercar hasta 300% del tamaño
```

## Cómo Verificar que el Zoom Funciona

### 1. Abrir la Consola del Navegador

1. Presiona `F12` o `Ctrl+Shift+I` (Windows/Linux) o `Cmd+Option+I` (Mac)
2. Ve a la pestaña "Console"
3. Al cargar un proyecto, deberías ver:
   ```
   KeyShotXR config: {...}
   Zoom habilitado - minZoom: 0.5 maxZoom: 3
   ```

### 2. Probar el Zoom con Mouse

**En Desktop:**
1. Abre un proyecto con modelos 3D
2. Coloca el mouse sobre un modelo
3. **Usa la rueda del mouse (scroll wheel)**:
   - Scroll **HACIA ARRIBA** = Zoom IN (acercar)
   - Scroll **HACIA ABAJO** = Zoom OUT (alejar)

### 3. Probar el Zoom con Touch

**En Tablet/Móvil:**
1. Abre un proyecto con modelos 3D
2. Coloca dos dedos sobre un modelo
3. **Pinch gesture**:
   - **Separar dedos** = Zoom IN (acercar)
   - **Juntar dedos** = Zoom OUT (alejar)

## Si el Zoom NO Funciona

### Checklist de Debugging

#### 1. Verificar la Consola
```javascript
// Busca este mensaje en la consola:
"Zoom habilitado - minZoom: 0.5 maxZoom: 3"

// Si minZoom y maxZoom son ambos 1, el zoom está deshabilitado
```

#### 2. Verificar que los Datos del Producto tienen Configuración

Los productos deben tener un campo `constants` con la configuración de KeyShotXR. Si los productos fueron creados antes de esta actualización, sus `constants` pueden tener `minZoom: 1` y `maxZoom: 1`.

**Solución:** Re-subir los modelos o actualizar manualmente la base de datos.

#### 3. Verificar el Script KeyShotXR.js

El archivo `/public/js/KeyShotXR.js` debe existir y estar accesible.

**Verificar:**
1. Abre DevTools → Network
2. Busca `KeyShotXR.js`
3. Debe cargar con status 200

#### 4. Verificar Eventos del Mouse

Algunos navegadores o configuraciones pueden bloquear eventos de scroll.

**Prueba:**
```javascript
// En la consola del navegador, dentro del iframe:
document.addEventListener('wheel', (e) => {
  console.log('Wheel event:', e.deltaY);
});
```

### Posibles Causas y Soluciones

#### Causa 1: Productos con Configuración Antigua

**Síntoma:** Los logs muestran `minZoom: 1, maxZoom: 1`

**Solución:**
```sql
-- Actualizar productos existentes en Supabase
UPDATE products 
SET constants = jsonb_set(
  jsonb_set(constants, '{minZoom}', '0.5'),
  '{maxZoom}', '3'
)
WHERE constants->>'minZoom' = '1';
```

#### Causa 2: CSS Bloqueando Eventos

**Síntoma:** El mouse no responde sobre el modelo

**Solución:**
Verificar que no hay `pointer-events: none` en el CSS del viewer.

#### Causa 3: Iframe Sandbox

**Síntoma:** Los scripts no se ejecutan correctamente

**Solución:**
El iframe no debe tener atributo `sandbox` restrictivo.

#### Causa 4: downScaleToBrowser Interfiriendo

**Síntoma:** El zoom no responde o se comporta extraño

**Solución Temporal:**
Cambiar `downScaleToBrowser` a `false`:

```typescript
downScaleToBrowser: false
```

## Configuración Personalizada por Producto

Si quieres diferentes niveles de zoom para diferentes productos:

```typescript
// Al crear/editar un producto, en constants:
{
  "minZoom": 0.3,  // Alejar más
  "maxZoom": 5,    // Acercar más
  // ... otras configuraciones
}
```

## Comportamiento Esperado

### Zoom OUT (minZoom: 0.5)
- El modelo se ve al 50% de su tamaño
- Útil para ver modelos grandes completos
- Se detiene en 0.5x, no permite alejar más

### Zoom Normal (1.0x)
- Tamaño original del modelo
- Vista por defecto al cargar

### Zoom IN (maxZoom: 3.0)
- El modelo se ve al 300% de su tamaño
- Útil para ver detalles
- Se detiene en 3.0x, no permite acercar más

## Controles Adicionales

### Solo Rotación (sin zoom temporalmente)
Si necesitas rotar sin hacer zoom accidentalmente:
- Mantén presionado `Shift` mientras arrastras (si KeyShotXR lo soporta)

### Reset del Zoom
- No hay botón de reset por defecto
- Puedes hacer scroll hasta volver a 1.0x

## Logs de Debugging

He activado logs en la consola para facilitar el debugging:

```javascript
// Al inicializar KeyShotXR:
console.log("KeyShotXR config:", {...});
console.log("Zoom habilitado - minZoom:", 0.5, "maxZoom:", 3);

// Puedes agregar más logs si es necesario
```

## Testing Paso a Paso

### Test 1: Verificar Configuración
1. ✅ Abrir consola del navegador
2. ✅ Cargar un proyecto
3. ✅ Ver mensaje: "Zoom habilitado - minZoom: 0.5 maxZoom: 3"

### Test 2: Zoom OUT
1. ✅ Colocar mouse sobre modelo
2. ✅ Scroll down (hacia ti)
3. ✅ El modelo se hace más pequeño
4. ✅ Se detiene en 50% del tamaño

### Test 3: Zoom IN
1. ✅ Colocar mouse sobre modelo
2. ✅ Scroll up (alejándote)
3. ✅ El modelo se hace más grande
4. ✅ Se detiene en 300% del tamaño

### Test 4: Zoom + Rotación
1. ✅ Hacer zoom in
2. ✅ Arrastrar para rotar
3. ✅ El zoom se mantiene durante la rotación
4. ✅ El modelo permanece centrado

### Test 5: Comparativos
1. ✅ Abrir vista con 2+ modelos
2. ✅ Hacer zoom en modelo 1
3. ✅ Hacer zoom en modelo 2
4. ✅ Cada modelo tiene zoom independiente

## Archivo de Configuración

**Ubicación:** `src/components/KeyShotXRViewer.tsx`

**Líneas relevantes:**
- Línea ~107: `minZoom: 0.5` (con config)
- Línea ~108: `maxZoom: 3` (con config)
- Línea ~152: `minZoom: 0.5` (sin config)
- Línea ~153: `maxZoom: 3` (sin config)

## Próximos Pasos

Si el zoom está funcionando correctamente:
- [ ] Documentar el comportamiento para usuarios finales
- [ ] Considerar agregar controles UI (+/- buttons)
- [ ] Considerar agregar indicador de nivel de zoom

Si el zoom NO funciona:
- [ ] Revisar logs de consola
- [ ] Verificar configuración de productos existentes
- [ ] Probar con un producto recién subido
- [ ] Contactar soporte si persiste el problema

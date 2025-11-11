# 🧪 Guía de Testing - Mejoras Críticas de Precarga

**Fecha:** 11 de Noviembre de 2025  
**Versión:** 1.0

---

## 🎯 Objetivo

Validar que las 3 mejoras críticas funcionan correctamente:
1. ✅ Cleanup y AbortController
2. ✅ Cache API
3. ✅ Carga Paralela

---

## ⚙️ Preparación

### 1. Iniciar servidor de desarrollo
```bash
npm run dev
```

### 2. Abrir DevTools
- **Chrome/Edge:** F12 o Ctrl+Shift+I
- **Firefox:** F12
- **Safari:** Cmd+Option+I

### 3. Ir a la pestaña Console
Aquí verás los logs de precarga

---

## 🧪 Test Suite

### TEST 1: Primera Carga (Cache Miss) ⏱️

**Objetivo:** Verificar carga paralela y logs de performance

**Pasos:**
1. Abrir DevTools > Application > Storage > Cache Storage
2. **Eliminar** la caché `keyshot-models-v1` (si existe)
3. Navegar a cualquier proyecto: `/project/[id]`
4. Observar console

**Resultados esperados en console:**
```
🚀 Iniciando precarga de 20 productos...
📦 Producto A: 2500ms (45 imgs)
📦 Producto B: 2300ms (45 imgs)
📦 Producto C: 2400ms (45 imgs)
📦 Producto D: 1800ms (45 imgs)
...
✅ Precarga completada: 20/20 productos en 45.2s
```

**✅ Validaciones:**
- [ ] Logs aparecen en console
- [ ] Se cargan **45 imágenes** por producto (no 90)
- [ ] Tiempo total < 90 segundos
- [ ] Progreso visual funciona en UI

---

### TEST 2: Segunda Carga (Cache Hit) 🚀

**Objetivo:** Verificar que Cache API funciona

**Pasos:**
1. Después de completar TEST 1
2. **Recargar página** (F5 o Ctrl+R)
3. Observar console

**Resultados esperados en console:**
```
🚀 Iniciando precarga de 20 productos...
📦 Producto A: 150ms (45 imgs)
📦 Producto B: 120ms (45 imgs)
📦 Producto C: 140ms (45 imgs)
...
✅ Precarga completada: 20/20 productos en 2.8s
```

**✅ Validaciones:**
- [ ] Tiempo por producto < 200ms
- [ ] Tiempo total < 5 segundos
- [ ] Progreso muy rápido en UI

**Verificar caché:**
1. DevTools > Application > Cache Storage
2. Expandir `keyshot-models-v1`
3. Ver lista de imágenes cacheadas

**✅ Validaciones:**
- [ ] Caché contiene ~900 imágenes (20 productos × 45 imgs)
- [ ] Imágenes tienen formato: `0_0.png`, `0_1.png`, etc.

---

### TEST 3: Network Tab (Carga Paralela) 🌐

**Objetivo:** Verificar que productos se cargan en paralelo

**Pasos:**
1. Limpiar caché nuevamente
2. DevTools > Network tab
3. Recargar proyecto
4. Observar requests

**Resultados esperados:**
- Ver **múltiples requests simultáneos** (hasta 6 conexiones HTTP/1.1)
- No ver requests bloqueados esperando otros
- Ver ~900 requests en total

**✅ Validaciones:**
- [ ] Múltiples imágenes descargando simultáneamente
- [ ] No hay periodos sin actividad (gaps)
- [ ] Waterfall muestra paralelismo

**Filtrar para ver mejor:**
```
Filtro: .png
```

---

### TEST 4: Cancelación (Cleanup) 🛑

**Objetivo:** Verificar AbortController cancela descargas

**Pasos:**
1. Limpiar caché
2. Navegar a proyecto
3. **Inmediatamente** (antes de que termine precarga):
   - Click en botón "Atrás" del navegador
   - O navegar a otra ruta
4. Observar console

**Resultados esperados en console:**
```
🚀 Iniciando precarga de 20 productos...
📦 Producto A: 2500ms (45 imgs)
📦 Producto B: 2300ms (45 imgs)
🧹 Limpiando precarga - cancelando descargas...
🛑 Precarga cancelada por usuario
```

**✅ Validaciones:**
- [ ] Mensaje "🧹 Limpiando precarga..." aparece
- [ ] Mensaje "🛑 Precarga cancelada" aparece
- [ ] No hay nuevos logs después de cancelación
- [ ] Network tab muestra requests cancelados (color rojo)

---

### TEST 5: Progreso UI 📊

**Objetivo:** Verificar que UI refleja progreso real

**Pasos:**
1. Navegar a proyecto
2. Observar pantalla de carga

**Elementos a validar:**
- [ ] Barra de progreso se llena gradualmente
- [ ] Porcentaje aumenta: 0% → 100%
- [ ] Nombre del producto actual se actualiza
- [ ] Contador: "X de Y modelos"
- [ ] Spinner animado visible

**✅ Validaciones:**
- [ ] UI responde fluidamente
- [ ] No hay saltos bruscos en progreso
- [ ] Nombres de productos visibles
- [ ] Transición suave a vista de modelos

---

### TEST 6: Memory Leaks 🧹

**Objetivo:** Verificar que no hay fugas de memoria

**Pasos:**
1. DevTools > Performance tab > Click "Record"
2. Navegar a proyecto A
3. Esperar carga completa
4. Navegar a proyecto B
5. Esperar carga completa
6. Navegar a proyecto C
7. Stop recording

**Resultados esperados:**
- Memoria se estabiliza después de cada carga
- No hay crecimiento continuo de memoria

**✅ Validaciones:**
- [ ] Gráfico de memoria en "dientes de sierra"
- [ ] Garbage collection recupera memoria
- [ ] No hay crecimiento lineal

**Herramienta alternativa:**
1. DevTools > Memory tab
2. Take heap snapshot antes de navegar
3. Navegar y volver varias veces
4. Take otro snapshot
5. Comparar tamaños

---

## 📊 Resultados Esperados vs Anteriores

### Comparativa de Rendimiento

| Métrica | ANTES | DESPUÉS | Mejora |
|---------|-------|---------|--------|
| Primera carga (20 prod) | ~200s | ~60s | **-70%** ⚡ |
| Segunda carga (cache) | ~200s | ~3s | **-98%** 🚀 |
| Imágenes/producto | 90 | 45 | **-50%** |
| Productos paralelos | 1 | 3 | **+200%** |
| Memory leaks | Sí | No | ✅ |

---

## 🐛 Troubleshooting

### Problema: Cache no funciona

**Síntomas:**
- Segunda carga igual de lenta que primera
- No aparece `keyshot-models-v1` en Cache Storage

**Soluciones:**
1. Verificar que navegador soporta Cache API:
   ```javascript
   console.log('Cache API disponible:', 'caches' in window);
   ```
2. Verificar que no estés en modo incógnito
3. Verificar espacio disponible en disco
4. Revisar console por errores de permisos

---

### Problema: Carga no es paralela

**Síntomas:**
- Network tab muestra requests secuenciales
- Tarda igual que antes

**Soluciones:**
1. Verificar que `CONCURRENT_PRODUCTS = 3` en código
2. Revisar console por errores
3. Verificar que navegador no limita conexiones
4. Probar con proyecto que tenga 6+ productos

---

### Problema: Cancelación no funciona

**Síntomas:**
- Logs continúan tras navegar fuera
- Network tab muestra requests activos

**Soluciones:**
1. Verificar mensaje "🧹 Limpiando precarga..."
2. Revisar que `abortControllerRef` existe
3. Verificar compatibilidad de AbortController en navegador
4. Revisar console por errores

---

## ✅ Checklist Final

### Funcionalidad
- [ ] Primera carga < 90 segundos (20 productos)
- [ ] Segunda carga < 5 segundos
- [ ] Carga paralela visible en Network tab
- [ ] Cancelación funciona al navegar fuera
- [ ] UI muestra progreso correcto
- [ ] No hay memory leaks

### Console Logs
- [ ] "🚀 Iniciando precarga..." aparece
- [ ] "📦 Producto X: Yms..." por cada producto
- [ ] "✅ Precarga completada..." al finalizar
- [ ] "🧹 Limpiando precarga..." al cancelar

### Cache Storage
- [ ] `keyshot-models-v1` se crea
- [ ] Contiene ~900 imágenes (20 prod × 45)
- [ ] Persiste entre recargas

### Performance
- [ ] Primera carga 70% más rápida
- [ ] Segunda carga 98% más rápida
- [ ] Memoria se mantiene estable

---

## 📸 Screenshots Esperados

### Console (Primera Carga)
```
🚀 Iniciando precarga de 20 productos...
📦 Silla Moderna: 2543ms (45 imgs)
📦 Mesa Clásica: 2301ms (45 imgs)
📦 Lámpara LED: 2412ms (45 imgs)
...
✅ Precarga completada: 20/20 productos en 58.3s
```

### Console (Segunda Carga)
```
🚀 Iniciando precarga de 20 productos...
📦 Silla Moderna: 142ms (45 imgs)
📦 Mesa Clásica: 118ms (45 imgs)
📦 Lámpara LED: 135ms (45 imgs)
...
✅ Precarga completada: 20/20 productos en 2.8s
```

### Cache Storage
```
keyshot-models-v1 (1,243 items)
├─ https://...supabase.co/.../0_0.png
├─ https://...supabase.co/.../0_1.png
├─ https://...supabase.co/.../0_2.png
...
```

---

## 🎯 Criterios de Éxito

Para considerar la implementación exitosa, **TODOS** estos deben cumplirse:

1. ✅ Primera carga reduce tiempo en mínimo 50%
2. ✅ Segunda carga < 5 segundos
3. ✅ Cache Storage contiene imágenes
4. ✅ Cancelación funciona sin errores
5. ✅ No hay memory leaks visibles
6. ✅ UI muestra progreso correctamente
7. ✅ Console muestra logs informativos
8. ✅ Network tab muestra paralelismo

---

## 🚀 Siguiente Paso

Una vez validados todos los tests:

1. Hacer commit de cambios
2. Crear PR con documentación
3. Desplegar a staging
4. Monitorear métricas en producción

---

**Testeado por:** _____________  
**Fecha:** _____________  
**Resultado:** ☐ Exitoso ☐ Con issues  
**Notas:**

# 🔧 Troubleshooting: Problemas con Encuestas

## Problemas Resueltos

### ✅ 1. Texto en Inputs No se Ve (Color Gris Claro)

**Síntoma:** El texto escrito en los inputs es casi invisible (gris muy claro sobre blanco)

**Causa:** Faltaba la clase `text-gray-900` en los inputs y textareas

**Solución Aplicada:**

- Agregado `text-gray-900` a todos los inputs del formulario
- Agregado `text-gray-900` a todos los textareas

**Archivos Modificados:**

- `src/components/CreateSurveyWizard.tsx` (líneas ~250, ~263, ~276, ~398, ~411)

**Clases CSS Actualizadas:**

```tsx
// ANTES
className =
  "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent";

// DESPUÉS
className =
  "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900";
```

---

### 🔍 2. Las Encuestas No Se Muestran Después de Crearlas

**Síntoma:** Después de crear una encuesta exitosamente, la lista permanece vacía

**Posibles Causas:**

1. ❌ Error en base de datos (campo `is_public` no existe)
2. ❌ Error en la query (admin_id no coincide)
3. ❌ Error en el mapeo de datos
4. ❌ Error silencioso no reportado

**Debug Agregado:**

```typescript
// En surveys/page.tsx
console.log("📋 Cargando encuestas para usuario:", userId);
console.log("📥 Resultado getAllSurveys:", result);
console.log("✅ Encuestas cargadas:", result.surveys.length);

// En SupabaseSurveyRepository.ts
console.log("🔍 getAllSurveys - adminId:", adminId);
console.log("📥 getAllSurveys - data:", data);
console.log("📥 getAllSurveys - error:", error);
```

**Cómo Diagnosticar:**

1. Abre la consola del navegador (F12)
2. Ve a la pestaña de Encuestas
3. Revisa los logs en consola
4. Busca estos mensajes:
   - ✅ "Encuestas cargadas: X" → OK
   - ❌ Error de Supabase → Problema de BD
   - ❌ "Encuestas cargadas: 0" → Ver siguiente paso

**Verificación Manual en Supabase:**

```sql
-- Ver encuestas creadas
SELECT * FROM survey ORDER BY survey_id DESC LIMIT 10;

-- Verificar estructura
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'survey';

-- Debe existir: is_public (boolean)
```

---

### 🔍 3. Las Preguntas No Se Crean en la Base de Datos

**Síntoma:** La encuesta se crea pero las preguntas no aparecen en la BD

**Posibles Causas:**

1. ❌ Error en createQuestion silenciado
2. ❌ Problema con survey_id
3. ❌ Error de permisos RLS
4. ❌ Trigger o constraint fallando

**Debug Agregado:**

```typescript
// En CreateSurveyWizard.tsx
console.log("❓ Creando", questions.length, "preguntas...");
console.log(`📝 Pregunta ${i + 1}:`, { title, surveyId, numProducts });
console.log(`📥 Resultado pregunta ${i + 1}:`, questionResult);
console.log(`✅ Pregunta ${i + 1} creada con ID:`, questionResult.question.id);

// En SupabaseSurveyRepository.ts
console.log("📝 createQuestion - entrada:", question);
console.log("📥 createQuestion - data:", data);
console.log("📥 createQuestion - error:", error);
console.log("✅ createQuestion - resultado:", createdQuestion);
```

**Cómo Diagnosticar:**

1. Abre consola (F12) antes de crear encuesta
2. Completa el formulario y crea la encuesta
3. Revisa los logs secuenciales:
   ```
   🚀 Iniciando creación de encuesta...
   📤 Creando encuesta...
   ✅ Encuesta creada con ID: 123
   ❓ Creando 2 preguntas...
   📝 Pregunta 1: {...}
   📥 Resultado pregunta 1: {...}
   ✅ Pregunta 1 creada con ID: 456
   ```
4. Si algún paso falla, verás el error específico

**Verificación Manual en Supabase:**

```sql
-- Ver preguntas de una encuesta
SELECT * FROM question WHERE survey_id = 123;

-- Ver relaciones producto-pregunta
SELECT * FROM question_product WHERE question_id = 456;

-- Verificar RLS policies
SELECT * FROM pg_policies WHERE tablename = 'question';
```

---

## 📊 Diagnóstico Completo

### Paso 1: Verificar Creación de Encuesta

**Consola del navegador:**

```
✅ Encuesta creada con ID: X
```

**Base de datos:**

```sql
SELECT * FROM survey WHERE survey_id = X;
```

**Debe mostrar:**

- ✅ survey_id existe
- ✅ is_public = true
- ✅ admin_id coincide con tu usuario
- ✅ title, description, password tienen valores

---

### Paso 2: Verificar Creación de Preguntas

**Consola del navegador:**

```
✅ Pregunta 1 creada con ID: Y
✅ Pregunta 2 creada con ID: Z
```

**Base de datos:**

```sql
SELECT * FROM question WHERE survey_id = X;
```

**Debe mostrar:**

- ✅ 2 filas (si creaste 2 preguntas)
- ✅ question_id existe
- ✅ survey_id = X
- ✅ title, description tienen valores
- ✅ num_products > 0

---

### Paso 3: Verificar Relaciones Producto-Pregunta

**Consola del navegador:**

```
✅ Productos asignados a pregunta 1: {ok: true}
```

**Base de datos:**

```sql
SELECT * FROM question_product WHERE question_id = Y;
```

**Debe mostrar:**

- ✅ N filas (N = productos seleccionados para esa pregunta)
- ✅ question_id = Y
- ✅ product_id existe en tabla product

---

### Paso 4: Verificar Carga de Encuestas

**Consola del navegador:**

```
📋 Cargando encuestas para usuario: abc-123
📥 Resultado getAllSurveys: {ok: true, surveys: [...]}
✅ Encuestas cargadas: 1
```

**Si muestra 0 encuestas pero existen en BD:**

**Posible causa:** `admin_id` no coincide

```sql
-- Verificar tu admin_id real
SELECT id, email FROM auth.users WHERE email = 'tu@email.com';

-- Comparar con las encuestas
SELECT admin_id FROM survey WHERE survey_id = X;

-- Deben ser iguales (UUID)
```

---

## 🚨 Errores Comunes

### Error: "is_public column does not exist"

**Solución:**

```sql
ALTER TABLE survey RENAME COLUMN is_active TO is_public;
```

### Error: "permission denied for table question"

**Solución:** Revisar políticas RLS

```sql
-- Permitir INSERT en question
CREATE POLICY "Users can insert questions for their surveys"
ON question FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM survey
    WHERE survey.survey_id = question.survey_id
    AND survey.admin_id = auth.uid()
  )
);
```

### Error: "null value in column survey_id violates not-null constraint"

**Causa:** `surveyResult.survey.id` es undefined

**Solución:** Verificar que createSurveyAction retorne el survey con id

```typescript
if (!surveyResult.ok || !surveyResult.survey?.id) {
  console.error("❌ Survey no tiene ID:", surveyResult);
  throw new Error("Survey creado sin ID");
}
```

---

## 🔍 Checklist de Diagnóstico

Usa este checklist para diagnosticar problemas:

- [ ] Abre consola del navegador (F12)
- [ ] Ve a pestaña Console
- [ ] Intenta crear una encuesta
- [ ] Busca "🚀 Iniciando creación de encuesta..."
- [ ] Verifica cada paso tenga ✅
- [ ] Si hay ❌, lee el mensaje de error
- [ ] Verifica en Supabase SQL Editor:
  - [ ] Tabla `survey` tiene `is_public` column
  - [ ] Encuesta existe con tu `admin_id`
  - [ ] Preguntas existen con `survey_id` correcto
  - [ ] Relaciones `question_product` existen
- [ ] Verifica RLS policies permiten operaciones
- [ ] Verifica triggers no fallan

---

## 📞 Reportar Problemas

Si el problema persiste, incluye en el reporte:

1. **Logs de Consola:**

   - Copia todos los mensajes desde "🚀 Iniciando..."
   - Incluye errores en rojo

2. **Query Results:**

   ```sql
   SELECT * FROM survey ORDER BY survey_id DESC LIMIT 1;
   SELECT * FROM question WHERE survey_id = [ultimo_id];
   ```

3. **Configuración:**
   - Versión de Next.js
   - Versión de Supabase
   - Navegador usado

---

**Última actualización:** 3 de noviembre de 2025  
**Versión:** 1.0

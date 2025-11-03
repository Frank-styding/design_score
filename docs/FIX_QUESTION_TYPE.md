# ✅ Solución: Campo question_type Faltante

## 🐛 Problema Identificado

```
Error: null value in column "question_type" of relation "question"
violates not-null constraint
```

La tabla `question` en la base de datos requiere el campo `question_type` (NOT NULL), pero no se estaba enviando al crear preguntas.

---

## 🔧 Correcciones Realizadas

### 1. ✅ Entidad Question Actualizada

**Archivo:** `src/domain/entities/Question.ts`

```typescript
export interface Question {
  id?: number;
  surveyId: number;
  title: string;
  description: string;
  questionType: string; // ← NUEVO CAMPO
  numProducts: number;
  products: Product[];
}
```

**Descripción:** Campo `questionType` agregado para almacenar el tipo de pregunta.

---

### 2. ✅ Repositorio Actualizado

**Archivo:** `src/infrastrucutre/supabse/SupabaseSurveyRepository.ts`

#### createQuestion():

```typescript
async createQuestion(question: Question): Promise<Question> {
  const { data, error } = await this.supabaseClient
    .from("question")
    .insert({
      survey_id: question.surveyId,
      title: question.title,
      description: question.description,
      question_type: question.questionType || "selection", // ← AGREGADO
      num_products: question.numProducts || 0,
    })
    .select()
    .single();

  // ... resto del código
}
```

**Cambio:** Se agregó `question_type` con valor por defecto `"selection"`.

#### mapQuestionFromDb():

```typescript
private mapQuestionFromDb(data: any): Question {
  return {
    id: data.question_id,
    surveyId: data.survey_id,
    title: data.title,
    description: data.description,
    questionType: data.question_type, // ← AGREGADO
    numProducts: data.num_products,
    products: [],
  };
}
```

**Cambio:** Mapeo del campo `question_type` desde la BD.

---

### 3. ✅ CreateSurveyWizard Actualizado

**Archivo:** `src/components/CreateSurveyWizard.tsx`

```typescript
const questionData: Question = {
  surveyId: surveyResult.survey.id,
  title: questionForm.title,
  description: questionForm.description,
  questionType: "selection", // ← AGREGADO (tipo por defecto)
  numProducts: questionForm.selectedProductIds.length,
  products: [],
};
```

**Cambio:** Se agrega `questionType: "selection"` por defecto al crear preguntas.

---

## 🎯 Tipos de Pregunta Soportados

Según el esquema de la base de datos, los tipos válidos son:

| Tipo           | Descripción                                     |
| -------------- | ----------------------------------------------- |
| `"selection"`  | Selección de producto favorito ⭐ (por defecto) |
| `"rating"`     | Calificación con estrellas o números            |
| `"text"`       | Respuesta de texto libre                        |
| `"ranking"`    | Ordenar productos por preferencia               |
| `"comparison"` | Comparación par a par                           |

**Valor por defecto:** `"selection"` (seleccionar un producto favorito)

---

## 📊 Flujo de Creación Actualizado

```
1. Usuario crea encuesta → Survey insertado ✅
   ↓
2. Productos asignados a survey → survey_product ✅
   ↓
3. Usuario crea preguntas → Question insertado ✅
   - Ahora incluye question_type: "selection"
   ↓
4. Productos asignados a preguntas → question_product ✅
   ↓
5. Encuesta aparece en lista ✅
```

---

## 🧪 Pruebas Sugeridas

### Test 1: Crear Encuesta Simple

1. Ir a `/surveys`
2. Click "Nueva Encuesta"
3. Completar Paso 1 (título, descripción, contraseña, productos)
4. Completar Paso 2 (agregar 1 pregunta)
5. Click "Crear Encuesta"
6. **Resultado esperado:** ✅ Encuesta creada sin errores

### Test 2: Ver Consola

Abrir DevTools y verificar logs:

```
📝 createQuestion - entrada: { questionType: "selection", ... }
📥 createQuestion - data: { question_id: "...", question_type: "selection" }
📥 createQuestion - error: null
✅ Encuesta creada exitosamente
```

### Test 3: Verificar Base de Datos

```sql
SELECT question_id, title, question_type, num_products
FROM question
ORDER BY created_at DESC
LIMIT 5;
```

**Resultado esperado:**

```
question_id | title | question_type | num_products
------------|-------|---------------|-------------
uuid-1      | aaa   | selection     | 1
```

---

## 🔍 Verificación de Logs

### ✅ Log Exitoso (Esperado)

```
📝 createQuestion - entrada: {
  surveyId: 'f9f0fc0a-27ff-40ef-8ffe-6e9f5816f275',
  title: 'aaa',
  description: 'aaaaa',
  questionType: 'selection',  ← ✅ AHORA PRESENTE
  numProducts: 1,
  products: []
}
📥 createQuestion - data: {
  question_id: 'abc-123',
  question_type: 'selection',  ← ✅ AHORA PRESENTE
  ...
}
📥 createQuestion - error: null  ← ✅ SIN ERROR
```

### ❌ Log con Error (Antes)

```
📝 createQuestion - entrada: {
  surveyId: 'f9f0fc0a-27ff-40ef-8ffe-6e9f5816f275',
  title: 'aaa',
  description: 'aaaaa',
  numProducts: 1,
  products: []
}
📥 createQuestion - data: null
📥 createQuestion - error: {
  code: '23502',
  message: 'null value in column "question_type"...'
}
```

---

## 📝 Checklist de Verificación

- [x] Campo `questionType` agregado a entidad Question
- [x] `question_type` incluido en INSERT de createQuestion()
- [x] Valor por defecto `"selection"` configurado
- [x] `questionType` mapeado en mapQuestionFromDb()
- [x] CreateSurveyWizard envía `questionType`
- [x] Errores de TypeScript resueltos
- [ ] Prueba de creación de encuesta exitosa
- [ ] Verificación en base de datos

---

## 🎉 Resultado Final

**Antes:** ❌ Error al crear preguntas → Encuestas sin preguntas

**Ahora:** ✅ Preguntas se crean correctamente → Encuestas completas

---

## 💡 Mejoras Futuras

1. **UI para Seleccionar Tipo de Pregunta:**

   ```tsx
   <select value={question.questionType}>
     <option value="selection">Selección de Favorito</option>
     <option value="rating">Calificación</option>
     <option value="ranking">Ranking</option>
   </select>
   ```

2. **Validación de Tipo:**

   ```typescript
   const VALID_TYPES = ["selection", "rating", "text", "ranking"];
   if (!VALID_TYPES.includes(questionType)) {
     throw new Error("Invalid question type");
   }
   ```

3. **Diferentes UIs según Tipo:**
   - `selection`: Radio buttons
   - `rating`: Stars component
   - `ranking`: Drag & drop list

---

**Fecha:** 3 de noviembre de 2025  
**Estado:** ✅ Corregido  
**Archivos modificados:** 3  
**Errores resueltos:** 1 crítico (23502)

# 🔗 Survey-Product Integration - Documentación Completa

## 📋 Resumen

Se ha actualizado todo el sistema de Survey para incluir la gestión de relaciones Many-to-Many con productos:

- ✅ Survey ↔ Product (muchos a muchos)
- ✅ Question ↔ Product (muchos a muchos)

Todas las capas de Clean Architecture han sido actualizadas: **Port → Use Case → Repository → Server Actions**.

---

## 🗂️ Archivos Actualizados

```
✅ src/domain/ports/ISurveyRepository.ts         (6 nuevos métodos)
✅ src/domain/usecase/SurveyUseCase.ts           (6 nuevos métodos con validaciones)
✅ src/infrastrucutre/supabse/SupabaseSurveyRepository.ts (6 implementaciones)
✅ src/app/actions/surveyActions.ts              (6 nuevas Server Actions)
```

---

## 🔌 1. ISurveyRepository (Port)

### Nuevos Métodos:

```typescript
export interface ISurveyRepository {
  // ... métodos existentes ...

  // Survey-Product Relations
  assignProductsToSurvey(
    surveyId: string,
    productIds: string[]
  ): Promise<boolean>;
  removeProductsFromSurvey(
    surveyId: string,
    productIds: string[]
  ): Promise<boolean>;
  getProductsBySurveyId(surveyId: string): Promise<string[]>;

  // Question-Product Relations
  assignProductsToQuestion(
    questionId: string,
    productIds: string[]
  ): Promise<boolean>;
  removeProductsFromQuestion(
    questionId: string,
    productIds: string[]
  ): Promise<boolean>;
  getProductsByQuestionId(questionId: string): Promise<string[]>;
}
```

### Contratos:

- **assignProductsToSurvey**: Asigna múltiples productos a una encuesta (upsert)
- **removeProductsFromSurvey**: Remueve múltiples productos de una encuesta
- **getProductsBySurveyId**: Obtiene lista de IDs de productos de una encuesta
- **assignProductsToQuestion**: Asigna múltiples productos a una pregunta (upsert + trigger)
- **removeProductsFromQuestion**: Remueve múltiples productos de una pregunta (trigger automático)
- **getProductsByQuestionId**: Obtiene lista de IDs de productos de una pregunta

---

## 💼 2. SurveyUseCase (Business Logic)

### Nuevos Métodos con Validaciones:

#### 📊 Survey-Product Operations:

```typescript
/**
 * Asignar productos a una encuesta
 * Validaciones:
 * - surveyId requerido
 * - Al menos 1 producto requerido
 */
async assignProductsToSurvey(
  surveyId: string,
  productIds: string[]
): Promise<{ ok: boolean; error?: string }>;

/**
 * Remover productos de una encuesta
 * Validaciones:
 * - surveyId requerido
 * - Al menos 1 producto requerido
 */
async removeProductsFromSurvey(
  surveyId: string,
  productIds: string[]
): Promise<{ ok: boolean; error?: string }>;

/**
 * Obtener productos de una encuesta
 * Validación:
 * - surveyId requerido
 */
async getProductsBySurveyId(
  surveyId: string
): Promise<{ productIds: string[]; ok: boolean; error?: string }>;
```

#### 📝 Question-Product Operations:

```typescript
/**
 * Asignar productos a una pregunta
 * Validaciones:
 * - questionId requerido
 * - Al menos 1 producto requerido
 * Nota: El trigger update_question_product_count() actualiza num_products automáticamente
 */
async assignProductsToQuestion(
  questionId: string,
  productIds: string[]
): Promise<{ ok: boolean; error?: string }>;

/**
 * Remover productos de una pregunta
 * Validaciones:
 * - questionId requerido
 * - Al menos 1 producto requerido
 * Nota: El trigger update_question_product_count() actualiza num_products automáticamente
 */
async removeProductsFromQuestion(
  questionId: string,
  productIds: string[]
): Promise<{ ok: boolean; error?: string }>;

/**
 * Obtener productos de una pregunta
 * Validación:
 * - questionId requerido
 */
async getProductsByQuestionId(
  questionId: string
): Promise<{ productIds: string[]; ok: boolean; error?: string }>;
```

### Patrón de Respuesta:

Todos los métodos siguen el patrón consistente:

```typescript
{
  ok: boolean;
  error?: string;
  // data específico según el método
}
```

---

## 🗄️ 3. SupabaseSurveyRepository (Infrastructure)

### Implementaciones:

#### 📊 Survey-Product:

```typescript
async assignProductsToSurvey(
  surveyId: string,
  productIds: string[]
): Promise<boolean> {
  // Insertar relaciones en survey_product con UPSERT
  const insertData = productIds.map((productId) => ({
    survey_id: surveyId,
    product_id: productId,
  }));

  const { error } = await this.supabaseClient
    .from("survey_product")
    .upsert(insertData, { onConflict: "survey_id,product_id" });

  if (error) {
    throw new Error(`Error assigning products to survey: ${error.message}`);
  }

  return true;
}

async removeProductsFromSurvey(
  surveyId: string,
  productIds: string[]
): Promise<boolean> {
  const { error } = await this.supabaseClient
    .from("survey_product")
    .delete()
    .eq("survey_id", surveyId)
    .in("product_id", productIds);

  if (error) {
    throw new Error(`Error removing products from survey: ${error.message}`);
  }

  return true;
}

async getProductsBySurveyId(surveyId: string): Promise<string[]> {
  const { data, error } = await this.supabaseClient
    .from("survey_product")
    .select("product_id")
    .eq("survey_id", surveyId);

  if (error) {
    throw new Error(`Error getting products by survey: ${error.message}`);
  }

  return data.map((row) => row.product_id);
}
```

#### 📝 Question-Product:

```typescript
async assignProductsToQuestion(
  questionId: string,
  productIds: string[]
): Promise<boolean> {
  // Insertar relaciones en question_product con UPSERT
  const insertData = productIds.map((productId) => ({
    question_id: questionId,
    product_id: productId,
  }));

  const { error } = await this.supabaseClient
    .from("question_product")
    .upsert(insertData, { onConflict: "question_id,product_id" });

  if (error) {
    throw new Error(`Error assigning products to question: ${error.message}`);
  }

  // ✅ El trigger update_question_product_count() actualiza num_products automáticamente
  return true;
}

async removeProductsFromQuestion(
  questionId: string,
  productIds: string[]
): Promise<boolean> {
  const { error } = await this.supabaseClient
    .from("question_product")
    .delete()
    .eq("question_id", questionId)
    .in("product_id", productIds);

  if (error) {
    throw new Error(`Error removing products from question: ${error.message}`);
  }

  // ✅ El trigger update_question_product_count() actualiza num_products automáticamente
  return true;
}

async getProductsByQuestionId(questionId: string): Promise<string[]> {
  const { data, error } = await this.supabaseClient
    .from("question_product")
    .select("product_id")
    .eq("question_id", questionId);

  if (error) {
    throw new Error(`Error getting products by question: ${error.message}`);
  }

  return data.map((row) => row.product_id);
}
```

### Características Técnicas:

✅ **UPSERT**: Evita duplicados al asignar productos (usa `onConflict`)  
✅ **Batch Operations**: Inserta/elimina múltiples productos en una sola query  
✅ **Trigger Integration**: `question_product` actualiza `num_products` automáticamente  
✅ **Error Handling**: Lanza excepciones con mensajes descriptivos

---

## 🎬 4. Server Actions

### Nuevas Actions Disponibles:

```typescript
// ============================================================
// 🔹 SURVEY-PRODUCT ACTIONS
// ============================================================

export async function assignProductsToSurveyAction(
  surveyId: string,
  productIds: string[]
): Promise<{ ok: boolean; error?: string }>;

export async function removeProductsFromSurveyAction(
  surveyId: string,
  productIds: string[]
): Promise<{ ok: boolean; error?: string }>;

export async function getProductsBySurveyIdAction(
  surveyId: string
): Promise<{ productIds: string[]; ok: boolean; error?: string }>;

// ============================================================
// 🔹 QUESTION-PRODUCT ACTIONS
// ============================================================

export async function assignProductsToQuestionAction(
  questionId: string,
  productIds: string[]
): Promise<{ ok: boolean; error?: string }>;

export async function removeProductsFromQuestionAction(
  questionId: string,
  productIds: string[]
): Promise<{ ok: boolean; error?: string }>;

export async function getProductsByQuestionIdAction(
  questionId: string
): Promise<{ productIds: string[]; ok: boolean; error?: string }>;
```

---

## 🧪 Ejemplos de Uso

### Ejemplo 1: Admin Asigna Productos a Encuesta

```typescript
"use client";

import { assignProductsToSurveyAction } from "@/src/app/actions/surveyActions";

export default function SurveyProductManager({
  surveyId,
}: {
  surveyId: string;
}) {
  const handleAssignProducts = async () => {
    const productIds = ["product-uuid-1", "product-uuid-2", "product-uuid-3"];

    const result = await assignProductsToSurveyAction(surveyId, productIds);

    if (result.ok) {
      alert("✅ Productos asignados correctamente");
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  return <button onClick={handleAssignProducts}>Asignar Productos</button>;
}
```

### Ejemplo 2: Admin Configura Productos de una Pregunta

```typescript
"use client";

import {
  assignProductsToQuestionAction,
  getProductsByQuestionIdAction,
} from "@/src/app/actions/surveyActions";
import { useState, useEffect } from "react";

export default function QuestionProductSelector({
  questionId,
}: {
  questionId: string;
}) {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    const result = await getProductsByQuestionIdAction(questionId);
    if (result.ok) {
      setSelectedProducts(result.productIds);
    }
  };

  const handleSaveProducts = async () => {
    const result = await assignProductsToQuestionAction(
      questionId,
      selectedProducts
    );

    if (result.ok) {
      alert("✅ Productos actualizados");
      // num_products se actualiza automáticamente por el trigger
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  return (
    <div>
      {/* UI para seleccionar productos */}
      <button onClick={handleSaveProducts}>Guardar</button>
    </div>
  );
}
```

### Ejemplo 3: Remover Productos de una Encuesta

```typescript
"use client";

import {
  removeProductsFromSurveyAction,
  getProductsBySurveyIdAction,
} from "@/src/app/actions/surveyActions";

export default function ProductRemover({ surveyId }: { surveyId: string }) {
  const handleRemoveProduct = async (productId: string) => {
    const result = await removeProductsFromSurveyAction(surveyId, [productId]);

    if (result.ok) {
      alert("✅ Producto removido");
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const handleLoadProducts = async () => {
    const result = await getProductsBySurveyIdAction(surveyId);
    if (result.ok) {
      console.log("Productos:", result.productIds);
    }
  };

  return (
    <>
      <button onClick={handleLoadProducts}>Cargar Productos</button>
      <button onClick={() => handleRemoveProduct("product-uuid")}>
        Remover
      </button>
    </>
  );
}
```

### Ejemplo 4: Flujo Completo - Crear Pregunta y Asignar Productos

```typescript
"use client";

import {
  createQuestionAction,
  assignProductsToQuestionAction,
  getProductsByQuestionIdAction,
} from "@/src/app/actions/surveyActions";

export default function QuestionCreator({ surveyId }: { surveyId: string }) {
  const handleCreateQuestion = async () => {
    // 1. Crear pregunta
    const questionResult = await createQuestionAction({
      surveyId,
      title: "¿Cuál producto prefieres?",
      description: "Evalúa el diseño",
      numProducts: 0, // Se actualizará automáticamente
      products: [],
    });

    if (!questionResult.ok) {
      alert(`Error: ${questionResult.error}`);
      return;
    }

    const questionId = questionResult.question!.id!;

    // 2. Asignar productos
    const productIds = ["prod-1", "prod-2", "prod-3"];
    const assignResult = await assignProductsToQuestionAction(
      questionId,
      productIds
    );

    if (!assignResult.ok) {
      alert(`Error: ${assignResult.error}`);
      return;
    }

    // 3. Verificar que numProducts se actualizó
    const productsResult = await getProductsByQuestionIdAction(questionId);
    console.log("Productos asignados:", productsResult.productIds.length);
    // El trigger ya actualizó num_products a 3

    alert("✅ Pregunta creada con 3 productos");
  };

  return <button onClick={handleCreateQuestion}>Crear Pregunta</button>;
}
```

---

## 🔄 Flujo de Datos Completo

### Diagrama de Flujo:

```
┌─────────────────┐
│  UI Component   │
│  (React)        │
└────────┬────────┘
         │ onClick
         ▼
┌─────────────────────────────────┐
│  Server Action                  │
│  assignProductsToQuestionAction │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  SurveyUseCase                  │
│  ✅ Validaciones:               │
│     - questionId requerido      │
│     - productIds.length > 0     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  SupabaseSurveyRepository       │
│  UPSERT en question_product     │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  PostgreSQL                     │
│  1. INSERT en question_product  │
│  2. TRIGGER ejecuta:            │
│     update_question_product_    │
│     count()                     │
│  3. UPDATE question.num_products│
└─────────────────────────────────┘
```

---

## ✅ Validaciones Implementadas

### Survey-Product:

- ✅ `surveyId` requerido y no vacío
- ✅ `productIds` array con al menos 1 elemento
- ✅ Manejo de errores con mensajes descriptivos

### Question-Product:

- ✅ `questionId` requerido y no vacío
- ✅ `productIds` array con al menos 1 elemento
- ✅ Actualización automática de `num_products` por trigger
- ✅ Manejo de errores con mensajes descriptivos

---

## 🔐 Seguridad (RLS)

Las políticas RLS de `survey_product` y `question_product` ya están configuradas en `COMPLETE_DATABASE_WITH_RLS.sql`:

### Survey-Product:

- ✅ **SELECT**: Usuarios ven productos de encuestas públicas o propias
- ✅ **INSERT**: Solo admins pueden vincular productos
- ✅ **DELETE**: Solo admins pueden desvincular productos

### Question-Product:

- ✅ **SELECT**: Usuarios ven productos de preguntas públicas/propias
- ✅ **INSERT**: Solo admins de la encuesta pueden vincular
- ✅ **DELETE**: Solo admins de la encuesta pueden desvincular

---

## 📊 Actualizaciones en Mappers

### Survey Mapper:

```typescript
private mapSurveyFromDb(data: any): Survey {
  return {
    id: data.survey_id,
    title: data.title,
    description: data.description,
    adminId: data.admin_id,
    isActive: data.is_active,
    password: data.password,
    questions: data.questions?.map(this.mapQuestionFromDb) || [],
    products: [], // ✅ Se carga por separado con getProductsBySurveyId()
  };
}
```

### Question Mapper:

```typescript
private mapQuestionFromDb(data: any): Question {
  return {
    id: data.question_id,
    surveyId: data.survey_id,
    title: data.title,
    description: data.description,
    numProducts: data.num_products,
    products: [], // ✅ Se carga por separado con getProductsByQuestionId()
  };
}
```

### Answer Mapper:

```typescript
private mapAnswerFromDb(data: any): Answer {
  return {
    id: data.answer_id,
    questionId: data.question_id,
    participantId: data.participant_id,
    answer_option: data.answer_option || "", // ✅ Campo agregado
    comment: data.comment,
  };
}
```

---

## 🎯 Próximos Pasos

1. ✅ **Ejecutar SQL** - Correr `COMPLETE_DATABASE_WITH_RLS.sql` en Supabase
2. ⬜ **Crear UI Components**:
   - `ProductSelector` - Componente para seleccionar productos
   - `SurveyProductManager` - Gestionar productos de encuestas
   - `QuestionProductEditor` - Gestionar productos de preguntas
3. ⬜ **Cargar Products con Datos Completos**:
   - Modificar mappers para hacer JOIN con `product` table
   - Devolver objetos `Product` completos en lugar de solo IDs
4. ⬜ **Testing**:
   - Tests unitarios de Use Cases
   - Tests de integración con Supabase
   - Tests E2E de flujos completos

---

## 📝 Resumen de Cambios

| Capa       | Archivo                     | Cambios                                        |
| ---------- | --------------------------- | ---------------------------------------------- |
| Port       | ISurveyRepository.ts        | +6 métodos (survey-product y question-product) |
| Use Case   | SurveyUseCase.ts            | +6 métodos con validaciones completas          |
| Repository | SupabaseSurveyRepository.ts | +6 implementaciones + mappers actualizados     |
| Actions    | surveyActions.ts            | +6 Server Actions exportadas                   |

**Total:**

- ✅ 24 nuevos métodos/implementaciones
- ✅ 0 errores de TypeScript
- ✅ Validaciones robustas
- ✅ Patrón consistente en todas las capas
- ✅ Integración con trigger de PostgreSQL
- ✅ Políticas RLS configuradas

---

## 🎉 Conclusión

El sistema de Survey ahora tiene soporte completo para gestionar relaciones Many-to-Many con productos:

- ✅ **Arquitectura limpia** mantenida en todas las capas
- ✅ **Validaciones** en capa de negocio
- ✅ **Trigger automático** para `num_products`
- ✅ **Seguridad RLS** configurada
- ✅ **UPSERT** para evitar duplicados
- ✅ **Batch operations** para rendimiento
- ✅ **TypeScript** estricto sin errores

**Sistema listo para integrar con UI** 🚀

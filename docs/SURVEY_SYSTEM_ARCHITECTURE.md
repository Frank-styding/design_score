# Survey System - Architecture Documentation

## 📋 Resumen

Sistema completo de encuestas (surveys) con Clean Architecture, siguiendo los mismos patrones de Product. Incluye gestión de encuestas, preguntas, participantes y respuestas.

## 🗂️ Estructura Creada

```
src/
├── domain/
│   ├── entities/
│   │   ├── Survery.ts ✅ (Existente)
│   │   ├── Question.ts ✅ (Existente)
│   │   ├── Answer.ts ✅ (Existente)
│   │   └── SurveyParticipant.ts ✅ (Existente)
│   ├── ports/
│   │   └── ISurveyRepository.ts ✅ Nuevo
│   └── usecase/
│       └── SurveyUseCase.ts ✅ Nuevo
├── infrastrucutre/
│   └── supabse/
│       └── SupabaseSurveyRepository.ts ✅ Nuevo
└── app/
    └── actions/
        └── surveyActions.ts ✅ Nuevo
```

---

## 📦 Entidades (Domain Entities)

### 1. Survey

```typescript
interface Survey {
  id?: number;
  password?: string;
  title: string;
  description: string;
  adminId: string;
  isActive: boolean;
  questions?: Question[];
}
```

### 2. Question

```typescript
interface Question {
  id?: number;
  surveyId: number;
  title: string;
  description: string;
  numProducts: number;
}
```

### 3. SurveyParticipant

```typescript
interface SurveyParticipant {
  id?: string;
  name: string;
  email?: string;
}
```

### 4. Answer

```typescript
interface Answer {
  id?: number;
  questionId: number;
  participantId: string;
  comment: string;
}
```

---

## 🔌 Port (Interface del Repositorio)

**Archivo:** `src/domain/ports/ISurveyRepository.ts`

### Survey Operations:

- `createSurvey(survey: Survey): Promise<Survey>`
- `getSurveyById(surveyId: number): Promise<Survey | null>`
- `getAllSurveys(adminId: string): Promise<Survey[]>`
- `updateSurvey(surveyId: number, survey: Partial<Survey>): Promise<Survey | null>`
- `deleteSurvey(surveyId: number): Promise<boolean>`
- `getSurveyByPassword(password: string): Promise<Survey | null>`

### Question Operations:

- `createQuestion(question: Question): Promise<Question>`
- `getQuestionsBySurveyId(surveyId: number): Promise<Question[]>`
- `updateQuestion(questionId: number, question: Partial<Question>): Promise<Question | null>`
- `deleteQuestion(questionId: number): Promise<boolean>`

### Participant Operations:

- `createParticipant(participant: SurveyParticipant): Promise<SurveyParticipant>`
- `getParticipantById(participantId: string): Promise<SurveyParticipant | null>`

### Answer Operations:

- `createAnswer(answer: Answer): Promise<Answer>`
- `getAnswersByQuestionId(questionId: number): Promise<Answer[]>`
- `getAnswersByParticipantId(participantId: string): Promise<Answer[]>`
- `getAnswersBySurveyId(surveyId: number): Promise<Answer[]>`

---

## 💼 Use Case (Lógica de Negocio)

**Archivo:** `src/domain/usecase/SurveyUseCase.ts`

### Características:

✅ **Validaciones de Negocio:**

- Validación de campos requeridos
- Validación de encuesta activa para participantes
- Validación de cantidad mínima de productos
- Validación de contraseña para acceso de participantes

✅ **Respuestas Consistentes:**

```typescript
interface Response<T> {
  data: T | null;
  ok: boolean;
  error?: string;
}
```

✅ **Métodos Principales:**

#### Survey:

- `createSurvey(survey)` - Crear encuesta
- `getSurveyById(id)` - Obtener por ID
- `getAllSurveys(adminId)` - Listar todas del admin
- `updateSurvey(id, updates)` - Actualizar
- `deleteSurvey(id)` - Eliminar (cascada)
- `getSurveyByPassword(password)` - Acceso de participantes

#### Question:

- `createQuestion(question)` - Crear pregunta
- `getQuestionsBySurveyId(surveyId)` - Listar por encuesta
- `updateQuestion(id, updates)` - Actualizar
- `deleteQuestion(id)` - Eliminar (cascada)

#### Participant:

- `createParticipant(participant)` - Crear participante
- `getParticipantById(id)` - Obtener por ID

#### Answer:

- `createAnswer(answer)` - Crear respuesta
- `getAnswersByQuestionId(questionId)` - Respuestas por pregunta
- `getAnswersByParticipantId(participantId)` - Respuestas por participante
- `getAnswersBySurveyId(surveyId)` - Todas las respuestas de una encuesta

---

## 🗄️ Repository (Implementación con Supabase)

**Archivo:** `src/infrastrucutre/supabse/SupabaseSurveyRepository.ts`

### Mapeo de Campos (snake_case ↔ camelCase):

| Entidad     | Campo BD         | Campo Dominio   |
| ----------- | ---------------- | --------------- |
| Survey      | `survey_id`      | `id`            |
| Survey      | `admin_id`       | `adminId`       |
| Survey      | `is_active`      | `isActive`      |
| Question    | `question_id`    | `id`            |
| Question    | `survey_id`      | `surveyId`      |
| Question    | `num_products`   | `numProducts`   |
| Participant | `participant_id` | `id`            |
| Answer      | `answer_id`      | `id`            |
| Answer      | `question_id`    | `questionId`    |
| Answer      | `participant_id` | `participantId` |

### Características:

✅ **Relaciones:**

- Survey → Questions (one-to-many)
- Question → Answers (one-to-many)
- Participant → Answers (one-to-many)

✅ **Queries con Joins:**

```typescript
// Obtener survey con sus preguntas
.select(`
  *,
  questions:question(*)
`)

// Obtener respuestas de una encuesta (through questions)
.select(`
  *,
  question!inner(survey_id)
`)
.eq("question.survey_id", surveyId)
```

✅ **Eliminación en Cascada:**

- Eliminar Survey → Elimina Questions → Elimina Answers
- Eliminar Question → Elimina Answers

---

## 🎬 Server Actions

**Archivo:** `src/app/actions/surveyActions.ts`

### Survey Actions:

```typescript
createSurveyAction(survey: Survey)
getSurveyByIdAction(surveyId: number)
getAllSurveysAction(adminId: string)
updateSurveyAction(surveyId: number, updates: Partial<Survey>)
deleteSurveyAction(surveyId: number)
getSurveyByPasswordAction(password: string)
```

### Question Actions:

```typescript
createQuestionAction(question: Question)
getQuestionsBySurveyIdAction(surveyId: number)
updateQuestionAction(questionId: number, updates: Partial<Question>)
deleteQuestionAction(questionId: number)
```

### Participant Actions:

```typescript
createParticipantAction(participant: SurveyParticipant)
getParticipantByIdAction(participantId: string)
```

### Answer Actions:

```typescript
createAnswerAction(answer: Answer)
getAnswersByQuestionIdAction(questionId: number)
getAnswersByParticipantIdAction(participantId: string)
getAnswersBySurveyIdAction(surveyId: number)
```

---

## 🎯 Flujos de Uso

### Flujo 1: Admin Crea Encuesta

```typescript
// 1. Crear encuesta
const surveyResult = await createSurveyAction({
  title: "Evaluación de Productos",
  description: "Encuesta para evaluar diseño de sillas",
  adminId: user.id,
  isActive: true,
  password: "survey2024",
});

// 2. Agregar preguntas
const question1 = await createQuestionAction({
  surveyId: surveyResult.survey!.id!,
  title: "¿Cuál silla es más cómoda?",
  description: "Evalúa la comodidad",
  numProducts: 3,
});

const question2 = await createQuestionAction({
  surveyId: surveyResult.survey!.id!,
  title: "¿Cuál diseño prefieres?",
  description: "Evalúa el diseño visual",
  numProducts: 3,
});
```

### Flujo 2: Participante Responde Encuesta

```typescript
// 1. Acceder con contraseña
const surveyResult = await getSurveyByPasswordAction("survey2024");

if (!surveyResult.ok) {
  alert("Encuesta no encontrada");
  return;
}

// 2. Crear participante
const participantResult = await createParticipantAction({
  name: "Juan Pérez",
  email: "juan@example.com",
});

// 3. Responder preguntas
for (const question of surveyResult.survey!.questions!) {
  await createAnswerAction({
    questionId: question.id!,
    participantId: participantResult.participant!.id!,
    comment: "Prefiero la opción B",
  });
}
```

### Flujo 3: Admin Ve Resultados

```typescript
// 1. Obtener todas las encuestas
const surveysResult = await getAllSurveysAction(adminId);

// 2. Seleccionar encuesta
const selectedSurvey = surveysResult.surveys[0];

// 3. Obtener todas las respuestas
const answersResult = await getAnswersBySurveyIdAction(selectedSurvey.id!);

// 4. Analizar resultados
const answersByQuestion = answersResult.answers.reduce((acc, answer) => {
  if (!acc[answer.questionId]) {
    acc[answer.questionId] = [];
  }
  acc[answer.questionId].push(answer);
  return acc;
}, {} as Record<number, Answer[]>);
```

---

## 🔐 Validaciones Implementadas

### Survey:

- ✅ Título requerido
- ✅ AdminId requerido
- ✅ Password requerida para acceso de participantes
- ✅ Verificación de encuesta activa

### Question:

- ✅ Título requerido
- ✅ SurveyId requerido
- ✅ numProducts >= 1

### Participant:

- ✅ Nombre requerido
- ✅ Email opcional

### Answer:

- ✅ QuestionId requerido
- ✅ ParticipantId requerido
- ✅ Comment opcional

---

## 📊 Esquema de Base de Datos Sugerido

```sql
-- Tabla survey
CREATE TABLE survey (
  survey_id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  password TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla question
CREATE TABLE question (
  question_id SERIAL PRIMARY KEY,
  survey_id INTEGER NOT NULL REFERENCES survey(survey_id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  num_products INTEGER NOT NULL CHECK (num_products > 0),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla survey_participant
CREATE TABLE survey_participant (
  participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla answer
CREATE TABLE answer (
  answer_id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES question(question_id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES survey_participant(participant_id),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX idx_question_survey ON question(survey_id);
CREATE INDEX idx_answer_question ON answer(question_id);
CREATE INDEX idx_answer_participant ON answer(participant_id);
CREATE INDEX idx_survey_admin ON survey(admin_id);
CREATE INDEX idx_survey_password ON survey(password);
```

---

## 🛡️ RLS (Row Level Security) Sugerido

```sql
-- Survey: Admin solo ve sus encuestas
CREATE POLICY "Users can view their own surveys"
  ON survey FOR SELECT
  USING (auth.uid() = admin_id);

CREATE POLICY "Users can create surveys"
  ON survey FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Users can update their own surveys"
  ON survey FOR UPDATE
  USING (auth.uid() = admin_id);

CREATE POLICY "Users can delete their own surveys"
  ON survey FOR DELETE
  USING (auth.uid() = admin_id);

-- Question: A través del survey_id
CREATE POLICY "Users can view questions of their surveys"
  ON question FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM survey
      WHERE survey.survey_id = question.survey_id
      AND survey.admin_id = auth.uid()
    )
  );

-- Answer: Participantes pueden crear, admin puede ver
CREATE POLICY "Anyone can create answers"
  ON answer FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view answers of their surveys"
  ON answer FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM question
      JOIN survey ON survey.survey_id = question.survey_id
      WHERE question.question_id = answer.question_id
      AND survey.admin_id = auth.uid()
    )
  );

-- Participant: Público para crear, restringido para ver
CREATE POLICY "Anyone can create participants"
  ON survey_participant FOR INSERT
  WITH CHECK (true);
```

---

## 🧪 Ejemplo de Uso Completo

```typescript
// components/SurveyManager.tsx
"use client";

import { useState, useEffect } from "react";
import {
  createSurveyAction,
  getAllSurveysAction,
  createQuestionAction,
} from "../app/actions/surveyActions";

export default function SurveyManager({ adminId }: { adminId: string }) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    const result = await getAllSurveysAction(adminId);
    if (result.ok) {
      setSurveys(result.surveys);
    }
    setLoading(false);
  };

  const handleCreateSurvey = async () => {
    const result = await createSurveyAction({
      title: "Nueva Encuesta",
      description: "Descripción",
      adminId,
      isActive: true,
      password: "test123",
    });

    if (result.ok) {
      alert("Encuesta creada!");
      loadSurveys();
    }
  };

  return (
    <div>
      <button onClick={handleCreateSurvey}>Crear Encuesta</button>
      {surveys.map((survey) => (
        <div key={survey.id}>
          <h3>{survey.title}</h3>
          <p>{survey.description}</p>
          <p>{survey.questions?.length || 0} preguntas</p>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Checklist de Implementación

- [x] Port (ISurveyRepository)
- [x] Use Case (SurveyUseCase)
- [x] Repository (SupabaseSurveyRepository)
- [x] Server Actions (surveyActions.ts)
- [x] Validaciones de negocio
- [x] Manejo de errores
- [x] Mappers (DB ↔ Domain)
- [x] 0 errores de TypeScript
- [ ] Crear tablas en Supabase
- [ ] Configurar RLS
- [ ] Crear componentes UI
- [ ] Tests unitarios

---

## 📝 Próximos Pasos

1. **Crear Tablas en Supabase:**

   - Ejecutar script SQL de creación de tablas
   - Verificar relaciones y cascadas

2. **Configurar RLS:**

   - Aplicar políticas de seguridad
   - Probar acceso de admin y participantes

3. **Crear Componentes UI:**

   - `SurveyManager` - CRUD de encuestas
   - `QuestionEditor` - Editor de preguntas
   - `SurveyTaker` - Formulario para participantes
   - `ResultsViewer` - Visualización de resultados

4. **Testing:**
   - Tests unitarios de Use Cases
   - Tests de integración con Supabase
   - Tests E2E de flujos completos

---

## 🎉 Conclusión

Sistema completo de encuestas implementado siguiendo Clean Architecture con:

- ✅ Separación de responsabilidades
- ✅ Validaciones robustas
- ✅ Manejo de errores consistente
- ✅ TypeScript estricto
- ✅ Listo para integrar con UI

# 📋 Guía de Creación de Encuestas

## Resumen

Sistema completo para crear encuestas con selección de productos 3D y preguntas personalizadas.

## 🎯 Características Principales

### ✅ Paso 1: Información y Productos

1. **Información Básica:**

   - Título de la encuesta
   - Descripción del propósito
   - Contraseña de acceso para participantes

2. **Selección de Productos:**
   - Vista de todos los productos disponibles del usuario
   - Selección múltiple mediante checkboxes
   - Vista previa con nombre y descripción
   - Contador de productos seleccionados

### ✅ Paso 2: Preguntas

1. **Gestión de Preguntas:**

   - Agregar múltiples preguntas
   - Eliminar preguntas individuales
   - Título y descripción por pregunta

2. **Asignación de Productos por Pregunta:**

   - Seleccionar qué productos mostrar en cada pregunta
   - Subset de los productos previamente seleccionados
   - Vista en grid con checkboxes

3. **Configuración de Comentarios:**
   - Toggle para permitir/deshabilitar comentarios
   - Activado por defecto

## 🏗️ Arquitectura

### Componente Principal

**`CreateSurveyWizard.tsx`** - Wizard de 2 pasos

```typescript
interface CreateSurveyWizardProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

### Estado del Formulario

```typescript
// Información de la encuesta
const [surveyTitle, setSurveyTitle] = useState("");
const [surveyDescription, setSurveyDescription] = useState("");
const [surveyPassword, setSurveyPassword] = useState("");
const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

// Preguntas
interface QuestionForm {
  tempId: string;
  title: string;
  description: string;
  selectedProductIds: string[];
  allowComments: boolean;
}
```

## 📊 Flujo de Creación

```
1. Usuario accede a /surveys
   ↓
2. Click en "Nueva Encuesta"
   ↓
3. [PASO 1] Completa información básica
   ↓
4. [PASO 1] Selecciona productos disponibles
   ↓
5. Click "Siguiente: Crear Preguntas"
   ↓
6. [PASO 2] Agrega preguntas
   ↓
7. [PASO 2] Por cada pregunta:
   - Define título y descripción
   - Selecciona productos a mostrar
   - Configura comentarios
   ↓
8. Click "Crear Encuesta"
   ↓
9. Backend crea:
   - Survey en tabla survey
   - Relaciones en survey_product
   - Questions en tabla question
   - Relaciones en question_product
   ↓
10. Redirect a lista de encuestas
```

## 🔧 Validaciones

### Paso 1 (canGoToStep2):

- ✅ Título no vacío
- ✅ Descripción no vacía
- ✅ Contraseña no vacía
- ✅ Al menos 1 producto seleccionado

### Paso 2 (canSubmit):

- ✅ Al menos 1 pregunta creada
- ✅ Todas las preguntas con título
- ✅ Todas las preguntas con descripción
- ✅ Todas las preguntas con al menos 1 producto

## 🎨 UI/UX

### Indicadores de Progreso

- Barra de progreso en 2 pasos
- Labels descriptivos debajo de la barra
- Color azul para pasos completados

### Estados de Carga

- Spinner al cargar productos
- Spinner al crear encuesta
- Botón deshabilitado durante creación

### Feedback Visual

- Checkboxes para selecciones
- Bordes de colores:
  - Azul: Productos seleccionados para encuesta
  - Verde: Productos seleccionados para pregunta
- Contador de seleccionados
- Mensajes de éxito/error con alert

## 📡 Server Actions Utilizadas

```typescript
// Cargar datos
getAllProductsAction(); // Obtener productos del usuario

// Crear encuesta
createSurveyAction(surveyData);
assignProductsToSurveyAction(surveyId, productIds);

// Crear preguntas
createQuestionAction(questionData);
assignProductsToQuestionAction(questionId, productIds);

// Ver encuestas
getAllSurveysAction(userId);
```

## 🗄️ Estructura de Base de Datos

### Tablas Involucradas

**survey**

- survey_id (PK)
- title
- description
- password
- admin_id (FK → admin)
- is_active

**question**

- question_id (PK)
- survey_id (FK → survey)
- title
- description
- num_products

**survey_product** (Junction)

- survey_id (FK)
- product_id (FK)

**question_product** (Junction)

- question_id (FK)
- product_id (FK)

## 💡 Ejemplo de Uso

### Caso: Evaluación de Diseño de Sillas

**Paso 1:**

```
Título: "Evaluación de Diseño de Sillas Ergonómicas"
Descripción: "Ayúdanos a elegir el mejor diseño"
Contraseña: "sillas2024"
Productos: [Silla A, Silla B, Silla C, Silla D]
```

**Paso 2:**

```
Pregunta 1:
  Título: "¿Cuál diseño te parece más cómodo?"
  Descripción: "Considera la forma del respaldo"
  Productos: [Silla A, Silla B]
  Comentarios: ✅

Pregunta 2:
  Título: "¿Cuál color prefieres?"
  Descripción: "Piensa en ambientes de oficina"
  Productos: [Silla C, Silla D]
  Comentarios: ✅
```

**Resultado:**

- 1 encuesta creada
- 4 relaciones survey_product
- 2 preguntas creadas
- 4 relaciones question_product (2 por pregunta)

## 🚀 Siguientes Pasos

### Funcionalidades Pendientes

1. **Vista de Participante:**

   - Página pública para tomar encuestas
   - Ingreso con contraseña
   - Visualización de modelos 3D KeyShot XR
   - Selección de producto favorito
   - Cuadro de comentarios

2. **Resultados y Analytics:**

   - Dashboard de resultados por encuesta
   - Gráficos de productos más votados
   - Exportación de comentarios
   - Filtros por pregunta

3. **Gestión Avanzada:**
   - Editar encuestas existentes
   - Activar/desactivar encuestas
   - Duplicar encuestas
   - Eliminar encuestas

## 🔐 Seguridad

- ✅ Middleware protege /surveys
- ✅ Server Actions verifican userId
- ✅ Solo el admin creador puede gestionar encuesta
- ✅ Contraseña requerida para acceso público (futuro)

## 📝 Notas Técnicas

### Performance

- Carga de productos en paralelo
- IDs temporales (temp-${Date.now()}) para preguntas antes de guardar
- Batch operations para asignaciones

### TypeScript

- Interfaces completas para type safety
- Props opcionales con ?
- Estados tipados con genéricos

### React Patterns

- Hooks personalizados (loadUser, loadSurveys)
- Controlled components para forms
- Conditional rendering por paso
- Callback props (onSuccess, onCancel)

---

**Última actualización:** 3 de noviembre de 2025
**Versión:** 1.0
**Estado:** ✅ Implementado y funcional

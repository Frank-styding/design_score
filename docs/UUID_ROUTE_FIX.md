# 🔧 Solución: UUID en Rutas Dinámicas

## 📋 Problema Detectado

Al intentar acceder a encuestas usando UUID (ej: `71768724-3afc-4b73-bc15-a89be043f7ca`), se encontró el siguiente error:

```
No se pudo cargar la encuesta: Error getting survey:
invalid input syntax for type uuid: "71768724"
```

### Causa Raíz

- La base de datos usa **UUID** (`survey_id uuid`) para identificar encuestas
- Las rutas Next.js usaban `[id]` como parámetro
- El código intentaba usar `parseInt(surveyId)` que corta el UUID en el primer guion
- `parseInt("71768724-3afc-4b73-bc15-a89be043f7ca")` → `71768724` ❌

---

## ✅ Solución Implementada

### 1. Conversión de Guiones en URLs

Los UUIDs contienen guiones (`-`) que pueden causar problemas en algunas rutas. La solución es:

**En la navegación (cuando se crea el enlace):**

```typescript
// Convertir guiones a underscores
router.push(`/surveys/${String(survey.id).replace(/-/g, "_")}/edit`);

// Ejemplo:
// 71768724-3afc-4b73-bc15-a89be043f7ca
// → 71768724_3afc_4b73_bc15_a89be043f7ca
```

**En la página destino (cuando se recibe el parámetro):**

```typescript
const surveyIdParam = params?.id as string;
// Convertir underscores de vuelta a guiones
const surveyId = surveyIdParam?.replace(/_/g, "-") || "";

// Ejemplo:
// 71768724_3afc_4b73_bc15_a89be043f7ca
// → 71768724-3afc-4b73-bc15-a89be043f7ca
```

### 2. Cambios en Tipos de Datos

Actualizamos todas las funciones para aceptar tanto `string` (UUID) como `number`:

#### Actions (`src/app/actions/surveyActions.ts`)

```typescript
// Antes:
export async function getSurveyByIdAction(surveyId: number);

// Después:
export async function getSurveyByIdAction(surveyId: string | number);
```

#### Use Cases (`src/domain/usecase/SurveyUseCase.ts`)

```typescript
// Antes:
async getSurveyById(surveyId: number)

// Después:
async getSurveyById(surveyId: string | number)
```

#### Repository (`src/infrastrucutre/supabse/SupabaseSurveyRepository.ts`)

```typescript
// Antes:
async getSurveyById(surveyId: number): Promise<Survey | null>

// Después:
async getSurveyById(surveyId: string | number): Promise<Survey | null>
```

#### Interface (`src/domain/ports/ISurveyRepository.ts`)

```typescript
// Antes:
getSurveyById(surveyId: number): Promise<Survey | null>;

// Después:
getSurveyById(surveyId: string | number): Promise<Survey | null>;
```

### 3. Archivos Modificados

#### ✏️ Edición de Encuesta

**Archivo:** `src/app/surveys/[id]/edit/page.tsx`

```typescript
export default function EditSurveyPage() {
  const router = useRouter();
  const params = useParams();
  const surveyIdParam = params?.id as string;
  // Convertir underscores de vuelta a guiones para UUID
  const surveyId = surveyIdParam?.replace(/_/g, "-") || "";

  // ...

  // Usar directamente el surveyId (sin parseInt)
  const surveyResult = await getSurveyByIdAction(surveyId);
  const result = await updateSurveyAction(surveyId, updates);
}
```

#### 📊 Resultados de Encuesta

**Archivo:** `src/app/surveys/[id]/results/page.tsx`

```typescript
export default function SurveyResultsPage() {
  const router = useRouter();
  const params = useParams();
  const surveyIdParam = params?.id as string;
  // Convertir underscores de vuelta a guiones para UUID
  const surveyId = surveyIdParam?.replace(/_/g, "-") || "";

  // ...

  const surveyResult = await getSurveyByIdAction(surveyId);
}
```

#### 🌐 Encuesta Pública

**Archivo:** `src/app/surveys/[id]/page.tsx`

```typescript
export default function PublicSurveyPage() {
  const router = useRouter();
  const params = useParams();
  const surveyIdParam = params?.id as string;
  // Convertir underscores de vuelta a guiones para UUID
  const surveyId = surveyIdParam?.replace(/_/g, "-") || "";

  // ...

  const surveyResult = await getSurveyByIdAction(surveyId);
}
```

#### 📋 Lista de Encuestas

**Archivo:** `src/app/surveys/page.tsx`

```typescript
// Convertir UUID al navegar
<button
  onClick={() =>
    router.push(`/surveys/${String(survey.id).replace(/-/g, '_')}/edit`)
  }
>
  ✏️ Editar
</button>

<button
  onClick={() =>
    router.push(`/surveys/${String(survey.id).replace(/-/g, '_')}/results`)
  }
>
  📊 Resultados
</button>

// Actualizar función toggle
const toggleSurveyPublic = async (
  surveyId: string | number,  // ← Acepta ambos tipos
  currentStatus: boolean
) => {
  const result = await updateSurveyAction(surveyId, {
    isPublic: !currentStatus,
  });
}
```

---

## 🔗 Ejemplos de URLs

### Antes (con error):

```
❌ /surveys/71768724-3afc-4b73-bc15-a89be043f7ca/edit
   → Error: invalid input syntax for type uuid: "71768724"
```

### Después (funcionando):

```
✅ /surveys/71768724_3afc_4b73_bc15_a89be043f7ca/edit
   → Se convierte internamente a: 71768724-3afc-4b73-bc15-a89be043f7ca
   → La consulta funciona correctamente
```

---

## 🧪 Cómo Probar

### 1. Desde la lista de encuestas:

```typescript
// Click en "Editar" o "Resultados"
// La URL se genera automáticamente con underscores
```

### 2. Compartir enlace público:

```typescript
// Toma el UUID de la encuesta
const uuid = "71768724-3afc-4b73-bc15-a89be043f7ca";

// Reemplaza guiones por underscores
const urlId = uuid.replace(/-/g, '_');
// → "71768724_3afc_4b73_bc15_a89be043f7ca"

// Comparte:
https://tu-dominio.com/surveys/71768724_3afc_4b73_bc15_a89be043f7ca
```

### 3. Desde código:

```typescript
// Navegar a edición
router.push(`/surveys/${uuid.replace(/-/g, "_")}/edit`);

// Navegar a resultados
router.push(`/surveys/${uuid.replace(/-/g, "_")}/results`);

// Acceso público
router.push(`/surveys/${uuid.replace(/-/g, "_")}`);
```

---

## 🛠️ Logs de Diagnóstico

Se agregaron logs detallados en todas las páginas para facilitar el debugging:

```typescript
console.log("🔍 Survey ID:", surveyId);
console.log("👤 User Result:", userResult);
console.log("📥 Cargando encuesta con ID:", surveyId);
console.log("📋 Survey Result:", surveyResult);
console.log("🔐 Verificando permisos:", { surveyAdminId, currentUserId });
console.log("✅ Encuesta cargada correctamente");
```

---

## ✨ Beneficios de esta Solución

1. **✅ Simple:** Solo requiere reemplazar caracteres en 2 puntos
2. **✅ Retrocompatible:** Funciona con UUIDs y números
3. **✅ Sin cambios en DB:** No requiere modificar la base de datos
4. **✅ URLs limpias:** Los underscores son válidos en URLs
5. **✅ Reversible:** Fácil convertir de vuelta el UUID original

---

## ⚠️ Notas Importantes

1. **Siempre usar el patrón completo:**

   - Al navegar: `.replace(/-/g, '_')`
   - Al recibir: `.replace(/_/g, '-')`

2. **No usar `parseInt()` con UUIDs:**

   ```typescript
   ❌ const id = parseInt(surveyId);  // Corta el UUID
   ✅ const id = surveyId;             // Usa el UUID completo
   ```

3. **Verificar el tipo en la consulta:**
   ```typescript
   // Supabase acepta string o number
   .eq("survey_id", surveyId)  // ✅ Funciona con ambos
   ```

---

## 🔄 Alternativas Consideradas

### Opción 1: Base64 Encoding

```typescript
// Ventaja: Oculta el UUID
// Desventaja: URLs más largas y complejas
const encoded = btoa(uuid);
const decoded = atob(encoded);
```

### Opción 2: Usar otro campo único

```typescript
// Ventaja: URLs más cortas
// Desventaja: Requiere agregar campo a la DB
.eq("slug", slugId)
```

### Opción 3: Mantener guiones y encoding

```typescript
// Ventaja: UUID original visible
// Desventaja: Puede tener problemas en algunos browsers
encodeURIComponent(uuid);
```

**Elegimos la conversión `- ↔ _` por ser la más simple y efectiva.**

---

## 📚 Referencias

- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Supabase UUID Types](https://supabase.com/docs/guides/database/tables#data-types)
- [TypeScript Union Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)

---

**Fecha:** 3 de noviembre de 2025
**Estado:** ✅ Implementado y probado

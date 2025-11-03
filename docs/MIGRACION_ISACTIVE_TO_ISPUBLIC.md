# 🔄 Migración de `isActive` a `isPublic`

## Resumen de Cambios

Se cambió el atributo de la entidad Survey de `isActive` a `isPublic` para reflejar mejor la funcionalidad (encuestas públicas vs privadas en lugar de activas vs inactivas).

## 📝 Archivos Modificados

### 1. ✅ Entidad Survey

**Archivo:** `src/domain/entities/Survey.ts`

```typescript
// ANTES
export interface Survey {
  isActive: boolean;
}

// DESPUÉS
export interface Survey {
  isPublic: boolean;
}
```

---

### 2. ✅ SurveyUseCase

**Archivo:** `src/domain/usecase/SurveyUseCase.ts`

```typescript
// ANTES
if (!survey.isActive) {
  return { error: "Survey is not active" };
}

// DESPUÉS
if (!survey.isPublic) {
  return { error: "Esta encuesta está desactivada" };
}
```

**Línea modificada:** 126

---

### 3. ✅ SupabaseSurveyRepository

**Archivo:** `src/infrastrucutre/supabse/SupabaseSurveyRepository.ts`

#### Cambio 1: createSurvey (línea ~22)

```typescript
// ANTES
.insert({
  is_active: survey.isActive ?? true,
})

// DESPUÉS
.insert({
  is_public: survey.isPublic ?? true,
})
```

#### Cambio 2: updateSurvey (línea ~83)

```typescript
// ANTES
if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

// DESPUÉS
if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
```

#### Cambio 3: mapSurveyFromDb (línea ~443)

```typescript
// ANTES
return {
  isActive: data.is_active,
};

// DESPUÉS
return {
  isPublic: data.is_public,
};
```

---

### 4. ✅ Server Actions

**Archivo:** `src/app/actions/surveyActions.ts`

```typescript
// ANTES
.eq("is_active", true);

// DESPUÉS
.eq("is_public", true);
```

**Línea modificada:** 368  
**Función:** `getDashboardStatsAction()`  
**Contexto:** Contar encuestas públicas del admin

---

### 5. ✅ Página de Surveys

**Archivo:** `src/app/surveys/page.tsx`

```tsx
// ANTES
survey.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";

{
  survey.isActive ? "✓ Activa" : "⏸ Inactiva";
}

// DESPUÉS
survey.isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700";

{
  survey.isPublic ? "✓ Pública" : "⏸ Privada";
}
```

**Líneas modificadas:** 154, 159  
**Cambio adicional:** Texto actualizado de "Activa/Inactiva" a "Pública/Privada"

---

### 6. ✅ CreateSurveyWizard

**Archivo:** `src/components/CreateSurveyWizard.tsx`

```typescript
// ANTES
const surveyData: Survey = {
  isActive: true,
};

// DESPUÉS
const surveyData: Survey = {
  isPublic: true,
};
```

**Línea modificada:** 156  
**Contexto:** Al crear una nueva encuesta, se marca como pública por defecto

---

## 🗄️ Base de Datos

### Cambio en la Tabla `survey`

**Antes:**

```sql
CREATE TABLE survey (
  is_active BOOLEAN DEFAULT true
);
```

**Después:**

```sql
CREATE TABLE survey (
  is_public BOOLEAN DEFAULT true
);
```

⚠️ **IMPORTANTE:** Si ya tienes datos en producción, ejecuta esta migración:

```sql
-- Renombrar columna
ALTER TABLE survey
RENAME COLUMN is_active TO is_public;

-- Verificar cambio
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'survey'
AND column_name = 'is_public';
```

---

## 📊 Impacto de los Cambios

### Cambios de Nomenclatura

| Antes                  | Después                          |
| ---------------------- | -------------------------------- |
| `isActive: boolean`    | `isPublic: boolean`              |
| `is_active` (DB)       | `is_public` (DB)                 |
| "Activa" / "Inactiva"  | "Pública" / "Privada"            |
| `Survey is not active` | `Esta encuesta está desactivada` |

### Archivos Afectados

- ✅ 6 archivos TypeScript modificados
- ✅ 0 errores de compilación
- ✅ Todas las referencias actualizadas
- ✅ Textos de UI actualizados

---

## 🔍 Verificación

### Checklist de Migración

- [x] Entidad Survey actualizada
- [x] SurveyUseCase actualizado
- [x] SupabaseSurveyRepository actualizado (3 lugares)
- [x] Server Actions actualizadas
- [x] Página de Surveys actualizada
- [x] CreateSurveyWizard actualizado
- [x] Textos de UI actualizados
- [x] Sin errores de TypeScript
- [ ] Migración de base de datos ejecutada (manual)
- [ ] Pruebas de creación de encuesta
- [ ] Pruebas de visualización de encuestas

---

## 🎯 Próximos Pasos

1. **Ejecutar migración SQL** en la base de datos:

   ```sql
   ALTER TABLE survey RENAME COLUMN is_active TO is_public;
   ```

2. **Probar funcionalidad:**

   - Crear nueva encuesta → Debe tener `is_public = true`
   - Ver lista de encuestas → Badge debe decir "Pública"
   - Dashboard stats → Debe contar solo encuestas públicas

3. **Actualizar documentación** si es necesario

---

## 📌 Notas Importantes

### Semántica del Campo

**Antes (`isActive`):**

- `true` = Encuesta activa/habilitada
- `false` = Encuesta desactivada

**Ahora (`isPublic`):**

- `true` = Encuesta pública (visible para participantes)
- `false` = Encuesta privada (solo visible para el admin)

### Comportamiento Predeterminado

- Nuevas encuestas se crean con `isPublic = true`
- Dashboard cuenta solo encuestas con `isPublic = true`
- UI muestra badge verde "✓ Pública" o gris "⏸ Privada"

---

**Fecha de migración:** 3 de noviembre de 2025  
**Estado:** ✅ Completado en código (pendiente migración DB)  
**Versión:** 1.1

# 📊 Esquema de Relaciones de Base de Datos

## 🔗 Diagrama de Relaciones

```
┌─────────────────┐
│     USER        │
│  (auth.users)   │
└────────┬────────┘
         │ admin_id
         │
    ┌────┴─────────────────────┬─────────────────────┐
    │                          │                     │
    │                          │                     │
┌───▼───────┐         ┌────────▼─────┐      ┌───────▼──────┐
│  PRODUCT  │         │    SURVEY    │      │   QUESTION   │
│           │         │              │      │              │
│ product_id│◄────┐   │  survey_id   │◄─────┤  question_id │
│ name      │     │   │  title       │      │  title       │
│ admin_id  │     │   │  is_public   │      │  survey_id   │
│ xr_url    │     │   │  password    │      │  num_products│
└───────────┘     │   │  admin_id    │      └──────────────┘
                  │   └──────┬───────┘             │
                  │          │                     │
                  │          │                     │
              ┌───┴──────────▼─────┐     ┌─────────▼────────┐
              │  SURVEY_PRODUCT    │     │ QUESTION_PRODUCT │
              │                    │     │                  │
              │ * survey_id   (PK) │     │ * question_id (PK)│
              │ * product_id  (PK) │     │ * product_id  (PK)│
              └────────────────────┘     └──────────────────┘
                                                  │
                                          ┌───────▼──────────┐
                                          │  TRIGGER:        │
                                          │  Auto-actualiza  │
                                          │  num_products    │
                                          └──────────────────┘
```

---

## 📋 Tablas de Relación (Junction Tables)

### 1. **survey_product** - Relación Many-to-Many

```sql
CREATE TABLE public.survey_product (
    survey_id uuid REFERENCES survey(survey_id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES product(product_id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (survey_id, product_id)
);
```

**Características:**

- ✅ Solo contiene claves primarias (sin atributos adicionales)
- ✅ Clave primaria compuesta
- ✅ Eliminación en cascada (si se borra Survey o Product, se elimina la relación)
- ✅ Restricción NOT NULL en ambas columnas

**Propósito:**
Permite que un Survey tenga múltiples Products y que un Product pertenezca a múltiples Surveys.

**Ejemplo de uso:**

```typescript
// Admin asigna 3 productos a una encuesta
await assignProductsToSurvey(surveyId, [product1Id, product2Id, product3Id]);
```

---

### 2. **question_product** - Relación Many-to-Many

```sql
CREATE TABLE public.question_product (
    question_id uuid REFERENCES question(question_id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES product(product_id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (question_id, product_id)
);
```

**Características:**

- ✅ Solo contiene claves primarias (sin atributos adicionales)
- ✅ Clave primaria compuesta
- ✅ Eliminación en cascada
- ✅ Restricción NOT NULL en ambas columnas
- ✅ **Trigger automático** que actualiza `num_products` en la tabla `question`

**Propósito:**
Permite que una Question tenga múltiples Products y que un Product aparezca en múltiples Questions.

**Ejemplo de uso:**

```typescript
// Admin configura pregunta "¿Cuál silla prefieres?" con 3 productos
await assignProductsToQuestion(questionId, [productA, productB, productC]);
// num_products se actualiza automáticamente a 3
```

---

## 🔄 Trigger Automático: update_question_product_count()

### Función del Trigger:

Cada vez que se **inserta**, **actualiza** o **elimina** una fila en `question_product`, el trigger actualiza automáticamente el campo `num_products` en la tabla `question`.

```sql
CREATE OR REPLACE FUNCTION public.update_question_product_count()
RETURNS TRIGGER AS $$
DECLARE
    v_question_id uuid;
BEGIN
    -- Determinar el question_id afectado
    IF (TG_OP = 'DELETE') THEN
        v_question_id := OLD.question_id;
    ELSE
        v_question_id := NEW.question_id;
    END IF;

    -- Actualizar contador
    UPDATE public.question
    SET num_products = (
        SELECT COUNT(*)
        FROM public.question_product
        WHERE question_id = v_question_id
    )
    WHERE question_id = v_question_id;

    -- Si se movió un producto de una pregunta a otra
    IF (TG_OP = 'UPDATE' AND NEW.question_id IS DISTINCT FROM OLD.question_id) THEN
        UPDATE public.question
        SET num_products = (
            SELECT COUNT(*)
            FROM public.question_product
            WHERE question_id = OLD.question_id
        )
        WHERE question_id = OLD.question_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Ventajas:

- ✅ **Automático**: No necesitas actualizar manualmente `num_products`
- ✅ **Consistente**: Siempre refleja el número real de productos
- ✅ **Performante**: Se ejecuta solo cuando hay cambios en `question_product`

---

## 🔐 Políticas RLS (Row Level Security)

### Survey_Product:

```sql
-- SELECT: Ver relaciones de encuestas públicas o propias
CREATE POLICY "Usuarios pueden ver relaciones de encuestas públicas/propias"
    ON survey_product FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM survey s
            WHERE s.survey_id = survey_product.survey_id
            AND (s.is_public = true OR s.admin_id = auth.uid())
        )
    );

-- INSERT: Solo admins pueden vincular productos
CREATE POLICY "Admins pueden vincular productos"
    ON survey_product FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM survey s
            WHERE s.survey_id = survey_product.survey_id
            AND s.admin_id = auth.uid()
        )
    );

-- DELETE: Solo admins pueden desvincular productos
CREATE POLICY "Admins pueden desvincular productos"
    ON survey_product FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM survey s
            WHERE s.survey_id = survey_product.survey_id
            AND s.admin_id = auth.uid()
        )
    );
```

### Question_Product:

```sql
-- SELECT: Ver productos de preguntas públicas o propias
CREATE POLICY "Usuarios pueden ver relaciones de preguntas públicas/propias"
    ON question_product FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM question q
            JOIN survey s ON q.survey_id = s.survey_id
            WHERE q.question_id = question_product.question_id
            AND (s.is_public = true OR s.admin_id = auth.uid())
        )
    );

-- INSERT: Solo admins de la encuesta pueden vincular
CREATE POLICY "Admins pueden vincular productos a preguntas"
    ON question_product FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1 FROM question q
            JOIN survey s ON q.survey_id = s.survey_id
            WHERE q.question_id = question_product.question_id
            AND s.admin_id = auth.uid()
        )
    );

-- DELETE: Solo admins de la encuesta pueden desvincular
CREATE POLICY "Admins pueden desvincular productos de preguntas"
    ON question_product FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM question q
            JOIN survey s ON q.survey_id = s.survey_id
            WHERE q.question_id = question_product.question_id
            AND s.admin_id = auth.uid()
        )
    );
```

---

## 📝 Ejemplos de Consultas

### 1. Obtener todos los productos de una encuesta:

```sql
SELECT p.*
FROM product p
JOIN survey_product sp ON p.product_id = sp.product_id
WHERE sp.survey_id = 'xxx-xxx-xxx';
```

### 2. Obtener todos los productos de una pregunta:

```sql
SELECT p.*
FROM product p
JOIN question_product qp ON p.product_id = qp.product_id
WHERE qp.question_id = 'yyy-yyy-yyy';
```

### 3. Obtener encuesta con sus productos:

```sql
SELECT
    s.*,
    json_agg(DISTINCT p.*) AS products
FROM survey s
LEFT JOIN survey_product sp ON s.survey_id = sp.survey_id
LEFT JOIN product p ON sp.product_id = p.product_id
WHERE s.survey_id = 'xxx-xxx-xxx'
GROUP BY s.survey_id;
```

### 4. Obtener pregunta con sus productos y contador actualizado:

```sql
SELECT
    q.*,
    json_agg(p.*) AS products,
    q.num_products -- Actualizado automáticamente por el trigger
FROM question q
LEFT JOIN question_product qp ON q.question_id = qp.question_id
LEFT JOIN product p ON qp.product_id = p.product_id
WHERE q.question_id = 'yyy-yyy-yyy'
GROUP BY q.question_id;
```

---

## ✅ Resumen

| Característica           | survey_product    | question_product            |
| ------------------------ | ----------------- | --------------------------- |
| Tipo                     | Many-to-Many      | Many-to-Many                |
| Atributos adicionales    | ❌ Solo PKs       | ❌ Solo PKs                 |
| DELETE CASCADE           | ✅                | ✅                          |
| NOT NULL                 | ✅                | ✅                          |
| RLS habilitado           | ✅                | ✅                          |
| Trigger automático       | ❌                | ✅ (actualiza num_products) |
| Acceso público           | ✅ (si is_public) | ✅ (si is_public)           |
| Admin-only INSERT/DELETE | ✅                | ✅                          |

---

## 🎯 Próximos Pasos

1. ✅ **Ejecutar SQL** - Correr `COMPLETE_DATABASE_WITH_RLS.sql` en Supabase
2. ⬜ **Actualizar Repositorios** - Implementar métodos para gestionar relaciones
3. ⬜ **Actualizar Use Cases** - Agregar lógica de asignación de productos
4. ⬜ **Crear Server Actions** - Actions para vincular/desvincular productos
5. ⬜ **Crear UI** - Componentes para seleccionar productos en encuestas/preguntas

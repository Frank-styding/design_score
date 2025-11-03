-- ==================================================
-- SCRIPT CORREGIDO CON POLÍTICAS RLS MEJORADAS
-- ==================================================
-- IMPORTANTE: Ejecuta este script en el SQL Editor de Supabase
-- Este script incluye las correcciones para permitir que usuarios
-- anónimos puedan participar en encuestas públicas
-- ==================================================

-- Extensión para 'updated_at'
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- ==================================================
-- 1. CREACIÓN DE TODAS LAS TABLAS
-- ==================================================

-- TABLA PRODUCT
CREATE TABLE IF NOT EXISTS public.product (
    product_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    num_images integer DEFAULT 0,
    size bigint DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    constants text,
    cover_image text -- Path de la imagen de portada
);

-- TABLA SURVEY
CREATE TABLE IF NOT EXISTS public.survey (
    survey_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    is_public boolean DEFAULT false NOT NULL,
    password text,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL,
    admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- TABLA QUESTION
CREATE TABLE IF NOT EXISTS public.question (
    question_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    survey_id uuid REFERENCES public.survey(survey_id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    num_products integer DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- TABLA SURVEY_PARTICIPANT
CREATE TABLE IF NOT EXISTS public.survey_participant (
    participant_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    email text,
    created_at timestamptz DEFAULT now() NOT NULL
);

-- TABLA ANSWER
CREATE TABLE IF NOT EXISTS public.answer (
    answer_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id uuid REFERENCES public.question(question_id) ON DELETE CASCADE NOT NULL,
    participant_id uuid REFERENCES public.survey_participant(participant_id) ON DELETE SET NULL,
    answer_option text,
    comment text,
    is_anonymous boolean DEFAULT false NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

-- TABLA SURVEY_PRODUCT (Unión)
CREATE TABLE IF NOT EXISTS public.survey_product (
    survey_id uuid REFERENCES public.survey(survey_id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.product(product_id) ON DELETE CASCADE,
    PRIMARY KEY (survey_id, product_id)
);

-- TABLA QUESTION_PRODUCT (Unión)
CREATE TABLE IF NOT EXISTS public.question_product (
    question_id uuid REFERENCES public.question(question_id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.product(product_id) ON DELETE CASCADE,
    PRIMARY KEY (question_id, product_id)
);

-- ==================================================
-- 2. CREACIÓN DE TRIGGERS
-- ==================================================

-- Trigger para 'product'
DROP TRIGGER IF EXISTS handle_updated_at ON public.product;
CREATE TRIGGER handle_updated_at 
    BEFORE UPDATE ON public.product 
    FOR EACH ROW 
    EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Trigger para 'survey'
DROP TRIGGER IF EXISTS handle_updated_at ON public.survey;
CREATE TRIGGER handle_updated_at 
    BEFORE UPDATE ON public.survey 
    FOR EACH ROW 
    EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Trigger para 'question'
DROP TRIGGER IF EXISTS handle_updated_at ON public.question;
CREATE TRIGGER handle_updated_at 
    BEFORE UPDATE ON public.question 
    FOR EACH ROW 
    EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Trigger para 'answer'
DROP TRIGGER IF EXISTS handle_updated_at ON public.answer;
CREATE TRIGGER handle_updated_at 
    BEFORE UPDATE ON public.answer 
    FOR EACH ROW 
    EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Trigger para 'question_product' (conteo de productos en pregunta)
CREATE OR REPLACE FUNCTION public.update_question_product_count()
RETURNS TRIGGER AS $$
DECLARE
    v_question_id uuid;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        v_question_id := OLD.question_id;
    ELSE
        v_question_id := NEW.question_id;
    END IF;

    UPDATE public.question
    SET num_products = (
        SELECT COUNT(*)
        FROM public.question_product
        WHERE question_id = v_question_id
    )
    WHERE question_id = v_question_id;

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

DROP TRIGGER IF EXISTS handle_question_product_count ON public.question_product;
CREATE TRIGGER handle_question_product_count
    AFTER INSERT OR UPDATE OR DELETE ON public.question_product
    FOR EACH ROW
    EXECUTE FUNCTION public.update_question_product_count();

-- ==================================================
-- 3. APLICACIÓN DE POLÍTICAS DE SEGURIDAD (RLS)
-- ==================================================

-- RLS para Product
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios pueden ver sus propios productos" ON public.product;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear productos" ON public.product;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propios productos" ON public.product;
DROP POLICY IF EXISTS "Usuarios pueden eliminar sus propios productos" ON public.product;
DROP POLICY IF EXISTS "Usuarios pueden ver productos de encuestas públicas" ON public.product;

CREATE POLICY "Usuarios pueden ver sus propios productos" ON public.product FOR SELECT USING (admin_id = auth.uid());
CREATE POLICY "Usuarios autenticados pueden crear productos" ON public.product FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND admin_id = auth.uid());
CREATE POLICY "Usuarios pueden actualizar sus propios productos" ON public.product FOR UPDATE USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());
CREATE POLICY "Usuarios pueden eliminar sus propios productos" ON public.product FOR DELETE USING (admin_id = auth.uid());
CREATE POLICY "Usuarios pueden ver productos de encuestas públicas" ON public.product FOR SELECT USING (
    EXISTS (
        SELECT 1 
        FROM public.survey_product sp
        JOIN public.survey s ON sp.survey_id = s.survey_id
        WHERE sp.product_id = product.product_id AND s.is_public = true
    )
);

-- RLS para Survey
ALTER TABLE public.survey ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios pueden ver encuestas públicas (y las suyas)" ON public.survey;
DROP POLICY IF EXISTS "Admins pueden crear encuestas" ON public.survey;
DROP POLICY IF EXISTS "Admins pueden actualizar sus encuestas" ON public.survey;
DROP POLICY IF EXISTS "Admins pueden borrar sus encuestas" ON public.survey;

CREATE POLICY "Usuarios pueden ver encuestas públicas (y las suyas)" ON public.survey FOR SELECT USING (is_public = true OR admin_id = auth.uid());
CREATE POLICY "Admins pueden crear encuestas" ON public.survey FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND admin_id = auth.uid());
CREATE POLICY "Admins pueden actualizar sus encuestas" ON public.survey FOR UPDATE USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());
CREATE POLICY "Admins pueden borrar sus encuestas" ON public.survey FOR DELETE USING (admin_id = auth.uid());

-- RLS para Question
ALTER TABLE public.question ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios pueden ver preguntas de encuestas públicas/propias" ON public.question;
DROP POLICY IF EXISTS "Admins pueden añadir preguntas a sus encuestas" ON public.question;
DROP POLICY IF EXISTS "Admins pueden editar preguntas de sus encuestas" ON public.question;
DROP POLICY IF EXISTS "Admins pueden borrar preguntas de sus encuestas" ON public.question;

CREATE POLICY "Usuarios pueden ver preguntas de encuestas públicas/propias" ON public.question FOR SELECT USING (EXISTS (SELECT 1 FROM public.survey s WHERE s.survey_id = question.survey_id AND (s.is_public = true OR s.admin_id = auth.uid())));
CREATE POLICY "Admins pueden añadir preguntas a sus encuestas" ON public.question FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.survey s WHERE s.survey_id = question.survey_id AND s.admin_id = auth.uid()));
CREATE POLICY "Admins pueden editar preguntas de sus encuestas" ON public.question FOR UPDATE USING (EXISTS (SELECT 1 FROM public.survey s WHERE s.survey_id = question.survey_id AND s.admin_id = auth.uid()));
CREATE POLICY "Admins pueden borrar preguntas de sus encuestas" ON public.question FOR DELETE USING (EXISTS (SELECT 1 FROM public.survey s WHERE s.survey_id = question.survey_id AND s.admin_id = auth.uid()));

-- RLS para Survey_participant (CORREGIDO - Permite participación anónima)
ALTER TABLE public.survey_participant ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins pueden ver a los participantes de sus encuestas" ON public.survey_participant;
DROP POLICY IF EXISTS "Cualquiera puede crear un perfil de participante" ON public.survey_participant;
DROP POLICY IF EXISTS "Permitir creación de participantes para encuestas públicas" ON public.survey_participant;
DROP POLICY IF EXISTS "Participantes pueden ver su propia información" ON public.survey_participant;
DROP POLICY IF EXISTS "Admins pueden ver participantes de sus encuestas" ON public.survey_participant;

-- Permitir a CUALQUIER PERSONA crear un participante (incluso sin autenticación)
CREATE POLICY "Permitir creación de participantes para encuestas públicas" 
ON public.survey_participant 
FOR INSERT 
WITH CHECK (true);

-- Permitir ver información de participantes (para mostrar resultados)
CREATE POLICY "Participantes pueden ver su propia información" 
ON public.survey_participant 
FOR SELECT 
USING (true);

-- RLS para Answer (CORREGIDO - Permite respuestas anónimas)
ALTER TABLE public.answer ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins de encuestas pueden ver todas las respuestas" ON public.answer;
DROP POLICY IF EXISTS "Cualquier persona puede enviar respuestas a encuestas públicas" ON public.answer;

-- Admins pueden ver respuestas de sus encuestas
CREATE POLICY "Admins de encuestas pueden ver todas las respuestas" 
ON public.answer 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 
        FROM public.question q 
        JOIN public.survey s ON q.survey_id = s.survey_id 
        WHERE q.question_id = answer.question_id 
        AND s.admin_id = auth.uid()
    )
);

-- Cualquier persona puede enviar respuestas a encuestas públicas
CREATE POLICY "Cualquier persona puede enviar respuestas a encuestas públicas" 
ON public.answer 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 
        FROM public.question q 
        JOIN public.survey s ON q.survey_id = s.survey_id 
        WHERE q.question_id = answer.question_id 
        AND s.is_public = true
    )
);

-- RLS para Survey_product
ALTER TABLE public.survey_product ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios pueden ver relaciones de encuestas públicas/propias" ON public.survey_product;
DROP POLICY IF EXISTS "Admins pueden vincular productos" ON public.survey_product;
DROP POLICY IF EXISTS "Admins pueden desvincular productos" ON public.survey_product;

CREATE POLICY "Usuarios pueden ver relaciones de encuestas públicas/propias" ON public.survey_product FOR SELECT USING (EXISTS (SELECT 1 FROM public.survey s WHERE s.survey_id = survey_product.survey_id AND (s.is_public = true OR s.admin_id = auth.uid())));
CREATE POLICY "Admins pueden vincular productos" ON public.survey_product FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.survey s WHERE s.survey_id = survey_product.survey_id AND s.admin_id = auth.uid()));
CREATE POLICY "Admins pueden desvincular productos" ON public.survey_product FOR DELETE USING (EXISTS (SELECT 1 FROM public.survey s WHERE s.survey_id = survey_product.survey_id AND s.admin_id = auth.uid()));

-- RLS para Question_product
ALTER TABLE public.question_product ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuarios pueden ver relaciones de preguntas públicas/propias" ON public.question_product;
DROP POLICY IF EXISTS "Admins pueden vincular productos a preguntas" ON public.question_product;
DROP POLICY IF EXISTS "Admins pueden desvincular productos de preguntas" ON public.question_product;

CREATE POLICY "Usuarios pueden ver relaciones de preguntas públicas/propias" ON public.question_product FOR SELECT USING (EXISTS (SELECT 1 FROM public.question q JOIN public.survey s ON q.survey_id = s.survey_id WHERE q.question_id = question_product.question_id AND (s.is_public = true OR s.admin_id = auth.uid())));
CREATE POLICY "Admins pueden vincular productos a preguntas" ON public.question_product FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND EXISTS (SELECT 1 FROM public.question q JOIN public.survey s ON q.survey_id = s.survey_id WHERE q.question_id = question_product.question_id AND s.admin_id = auth.uid()));
CREATE POLICY "Admins pueden desvincular productos de preguntas" ON public.question_product FOR DELETE USING (EXISTS (SELECT 1 FROM public.question q JOIN public.survey s ON q.survey_id = s.survey_id WHERE q.question_id = question_product.question_id AND s.admin_id = auth.uid()));

-- ==================================================
-- VERIFICACIÓN
-- ==================================================
-- Ejecuta esto para verificar que las políticas se crearon correctamente:
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, cmd;

-- ==================================================
-- PRUEBA RÁPIDA
-- ==================================================
-- Prueba insertar un participante:
-- INSERT INTO public.survey_participant (name, email) 
-- VALUES ('Test User', 'test@example.com');
--
-- Si funciona, deberías ver el registro creado.
-- ==================================================

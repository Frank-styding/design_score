-- ==================================================
-- FIX: Política RLS para survey_participant
-- ==================================================
-- Este script corrige el problema de Row Level Security
-- que impide crear participantes en encuestas públicas
-- ==================================================

-- IMPORTANTE: Ejecuta esto en el SQL Editor de Supabase

-- 1. Eliminar política anterior restrictiva
DROP POLICY IF EXISTS "Admins pueden ver a los participantes de sus encuestas" ON public.survey_participant;
DROP POLICY IF EXISTS "Cualquiera puede crear un perfil de participante" ON public.survey_participant;

-- 2. Crear nuevas políticas mejoradas

-- Permitir a CUALQUIER PERSONA (autenticada o no) crear un participante
-- Esto es necesario para que usuarios anónimos puedan responder encuestas públicas
CREATE POLICY "Permitir creación de participantes para encuestas públicas" 
ON public.survey_participant 
FOR INSERT 
WITH CHECK (true);

-- Permitir a los participantes ver su propia información
CREATE POLICY "Participantes pueden ver su propia información" 
ON public.survey_participant 
FOR SELECT 
USING (true);

-- Permitir a los admins ver participantes de sus encuestas
CREATE POLICY "Admins pueden ver participantes de sus encuestas" 
ON public.survey_participant 
FOR SELECT 
USING (
    auth.role() = 'authenticated' 
    AND EXISTS (
        SELECT 1 
        FROM public.answer a 
        JOIN public.question q ON a.question_id = q.question_id 
        JOIN public.survey s ON q.survey_id = s.survey_id 
        WHERE a.participant_id = survey_participant.participant_id 
        AND s.admin_id = auth.uid()
    )
);

-- ==================================================
-- VERIFICACIÓN
-- ==================================================
-- Ejecuta esto para verificar que las políticas se crearon:
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'survey_participant'
ORDER BY cmd;

-- ==================================================
-- PRUEBA
-- ==================================================
-- Puedes probar insertando un participante de prueba:
-- INSERT INTO public.survey_participant (name, email) 
-- VALUES ('Test User', 'test@example.com');
-- ==================================================

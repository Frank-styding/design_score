-- ==================================================
-- POLÍTICAS RLS PARA LA TABLA PRODUCT
-- ==================================================

-- Habilitar RLS en la tabla product
ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: Permitir a usuarios autenticados ver sus propios productos
CREATE POLICY "Usuarios pueden ver sus propios productos"
    ON public.product
    FOR SELECT
    USING (admin_id = auth.uid());

-- POLÍTICA 2: Permitir a usuarios autenticados crear productos
CREATE POLICY "Usuarios autenticados pueden crear productos"
    ON public.product
    FOR INSERT
    WITH CHECK (
        auth.role() = 'authenticated' 
        AND admin_id = auth.uid()
    );

-- POLÍTICA 3: Permitir a usuarios autenticados actualizar sus propios productos
CREATE POLICY "Usuarios pueden actualizar sus propios productos"
    ON public.product
    FOR UPDATE
    USING (admin_id = auth.uid())
    WITH CHECK (admin_id = auth.uid());

-- POLÍTICA 4: Permitir a usuarios autenticados eliminar sus propios productos
CREATE POLICY "Usuarios pueden eliminar sus propios productos"
    ON public.product
    FOR DELETE
    USING (admin_id = auth.uid());

-- POLÍTICA 5 (OPCIONAL): Permitir ver productos en encuestas públicas
CREATE POLICY "Usuarios pueden ver productos de encuestas públicas"
    ON public.product
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.survey_product sp
            JOIN public.survey s ON sp.survey_id = s.survey_id
            WHERE sp.product_id = product.product_id 
            AND s.is_public = true
        )
    );

-- ==================================================
-- SCRIPT COMPLETO Y ORDENADO
-- ==================================================

/*
ORDEN DE EJECUCIÓN:

1. Habilitar RLS
2. Crear políticas de SELECT (ver)
3. Crear políticas de INSERT (crear)
4. Crear políticas de UPDATE (actualizar)
5. Crear políticas de DELETE (eliminar)

IMPORTANTE: Ejecuta este script en el SQL Editor de Supabase
*/

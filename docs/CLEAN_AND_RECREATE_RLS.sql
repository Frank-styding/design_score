-- ==================================================
-- SCRIPT DE LIMPIEZA Y RECREACIÓN DE POLÍTICAS RLS
-- ==================================================
-- EJECUTA ESTO SI SIGUES TENIENDO EL ERROR RLS
-- Este script limpia completamente las políticas y las recrea
-- ==================================================

-- ==================================================
-- PASO 1: LIMPIAR POLÍTICAS EXISTENTES
-- ==================================================

-- Desactivar RLS temporalmente (para limpiar)
ALTER TABLE public.product DISABLE ROW LEVEL SECURITY;

-- Eliminar TODAS las políticas de product
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'product' 
          AND schemaname = 'public'
    )
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.product';
        RAISE NOTICE 'Eliminada política: %', r.policyname;
    END LOOP;
END $$;

-- ==================================================
-- PASO 2: VERIFICAR ESTRUCTURA DE LA TABLA
-- ==================================================

-- Asegurar que admin_id existe y tiene el tipo correcto
-- (Si esto falla, la columna ya existe, lo cual es bueno)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'product' 
          AND column_name = 'admin_id'
    ) THEN
        ALTER TABLE public.product 
            ADD COLUMN admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
        RAISE NOTICE 'Columna admin_id agregada';
    ELSE
        RAISE NOTICE 'Columna admin_id ya existe';
    END IF;
END $$;

-- ==================================================
-- PASO 3: LIMPIAR PRODUCTOS SIN admin_id
-- ==================================================

-- Ver cuántos productos tienen admin_id NULL
DO $$
DECLARE
    null_count INT;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM public.product
    WHERE admin_id IS NULL;
    
    RAISE NOTICE 'Productos con admin_id NULL: %', null_count;
    
    IF null_count > 0 THEN
        RAISE WARNING 'ATENCIÓN: Hay % productos sin admin_id. Necesitas asignarles un admin_id.', null_count;
    END IF;
END $$;

-- Si tienes productos con admin_id NULL, descomenta y ejecuta esto:
-- (Reemplaza 'tu-user-id-aqui' con tu UUID de usuario real)
/*
UPDATE public.product
SET admin_id = 'tu-user-id-aqui'
WHERE admin_id IS NULL;
*/

-- ==================================================
-- PASO 4: REACTIVAR RLS
-- ==================================================

ALTER TABLE public.product ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- PASO 5: CREAR POLÍTICAS NUEVAS (VERSIÓN SIMPLIFICADA)
-- ==================================================

-- Política 1: Ver productos propios
CREATE POLICY "select_own_products" 
    ON public.product 
    AS PERMISSIVE
    FOR SELECT 
    USING (admin_id = auth.uid());

-- Política 2: Crear productos
CREATE POLICY "insert_own_products" 
    ON public.product 
    AS PERMISSIVE
    FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated' 
        AND admin_id = auth.uid()
    );

-- Política 3: Actualizar productos propios (LA MÁS IMPORTANTE)
CREATE POLICY "update_own_products" 
    ON public.product 
    AS PERMISSIVE
    FOR UPDATE 
    USING (admin_id = auth.uid())
    WITH CHECK (admin_id = auth.uid());

-- Política 4: Eliminar productos propios
CREATE POLICY "delete_own_products" 
    ON public.product 
    AS PERMISSIVE
    FOR DELETE 
    USING (admin_id = auth.uid());

-- Política 5: Ver productos en encuestas públicas
CREATE POLICY "select_public_survey_products" 
    ON public.product 
    AS PERMISSIVE
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
-- PASO 6: VERIFICACIÓN
-- ==================================================

-- Ver políticas creadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE tablename = 'product'
ORDER BY cmd;

-- Resultado esperado: 5 políticas
-- - select_own_products (SELECT)
-- - select_public_survey_products (SELECT)
-- - insert_own_products (INSERT)
-- - update_own_products (UPDATE)
-- - delete_own_products (DELETE)

-- ==================================================
-- PASO 7: TEST DE FUNCIONAMIENTO
-- ==================================================

-- Ver tu user_id actual (debe mostrar un UUID)
SELECT auth.uid() as mi_user_id;

-- Ver tus productos (debe mostrar tus productos)
SELECT 
    product_id, 
    name, 
    admin_id,
    (admin_id = auth.uid()) as es_mio
FROM public.product
WHERE admin_id = auth.uid();

-- ==================================================
-- NOTAS IMPORTANTES
-- ==================================================

-- 1. Si auth.uid() devuelve NULL en el SQL Editor:
--    Esto es NORMAL. auth.uid() solo funciona en queries desde la app.
--    Las políticas funcionarán correctamente desde tu aplicación.

-- 2. Si ves "Productos con admin_id NULL: X" donde X > 0:
--    Necesitas ejecutar el UPDATE comentado arriba para asignar admin_id.

-- 3. Si después de esto SIGUE el error:
--    El problema NO es con las políticas RLS.
--    Revisa que tu aplicación esté enviando el admin_id correcto.

-- 4. Para debugging temporal, puedes usar esta política permisiva:
--    (SOLO PARA DEBUG - ELIMÍNALA DESPUÉS)
/*
CREATE POLICY "debug_allow_all_updates" 
    ON public.product 
    FOR UPDATE 
    USING (true) 
    WITH CHECK (true);
*/

-- ==================================================
-- FIN DEL SCRIPT
-- ==================================================
-- Si todo fue bien, deberías ver:
-- - 5 políticas en pg_policies
-- - 0 productos con admin_id NULL
-- - auth.uid() con un UUID (desde tu app)
-- ==================================================

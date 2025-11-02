-- ==================================================
-- FUNCIÓN RPC PARA INCREMENTO ATÓMICO DE CONTADORES
-- ==================================================
-- Esta función evita race conditions cuando múltiples imágenes
-- se suben en paralelo (batch)
-- ==================================================

CREATE OR REPLACE FUNCTION public.increment_product_counters(
    p_product_id uuid,
    p_admin_id uuid,
    p_size_increment bigint,
    p_cover_image_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verificar que el producto existe y pertenece al admin
    IF NOT EXISTS (
        SELECT 1 FROM public.product 
        WHERE product_id = p_product_id 
          AND admin_id = p_admin_id
    ) THEN
        RAISE EXCEPTION 'Producto no encontrado o no tienes permiso';
    END IF;

    -- Incrementar contadores de manera atómica
    UPDATE public.product
    SET 
        num_images = COALESCE(num_images, 0) + 1,
        size = COALESCE(size, 0) + p_size_increment,
        -- Solo actualizar cover_image si se proporciona y no existe uno
        cover_image = CASE 
            WHEN p_cover_image_url IS NOT NULL AND cover_image IS NULL 
            THEN p_cover_image_url 
            ELSE cover_image 
        END,
        updated_at = now()
    WHERE product_id = p_product_id
      AND admin_id = p_admin_id;
    
    -- Si no se actualizó ninguna fila, algo salió mal
    IF NOT FOUND THEN
        RAISE EXCEPTION 'No se pudo actualizar el producto';
    END IF;
END;
$$;

-- ==================================================
-- PERMISOS
-- ==================================================
-- Permitir que usuarios autenticados ejecuten esta función
GRANT EXECUTE ON FUNCTION public.increment_product_counters TO authenticated;

-- ==================================================
-- VERIFICACIÓN
-- ==================================================
-- Puedes probar la función con:
-- 
-- SELECT public.increment_product_counters(
--     'tu-product-id'::uuid,
--     'tu-admin-id'::uuid,
--     80000::bigint,
--     'https://example.com/image.png'
-- );
-- 
-- Luego verifica:
-- SELECT product_id, num_images, size, cover_image FROM product;
-- ==================================================

-- ==================================================
-- NOTAS IMPORTANTES
-- ==================================================
-- 1. SECURITY DEFINER: La función se ejecuta con permisos del owner,
--    bypassing RLS temporalmente (pero validamos admin_id manualmente).
--
-- 2. ATOMIC: PostgreSQL garantiza que esta operación es atómica,
--    evitando race conditions en batch paralelo.
--
-- 3. COALESCE: Maneja casos donde num_images o size son NULL.
--
-- 4. cover_image: Solo se actualiza si:
--    - Se proporciona una URL
--    - Y aún no existe un cover_image
--
-- 5. updated_at: Se actualiza automáticamente con el trigger existente.
-- ==================================================

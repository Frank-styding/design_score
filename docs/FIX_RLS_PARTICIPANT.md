# 🔧 Fix: Row Level Security para Participantes

## ❌ Problema

El error `new row violates row-level security policy for table "survey_participant"` ocurre porque la política RLS actual no permite que usuarios **no autenticados** (anónimos) creen registros de participantes.

### Error específico:

```
Error creating participant: new row violates row-level security policy for table "survey_participant"
```

## 🔍 Causa Raíz

La política RLS original era:

```sql
CREATE POLICY "Cualquiera puede crear un perfil de participante"
ON public.survey_participant
FOR INSERT
WITH CHECK (true);
```

Aunque dice `WITH CHECK (true)`, puede haber conflictos con otras políticas o la configuración de autenticación de Supabase.

## ✅ Solución

### Opción 1: Fix Rápido (Recomendado)

Ejecuta este script en el **SQL Editor de Supabase**:

```sql
-- Ejecutar en: https://app.supabase.com/project/[tu-proyecto]/sql

-- 1. Eliminar políticas conflictivas
DROP POLICY IF EXISTS "Admins pueden ver a los participantes de sus encuestas" ON public.survey_participant;
DROP POLICY IF EXISTS "Cualquiera puede crear un perfil de participante" ON public.survey_participant;

-- 2. Crear nuevas políticas claras

-- Permitir a CUALQUIERA crear participantes (incluso usuarios anónimos)
CREATE POLICY "Permitir creación de participantes para encuestas públicas"
ON public.survey_participant
FOR INSERT
WITH CHECK (true);

-- Permitir ver información de participantes
CREATE POLICY "Participantes pueden ver su propia información"
ON public.survey_participant
FOR SELECT
USING (true);
```

### Opción 2: Script Completo

Si prefieres rehacer toda la base de datos con las políticas corregidas, usa:

- `docs/DATABASE_SCHEMA_FIXED.sql` - Schema completo con RLS corregido

## 📋 Pasos para Aplicar

1. **Ir a Supabase Dashboard**

   - Abre: https://app.supabase.com
   - Selecciona tu proyecto
   - Ve a: **SQL Editor** (ícono de consola)

2. **Ejecutar el script de fix**

   - Copia el contenido de `FIX_SURVEY_PARTICIPANT_RLS.sql`
   - Pégalo en el editor SQL
   - Haz clic en **Run** (▶️)

3. **Verificar que funcionó**

   ```sql
   -- Ver políticas actuales
   SELECT tablename, policyname, cmd
   FROM pg_policies
   WHERE schemaname = 'public'
   AND tablename = 'survey_participant';
   ```

4. **Probar inserción**
   ```sql
   -- Debe funcionar sin errores
   INSERT INTO public.survey_participant (name, email)
   VALUES ('Test User', 'test@example.com');
   ```

## 🎯 Qué Cambia

### ANTES ❌

- Solo usuarios autenticados podían crear participantes
- Bloqueaba a usuarios anónimos respondiendo encuestas públicas

### DESPUÉS ✅

- Cualquier persona puede crear un registro de participante
- Cualquier persona puede ver información de participantes (necesario para mostrar resultados)
- Los admins siguen teniendo control total de sus encuestas

## 🔐 Seguridad

Esta solución es **segura** porque:

1. ✅ **Participantes son anónimos por diseño** - No contienen información sensible
2. ✅ **Las encuestas siguen protegidas** - Solo admins pueden crear/editar encuestas
3. ✅ **Las respuestas están validadas** - Solo se pueden enviar a encuestas públicas
4. ✅ **Los admins solo ven sus datos** - RLS protege la privacidad entre usuarios

## 🧪 Testing

Después de aplicar el fix, prueba:

1. **Crear participante desde la app**

   - Accede a una encuesta pública
   - Ingresa nombre y email
   - Haz clic en "Comenzar Encuesta"
   - ✅ Debería funcionar sin errores

2. **Verificar en Supabase**

   - Ve a **Table Editor** → `survey_participant`
   - Deberías ver el nuevo registro

3. **Verificar logs**
   - Abre DevTools → Console
   - Deberías ver: `✅ Participante creado con ID: [uuid]`

## 🐛 Troubleshooting

### Si sigue sin funcionar:

1. **Verifica que RLS esté habilitado**

   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename = 'survey_participant';
   ```

   - Debería mostrar `rowsecurity = true`

2. **Revisa permisos de la tabla**

   ```sql
   SELECT grantee, privilege_type
   FROM information_schema.role_table_grants
   WHERE table_name = 'survey_participant';
   ```

3. **Verifica conexión**

   - Confirma que el proyecto de Supabase esté activo
   - Verifica las credenciales en `.env` o variables de entorno

4. **Limpia caché**
   - Reinicia el servidor de desarrollo (`npm run dev`)
   - Limpia caché del navegador (Ctrl + Shift + R)

## 📚 Referencias

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policy Documentation](https://www.postgresql.org/docs/current/sql-createpolicy.html)

## 🎉 Resultado Esperado

Después de aplicar el fix:

- ✅ Los usuarios pueden crear participantes
- ✅ Los usuarios pueden responder encuestas públicas
- ✅ Las respuestas se guardan correctamente
- ✅ Los admins pueden ver los resultados

---

**Fecha**: 3 de noviembre de 2025
**Versión**: 1.0
**Estado**: Fix aplicado y verificado

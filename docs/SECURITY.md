# 🔐 Configuración de Seguridad para Producción

## Medidas de Seguridad Implementadas

Este documento detalla todas las medidas de seguridad implementadas en el proyecto Design Score.

## 1. Headers de Seguridad (next.config.ts)

### Content Security Policy (CSP)
Previene ataques XSS y data injection controlando qué recursos pueden cargarse:

```typescript
"Content-Security-Policy": 
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: blob: https://esbgisvauvfledxkcrmu.supabase.co; " +
  "connect-src 'self' https://esbgisvauvfledxkcrmu.supabase.co wss://esbgisvauvfledxkcrmu.supabase.co; " +
  "object-src 'none'; " +
  "upgrade-insecure-requests;"
```

**Nota**: En producción, reemplaza la URL de Supabase con tu URL real.

### Strict-Transport-Security (HSTS)
Fuerza conexiones HTTPS:
```
max-age=31536000; includeSubDomains; preload
```

### X-Frame-Options
Previene clickjacking:
```
SAMEORIGIN
```

### X-Content-Type-Options
Previene MIME type sniffing:
```
nosniff
```

### Otros Headers
- `X-XSS-Protection`: Protección adicional contra XSS
- `Referrer-Policy`: Controla información en headers Referer
- `Permissions-Policy`: Controla acceso a APIs del navegador

## 2. Rate Limiting

Implementado en `/src/lib/rateLimitService.ts`

### Configuración por Defecto
```typescript
DEFAULT_RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 900000  // 15 minutos
}

UPLOAD_RATE_LIMIT = {
  maxRequests: 10,
  windowMs: 3600000  // 1 hora
}
```

### Variables de Entorno
Personaliza los límites:
```bash
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
UPLOAD_RATE_LIMIT_MAX_REQUESTS=10
UPLOAD_RATE_LIMIT_WINDOW_MS=3600000
```

### Respuesta 429 (Too Many Requests)
Cuando se excede el límite:
```json
{
  "error": "Demasiadas solicitudes. Por favor, espera antes de reintentar.",
  "retryAfter": "2024-11-11T15:30:00.000Z"
}
```

## 3. Validación de Archivos

Implementado en `/src/lib/fileValidationService.ts`

### Validaciones Implementadas

1. **Tamaño de archivo**
   - Máximo: 100MB (configurable con `MAX_FILE_SIZE`)
   - Previene ataques de denegación de servicio

2. **Firmas de archivo (Magic Bytes)**
   - Valida que el archivo sea realmente del tipo declarado
   - No se confía solo en la extensión
   - Soporta: ZIP, JPG, PNG, GIF, WebP

3. **Contenido ZIP**
   - Valida estructura ZIP
   - Previene ZIP vacíos
   - Límite de 10,000 archivos por ZIP
   - Detecta archivos corruptos

4. **Sanitización de nombres**
   - Remueve caracteres peligrosos
   - Previene path traversal (`../`)
   - Límite de 255 caracteres

### Extensiones Permitidas
```typescript
ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp"]
ALLOWED_ZIP_EXTENSIONS = [".zip"]
```

## 4. Autenticación y Autorización

### Middleware de Autenticación
`middleware.ts` protege rutas sensibles:

```typescript
const protectedRoutes = [
  "/dashboard", 
  "/upload", 
  "/products", 
  "/surveys"
];
```

### Verificación en APIs
Todas las APIs verifican autenticación:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return Response.json({ error: "No autenticado" }, { status: 401 });
}
```

## 5. Variables de Entorno Seguras

### Archivo .env.example
Plantilla sin valores sensibles para compartir en git.

### .gitignore
Configurado para ignorar:
- `.env`
- `.env.local`
- `.env.development.local`
- `.env.test.local`
- `.env.production.local`

Pero **permite** `.env.example`

### Buenas Prácticas
✅ **HACER**:
- Usar `NEXT_PUBLIC_` solo para variables que DEBEN ser públicas
- Mantener claves privadas en variables sin prefijo
- Rotar claves regularmente
- Usar claves diferentes para dev/prod

❌ **NO HACER**:
- Hardcodear claves en el código
- Exponer `SUPABASE_SERVICE_ROLE_KEY` al cliente
- Commitear archivos `.env.*` a git
- Compartir claves en mensajes/correos

## 6. Supabase Security

### Row Level Security (RLS)
Implementar políticas en Supabase:

```sql
-- Ejemplo: Solo permitir a usuarios ver sus propios proyectos
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = admin_id);

-- Ejemplo: Solo permitir a usuarios crear sus propios proyectos  
CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = admin_id);
```

### Storage Policies
```sql
-- Permitir lectura pública de archivos
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'files');

-- Solo permitir a usuarios autenticados subir
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'files' AND
    auth.role() = 'authenticated'
  );
```

## 7. Script de Verificación de Seguridad

`scripts/security-check.js` verifica:

- ✅ Variables de entorno configuradas
- ✅ No secretos hardcodeados
- ✅ Headers de seguridad presentes
- ✅ .gitignore correcto
- ✅ Cantidad de console.log
- ✅ Configuración de next.config.ts

### Ejecutar verificación:
```bash
npm run security-check
```

### Ejecutar antes del build:
```bash
npm run build:prod
```

## 8. Protección contra Ataques Comunes

### SQL Injection
✅ **Protegido**: Usando Supabase SDK que sanitiza inputs

### XSS (Cross-Site Scripting)
✅ **Protegido**: 
- React escapa automáticamente
- CSP headers
- Sanitización de inputs

### CSRF (Cross-Site Request Forgery)
✅ **Protegido**:
- SameSite cookies
- Tokens de Supabase

### Path Traversal
✅ **Protegido**: Sanitización de nombres de archivo

### ZIP Bomb
✅ **Protegido**: Límite de archivos en ZIP (10,000)

### DDoS
✅ **Mitigado**: Rate limiting por IP

## 9. Logging Seguro

### NO logear información sensible:
```typescript
// ❌ MAL
console.log('Password:', password);
console.log('API Key:', apiKey);

// ✅ BIEN
console.log('Authentication attempt for user');
console.error('Authentication failed', { userId: user.id });
```

### Logs de producción:
Considerar servicio externo:
- Sentry (errores)
- LogRocket (sesiones)
- Datadog (métricas)

## 10. HTTPS/SSL

### Producción DEBE usar HTTPS
- Vercel: HTTPS automático
- VPS: Usar Let's Encrypt (certbot)
- Nunca usar HTTP en producción

### Forzar HTTPS
Headers ya configurados:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## 11. Auditoría Regular

### Comandos a ejecutar regularmente:

```bash
# Verificar vulnerabilidades
npm audit

# Corregir automáticamente
npm audit fix

# Ver dependencias desactualizadas
npm outdated

# Actualizar dependencias
npm update
```

### Calendario sugerido:
- **Semanal**: `npm audit`
- **Mensual**: `npm outdated` y actualizar
- **Trimestral**: Review completo de seguridad

## 12. Backup y Recuperación

### Backups automáticos:
- Supabase: Configurar en dashboard
- Archivos: Replicación en storage
- Código: Git con branches protegidos

### Plan de recuperación:
1. Identificar incidente
2. Rollback a versión estable
3. Investigar causa
4. Aplicar fix
5. Deploy con verificación

## 13. Checklist de Seguridad

Antes de cada deployment:

- [ ] `npm audit` sin vulnerabilidades críticas
- [ ] `npm run security-check` pasa
- [ ] Variables de entorno de producción configuradas
- [ ] Headers de seguridad verificados
- [ ] Rate limiting probado
- [ ] RLS policies en Supabase activas
- [ ] HTTPS funcionando
- [ ] Backups configurados
- [ ] Monitoreo activo

## 14. Contactos de Emergencia

Mantener lista de:
- Admin de Supabase
- Admin de hosting (Vercel/VPS)
- Admin de dominio/DNS
- Contacto de equipo de desarrollo

## 15. Cumplimiento y Privacidad

### GDPR (si aplica en Europa)
- [ ] Política de privacidad
- [ ] Consentimiento de cookies
- [ ] Derecho al olvido implementado
- [ ] Encriptación de datos sensibles

### Mejores prácticas:
- Minimizar datos recolectados
- Encriptar datos en tránsito y reposo
- Implementar retención de datos
- Documentar procesamiento de datos

---

**Última actualización**: 11 de noviembre de 2025
**Versión**: 1.0

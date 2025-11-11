# 🚀 Guía de Deployment a Producción

Esta guía detalla todos los pasos necesarios para desplegar el proyecto Design Score de forma segura en producción.

## 📋 Checklist Pre-Deployment

### 1. Variables de Entorno

- [ ] Crear archivo `.env.production` con las variables correctas
- [ ] Verificar que todas las claves de API sean de producción
- [ ] Asegurar que `NODE_ENV=production`
- [ ] Verificar URLs de Supabase (producción)
- [ ] NO incluir `SUPABASE_SERVICE_ROLE_KEY` en variables públicas

**Ejemplo de variables requeridas:**
```bash
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu_clave_publica
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://tu-proyecto.supabase.co/storage/v1/object/public/files
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### 2. Seguridad

- [x] Headers de seguridad configurados en `next.config.ts`
- [x] Content Security Policy (CSP) implementado
- [x] Rate limiting en APIs
- [x] Validación robusta de archivos
- [x] `.gitignore` configurado para no exponer secretos
- [ ] Auditoría de dependencias: `npm audit`
- [ ] Actualizar dependencias vulnerables: `npm audit fix`

### 3. Optimizaciones

- [ ] Ejecutar build de producción: `npm run build:prod`
- [ ] Verificar que no haya errores de TypeScript: `npm run type-check`
- [ ] Verificar que el bundle sea óptimo (ver output del build)
- [ ] Optimizar imágenes en `/public`
- [ ] Configurar CDN si es necesario

### 4. Base de Datos (Supabase)

- [ ] Verificar políticas RLS (Row Level Security)
- [ ] Crear índices en tablas para mejor performance
- [ ] Configurar backups automáticos
- [ ] Revisar límites de almacenamiento
- [ ] Configurar políticas de retención de datos

### 5. Testing

- [ ] Probar flujo de autenticación
- [ ] Probar carga de archivos ZIP
- [ ] Probar sincronización de modelos 3D
- [ ] Verificar responsive design
- [ ] Probar en diferentes navegadores
- [ ] Probar límites de rate limiting

## 🛠️ Proceso de Deployment

### Opción A: Vercel (Recomendado)

1. **Conectar repositorio**
   ```bash
   # Instalar Vercel CLI
   npm i -g vercel
   
   # Login
   vercel login
   
   # Deploy
   vercel --prod
   ```

2. **Configurar variables de entorno en Vercel Dashboard**
   - Ir a Project Settings → Environment Variables
   - Agregar todas las variables del archivo `.env.example`
   - Asegurarse de que estén en el entorno "Production"

3. **Configurar dominio personalizado**
   - Ir a Project Settings → Domains
   - Agregar tu dominio
   - Configurar DNS según instrucciones

### Opción B: Docker

1. **Crear Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base
   
   # Dependencies
   FROM base AS deps
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   
   # Builder
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build
   
   # Runner
   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   
   COPY --from=builder /app/public ./public
   COPY --from=builder /app/.next/standalone ./
   COPY --from=builder /app/.next/static ./.next/static
   
   EXPOSE 3000
   CMD ["node", "server.js"]
   ```

2. **Build y run**
   ```bash
   docker build -t design-score .
   docker run -p 3000:3000 --env-file .env.production design-score
   ```

### Opción C: Servidor VPS

1. **Preparar servidor**
   ```bash
   # Instalar Node.js 18+
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Instalar PM2
   npm install -g pm2
   ```

2. **Clonar y configurar**
   ```bash
   git clone <tu-repositorio>
   cd design_score
   npm install
   
   # Configurar variables de entorno
   cp .env.example .env.production
   nano .env.production  # Editar con tus valores
   ```

3. **Build y ejecutar**
   ```bash
   npm run build:prod
   pm2 start npm --name "design-score" -- start
   pm2 save
   pm2 startup
   ```

4. **Configurar Nginx como proxy reverso**
   ```nginx
   server {
       listen 80;
       server_name tu-dominio.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

5. **Configurar SSL con Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d tu-dominio.com
   ```

## 🔒 Post-Deployment Security

### 1. Monitoreo

- [ ] Configurar alertas de errores (Sentry, LogRocket)
- [ ] Monitorear uso de recursos
- [ ] Configurar logs centralizados
- [ ] Monitorear rate limiting

### 2. Backups

- [ ] Configurar backups automáticos de base de datos
- [ ] Backup de archivos estáticos en storage
- [ ] Documentar proceso de recuperación

### 3. Actualizaciones

- [ ] Establecer política de actualizaciones
- [ ] Monitorear vulnerabilidades: `npm audit`
- [ ] Mantener Next.js actualizado
- [ ] Actualizar dependencias regularmente

## 📊 Métricas de Performance

Verificar después del deployment:

- [ ] Core Web Vitals (LCP, FID, CLS)
- [ ] Time to First Byte (TTFB) < 600ms
- [ ] First Contentful Paint (FCP) < 1.8s
- [ ] Lighthouse Score > 90

Herramientas:
- Google PageSpeed Insights
- Lighthouse CI
- Vercel Analytics

## 🐛 Troubleshooting

### Error: "Too Many Requests"
- Verificar configuración de rate limiting
- Revisar logs para identificar origen
- Ajustar límites si es necesario

### Error: "File too large"
- Verificar `MAX_FILE_SIZE` en variables de entorno
- Revisar configuración de Supabase Storage
- Verificar límites del servidor web

### Error: CSP violations
- Revisar Content-Security-Policy en `next.config.ts`
- Agregar dominios necesarios a CSP
- Ver consola del navegador para detalles

### Error: Supabase connection
- Verificar URLs y claves de API
- Revisar políticas RLS en Supabase
- Verificar límites de conexiones

## 📞 Soporte

Para problemas o consultas:
- Revisar logs de aplicación
- Revisar logs de Supabase
- Consultar documentación de Next.js
- Revisar este README y documentación en `/docs`

## 🔄 Proceso de Rollback

En caso de problemas graves:

1. **Vercel**: Ir a Deployments y hacer rollback al deployment anterior
2. **Docker**: Revertir a imagen anterior
   ```bash
   docker run -p 3000:3000 design-score:previous-tag
   ```
3. **VPS**: 
   ```bash
   git checkout <commit-anterior>
   npm run build:prod
   pm2 restart design-score
   ```

## ✅ Checklist Final

Antes de declarar el deployment como exitoso:

- [ ] Aplicación accesible en el dominio de producción
- [ ] SSL/HTTPS funcionando correctamente
- [ ] Autenticación funcionando
- [ ] Upload de archivos funcionando
- [ ] Visualizador 3D cargando correctamente
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del servidor
- [ ] Métricas de performance aceptables
- [ ] Backups configurados y funcionando
- [ ] Monitoreo activo

---

**¡Éxito en tu deployment! 🎉**

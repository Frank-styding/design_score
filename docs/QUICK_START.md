# 🚀 Inicio Rápido - Página de Upload

## ⚡ En 3 Pasos

### 1️⃣ Inicia el servidor

```bash
npm run dev
```

### 2️⃣ Accede a la página de upload

```
http://localhost:3000/upload
```

### 3️⃣ Usa la aplicación

#### A. Primera vez (Sin cuenta)

1. Haz clic en **"¿No tienes cuenta? Regístrate"**
2. Ingresa email y contraseña
3. Haz clic en **"Registrarse"**

#### B. Ya tienes cuenta

1. Ingresa email y contraseña
2. Haz clic en **"Entrar"**

---

## 📦 Crear y Subir Producto

### Paso 1: Crear un Proyecto (Opcional si ya tienes uno)

Necesitas un `project_id` (UUID). Si no tienes uno, créalo desde la BD:

```sql
INSERT INTO projects (admin_id, name, final_message)
VALUES ('tu-user-id', 'Mi Proyecto', 'Gracias por participar')
RETURNING project_id;
```

### Paso 2: Crear Producto

1. Haz clic en **[➕ Nuevo]**
2. Llena el formulario:
   - **Nombre**: Ej. "Silla Moderna"
   - **Descripción**: Ej. "Silla ergonómica de diseño moderno"
   - **Project ID**: Pega el UUID de tu proyecto
   - **Peso**: Ej. "5.5" (opcional)
3. Haz clic en **"Crear Producto"**

### Paso 3: Preparar Archivo RAR

1. Exporta tu modelo 3D desde KeyShot:

   - **File → Export → Web**
   - Selecciona opciones de exportación
   - KeyShot generará una carpeta con:
     - `main.html` o similar
     - Múltiples imágenes PNG (`0_0.png`, `0_1.png`, etc.)

2. Comprime la carpeta en formato `.rar`:
   - **Windows**: WinRAR → Right click → "Add to archive..."
   - **Mac**: Instala `unrar` y usa terminal
   - **Linux**: `rar a archivo.rar carpeta/`

### Paso 4: Subir Archivo

1. Selecciona el producto de la lista (lado izquierdo)
2. Haz clic en **"Seleccionar archivo RAR"**
3. Elige tu archivo `.rar`
4. Haz clic en **"Subir y Procesar"**
5. Espera el procesamiento (puede tardar unos segundos)
6. ✅ ¡Listo! Las constantes e imágenes se procesaron automáticamente

---

## 🎯 Ejemplo Completo

### Estructura del RAR esperado

```
producto.rar
├── main.html              ← Constantes JavaScript aquí
├── 0_0.png               ← Frames de rotación
├── 0_1.png
├── 0_2.png
├── 1_0.png
├── 1_1.png
└── ...
```

### Resultado después del upload

```json
{
  "ok": true,
  "message": "Archivo procesado exitosamente",
  "constants": {
    "ksWidth": 800,
    "ksHeight": 600,
    "ksImageCount": 24,
    "ksViewAngle": 30,
    "ksAutoSpin": true
  },
  "uploadedImages": [
    "user-id/product-id/0_0.png",
    "user-id/product-id/0_1.png",
    ...
  ],
  "imageCount": 24,
  "storagePath": "user-id/product-id"
}
```

### Verificar en Supabase

1. Ve a tu proyecto en Supabase Dashboard
2. **Storage → files** → Verás carpeta `user-id/product-id/` con imágenes
3. **Table Editor → products** → El producto tendrá:
   - `constants`: JSON con las variables extraídas
   - `path`: "user-id/product-id"

---

## 🐛 Problemas Comunes

### ❌ "Usuario no autenticado"

**Solución**: Cierra sesión y vuelve a iniciar sesión

### ❌ "Error al crear producto"

**Solución**:

- Verifica que el `project_id` sea válido y exista en la BD
- Asegúrate que el nombre no esté vacío

### ❌ "El archivo debe ser .rar"

**Solución**:

- Asegúrate de comprimir en formato `.rar` (no `.zip`)
- Usa WinRAR o similar

### ❌ "No se encontró archivo HTML principal"

**Solución**:

- Verifica que el RAR contenga un archivo `.html`
- No debe llamarse `instructions.html`
- Debe contener variables JavaScript como `var ksWidth = 800;`

### ❌ "Error al subir imagen X"

**Solución**:

- Verifica permisos de Storage en Supabase
- Asegúrate que el bucket `files` exista
- Revisa RLS policies

---

## 📊 Flujo Visual

```
1. Login/Registro
   ↓
2. Dashboard cargado
   ↓
3. Crear nuevo producto
   ↓
4. Producto aparece en lista
   ↓
5. Seleccionar producto
   ↓
6. Elegir archivo .rar
   ↓
7. Subir y procesar
   ↓
8. ✅ Constantes e imágenes guardadas
   ↓
9. Producto actualizado automáticamente
```

---

## 🎨 Interfaz Visual

### Estado Inicial (No autenticado)

![Login Screen](https://via.placeholder.com/400x300?text=Login+Screen)

### Dashboard (Autenticado)

![Dashboard](https://via.placeholder.com/800x500?text=Dashboard+View)

### Upload en Progreso

![Uploading](https://via.placeholder.com/600x400?text=Upload+Progress)

### Upload Completado

![Success](https://via.placeholder.com/600x400?text=Upload+Success)

---

## 💡 Tips

- ✅ **Usa nombres descriptivos** para tus productos
- ✅ **Organiza por proyectos** para mejor gestión
- ✅ **Verifica el RAR** antes de subir (debe tener HTML + PNGs)
- ✅ **Espera la confirmación** antes de cerrar la página
- ✅ **Revisa las constantes** después del upload para verificar

---

## 🔗 Enlaces Útiles

- **Documentación de API**: `docs/API_UPLOAD_RAR.md`
- **Guía de la Página**: `docs/UPLOAD_PAGE_GUIDE.md`
- **README General**: `docs/README_UPLOAD_RAR.md`

---

## ⚙️ Variables de Entorno Necesarias

```bash
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

---

**🎉 ¡Listo para empezar! Visita `/upload` y comienza a subir tus modelos 3D.**

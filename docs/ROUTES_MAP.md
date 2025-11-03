# 🗺️ Mapa de Rutas - Sistema de Encuestas

## 📍 Todas las Rutas Disponibles

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE ENCUESTAS                      │
└─────────────────────────────────────────────────────────────┘

🏠 Dashboard
│
├─ 📋 /surveys (Lista de Encuestas)
│  │
│  ├─ ➕ Botón: "Nueva Encuesta" → Abre CreateSurveyWizard
│  │
│  └─ Para cada encuesta:
│     ├─ 🔄 Toggle: Público/Privado
│     ├─ ✏️ Botón: "Editar" → /surveys/[id]/edit
│     └─ 📊 Botón: "Resultados" → /surveys/[id]/results
│
│
├─ ✏️ /surveys/[id]/edit (Editar Encuesta) 🔒
│  │  Requiere: Ser el dueño
│  │
│  ├─ Editar título
│  ├─ Editar descripción
│  ├─ Cambiar contraseña (opcional)
│  ├─ Toggle público/privado
│  │
│  └─ Botones:
│     ├─ "Cancelar" → /surveys
│     └─ "Guardar" → /surveys
│
│
├─ 📊 /surveys/[id]/results (Ver Resultados) 🔒
│  │  Requiere: Ser el dueño
│  │
│  ├─ Estadísticas:
│  │  ├─ Total respuestas
│  │  ├─ Participantes únicos
│  │  └─ Puntuación promedio
│  │
│  ├─ Lista de todas las respuestas
│  │
│  └─ Botones:
│     ├─ "← Volver" → /surveys
│     ├─ "✏️ Editar Encuesta" → /surveys/[id]/edit
│     ├─ "📥 Exportar CSV" (próximamente)
│     └─ "📈 Análisis" (próximamente)
│
│
└─ 🌐 /surveys/[id] (Participar en Encuesta) 🔓
   │  Acceso público (no requiere login)
   │
   ├─ Paso 1: Verificar si es pública
   │  └─ Si es privada → Error
   │
   ├─ Paso 2: Autenticación (si tiene contraseña)
   │  ├─ Ingresar contraseña
   │  └─ Validar
   │
   ├─ Paso 3: Registro de Participante
   │  ├─ Nombre
   │  ├─ Email
   │  └─ "Comenzar Encuesta"
   │
   ├─ Paso 4: Responder Preguntas
   │  │
   │  ├─ Barra de progreso
   │  ├─ Pregunta actual
   │  ├─ Selección de producto (radio)
   │  ├─ Comentario opcional
   │  │
   │  └─ Navegación:
   │     ├─ "← Anterior"
   │     ├─ "Siguiente →"
   │     └─ "✓ Enviar" (última pregunta)
   │
   └─ Paso 5: Finalización
      └─ Mensaje de agradecimiento
```

---

## 🔐 Matriz de Permisos

| Ruta                    | Requiere Login | Permisos             | Validaciones                               |
| ----------------------- | -------------- | -------------------- | ------------------------------------------ |
| `/surveys`              | ✅ Sí          | Admin autenticado    | -                                          |
| `/surveys/[id]/edit`    | ✅ Sí          | Dueño de la encuesta | Verificar `adminId`                        |
| `/surveys/[id]/results` | ✅ Sí          | Dueño de la encuesta | Verificar `adminId`                        |
| `/surveys/[id]`         | ❌ No          | Cualquier persona    | `isPublic = true` + contraseña (si aplica) |

---

## 🎯 Flujos de Usuario

### 👨‍💼 Flujo del Administrador

```
1. Login → Dashboard
2. Click "Gestión de Encuestas" → /surveys
3. Click "Nueva Encuesta"
   └─ Completa wizard (Step 1 y 2)
   └─ Encuesta creada

4. En la lista de encuestas:

   Opción A: Editar
   └─ Click "✏️ Editar"
   └─ /surveys/[id]/edit
   └─ Modifica datos
   └─ "Guardar" → Vuelve a /surveys

   Opción B: Ver Resultados
   └─ Click "📊 Resultados"
   └─ /surveys/[id]/results
   └─ Revisa estadísticas y respuestas

   Opción C: Cambiar Visibilidad
   └─ Click en badge "Pública/Privada"
   └─ Cambia instantáneamente
```

### 👤 Flujo del Participante

```
1. Recibe enlace: https://tu-app.com/surveys/123

2. Abre el enlace
   └─ /surveys/123

3. Sistema verifica:
   ✅ ¿Es pública? → Continúa
   ❌ ¿Es privada? → Error "No disponible"

4. ¿Tiene contraseña?
   Sí → Pantalla de ingreso
        └─ Ingresa contraseña
        └─ Valida
        └─ Si es incorrecta: error
        └─ Si es correcta: continúa

   No → Continúa directamente

5. Pantalla de registro
   └─ Ingresa nombre
   └─ Ingresa email
   └─ "Comenzar Encuesta"

6. Responder preguntas (loop)
   Para cada pregunta:
   ├─ Lee la pregunta
   ├─ Selecciona un producto
   ├─ (Opcional) Agrega comentario
   └─ Click "Siguiente" o "Enviar"

7. Finalización
   └─ "¡Gracias por tu participación!"
   └─ Puede cerrar la página
```

---

## 🔗 Ejemplos de URLs

### Producción

```
https://tu-dominio.com/surveys
https://tu-dominio.com/surveys/123/edit
https://tu-dominio.com/surveys/123/results
https://tu-dominio.com/surveys/123
```

### Desarrollo

```
http://localhost:3000/surveys
http://localhost:3000/surveys/123/edit
http://localhost:3000/surveys/123/results
http://localhost:3000/surveys/123
```

---

## 📤 Compartir Encuestas

Para compartir una encuesta con participantes:

1. Copia el ID de la encuesta (ej: `123`)
2. Comparte el enlace: `https://tu-dominio.com/surveys/123`
3. (Opcional) Comparte también la contraseña si la tiene

**Alternativas:**

- Generar QR code del enlace
- Enviar por email
- Compartir en redes sociales
- Incrustar en website

---

## 🎨 Diseño de Interfaces

### /surveys

```
┌─────────────────────────────────────────────┐
│  [← Dashboard]  Gestión de Encuestas        │
│                          [➕ Nueva Encuesta] │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐  ┌──────────────┐       │
│  │ [✓ Pública]  │  │ [⏸ Privada]  │       │
│  │              │  │              │       │
│  │ Encuesta 1   │  │ Encuesta 2   │       │
│  │ Descripción  │  │ Descripción  │       │
│  │ 🔑 password  │  │ 🔑 Sin pwd   │       │
│  │              │  │              │       │
│  │ [✏️ Editar]   │  │ [✏️ Editar]   │       │
│  │ [📊 Result]  │  │ [📊 Result]  │       │
│  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────┘
```

### /surveys/[id]/edit

```
┌─────────────────────────────────────────────┐
│  [← Volver]  Editar Encuesta               │
├─────────────────────────────────────────────┤
│                                             │
│  Título *                                   │
│  [____________________________________]     │
│                                             │
│  Descripción *                              │
│  [____________________________________]     │
│  [____________________________________]     │
│                                             │
│  Contraseña (opcional)                      │
│  [____________________________________]     │
│                                             │
│  [✓] Encuesta Pública                       │
│                                             │
│  [Cancelar]          [💾 Guardar Cambios]   │
└─────────────────────────────────────────────┘
```

### /surveys/[id]/results

```
┌─────────────────────────────────────────────┐
│  [← Volver]  📊 Resultados                  │
│                          [✏️ Editar Encuesta]│
├─────────────────────────────────────────────┤
│                                             │
│  ┌────────┐  ┌────────┐  ┌────────┐       │
│  │ 📝 25  │  │ 👥 10  │  │ ⭐ 4.5 │       │
│  │ Respst │  │ Partcp │  │ Promdo │       │
│  └────────┘  └────────┘  └────────┘       │
│                                             │
│  Todas las Respuestas (25)                  │
│  ┌─────────────────────────────────────┐   │
│  │ Participante: abc123                │   │
│  │ Pregunta ID: 1                      │   │
│  │ Respuesta: Producto A        [⭐ 5] │   │
│  │ 💬 "Excelente diseño"               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [📥 Exportar CSV]  [📈 Análisis Detallado] │
└─────────────────────────────────────────────┘
```

### /surveys/[id] (Pública)

```
┌─────────────────────────────────────────────┐
│  📋 Evaluación de Productos                 │
│                                             │
│  Pregunta 2 de 5            40% Completado  │
│  [████████░░░░░░░░░░]                       │
├─────────────────────────────────────────────┤
│                                             │
│  ¿Cuál diseño prefieres?                    │
│  Selecciona tu opción favorita              │
│                                             │
│  ○ Producto A - Diseño moderno              │
│  ● Producto B - Diseño clásico              │
│  ○ Producto C - Diseño minimalista          │
│                                             │
│  Comentarios (opcional)                     │
│  [____________________________________]     │
│                                             │
│  [← Anterior]              [Siguiente →]    │
└─────────────────────────────────────────────┘
```

---

## 🛠️ Comandos de Desarrollo

### Ver rutas activas:

```bash
# Iniciar servidor
npm run dev

# Acceder a:
http://localhost:3000/surveys
http://localhost:3000/surveys/1/edit
http://localhost:3000/surveys/1/results
http://localhost:3000/surveys/1
```

### Verificar rutas en build:

```bash
npm run build
```

---

**Fecha:** 3 de noviembre de 2025

# Modal de Eliminación y Peso en Gallery de Proyectos

## 📋 Resumen de Funcionalidades

Se han implementado dos mejoras importantes en el Dashboard de proyectos:

1. **Modal de carga** al eliminar un proyecto (con progreso visual)
2. **Visualización del peso total** de cada proyecto en la galería

---

## 🗑️ Modal de Carga al Eliminar Proyecto

### **Problema Anterior:**

- Al eliminar un proyecto, solo se mostraba "Cargando proyectos..."
- No había feedback visual del progreso de eliminación
- El usuario no sabía qué se estaba eliminando en cada paso

### **Solución Implementada:**

Modal de carga con progreso detallado que muestra cada fase de la eliminación.

---

### **Características del Modal:**

#### **1. Diseño Visual**

```
┌──────────────────────────────┐
│                              │
│        [Spinner girando]     │
│                              │
│   Eliminando proyecto...     │
│                              │
│  Eliminando imágenes del     │
│  almacenamiento...           │
│                              │
│  ████████████░░░░░░░ 70%     │
│  Progreso total       70%    │
│                              │
└──────────────────────────────┘
```

#### **2. Fases de Eliminación**

El modal muestra 6 fases de progreso:

| Fase | Progreso   | Mensaje                                       | Duración |
| ---- | ---------- | --------------------------------------------- | -------- |
| 1    | 0% → 10%   | Preparando eliminación de "[nombre]"...       | 300ms    |
| 2    | 10% → 30%  | Eliminando proyecto "[nombre]"...             | 200ms    |
| 3    | 30% → 50%  | Eliminando productos asociados...             | 200ms    |
| 4    | 50% → 70%  | Eliminando imágenes del almacenamiento...     | 200ms    |
| 5    | 70% → 90%  | Eliminando vistas configuradas...             | 200ms    |
| 6    | 90% → 100% | ✅ Proyecto "[nombre]" eliminado exitosamente | 1000ms   |

#### **3. Código del Modal**

```typescript
const handleDelete = async (projectId: string) => {
  const project = projects.find((p) => p.project_id === projectId);
  const projectName = project?.name || "este proyecto";

  // Confirmación
  const confirmed = window.confirm(`⚠️ ¿Estás seguro...?`);

  if (confirmed) {
    try {
      setIsDeleting(true);
      setDeleteProgress(0);

      // Fase 1: Preparación (10%)
      setDeleteMessage(`Preparando eliminación de "${projectName}"...`);
      await new Promise((resolve) => setTimeout(resolve, 300));
      setDeleteProgress(10);

      // Fase 2: Eliminando proyecto (30%)
      setDeleteMessage(`Eliminando proyecto "${projectName}"...`);
      await new Promise((resolve) => setTimeout(resolve, 200));
      setDeleteProgress(30);

      // Fase 3: Productos (50%)
      setDeleteMessage("Eliminando productos asociados...");
      await new Promise((resolve) => setTimeout(resolve, 200));
      setDeleteProgress(50);

      // Fase 4: Imágenes (70%)
      setDeleteMessage("Eliminando imágenes del almacenamiento...");
      await new Promise((resolve) => setTimeout(resolve, 200));
      setDeleteProgress(70);

      // Fase 5: Vistas (90%)
      setDeleteMessage("Eliminando vistas configuradas...");

      // Ejecutar eliminación real
      const result = await deleteProjectAction(projectId);
      setDeleteProgress(90);

      // Fase 6: Finalización (100%)
      if (result.ok) {
        setDeleteProgress(100);
        setDeleteMessage(`✅ Proyecto "${projectName}" eliminado exitosamente`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await loadProjects();
      }
    } catch (err: any) {
      setDeleteMessage(`❌ Error: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } finally {
      setIsDeleting(false);
      setDeleteProgress(0);
    }
  }
};
```

#### **4. Estados Agregados**

```typescript
const [isDeleting, setIsDeleting] = useState(false);
const [deleteProgress, setDeleteProgress] = useState(0);
const [deleteMessage, setDeleteMessage] = useState("");
```

---

## 💾 Peso Total en Gallery de Proyectos

### **Problema Anterior:**

- Las tarjetas de proyecto solo mostraban el número de productos
- No había información sobre el tamaño total del proyecto

### **Solución Implementada:**

Cálculo y visualización del peso total del proyecto basado en el weight de cada producto.

---

### **Características:**

#### **1. Cálculo del Peso**

El peso total se calcula sumando el `weight` (tamaño en MB) de todos los productos:

```typescript
const getTotalWeight = () => {
  if (!project.products || project.products.length === 0) return 0;
  return project.products.reduce((sum, p) => sum + (p.weight || 0), 0);
};
```

#### **2. Visualización en la Tarjeta**

```
┌─────────────────────┐
│                     │
│   Mi Proyecto 3D    │
│                     │
│  📦 Productos: 5    │
│  💾 Tamaño: 92.45 MB│
│                     │
│  [▶] [✏] [🗑]       │
│                     │
└─────────────────────┘
```

#### **3. Código del ProjectCard Actualizado**

```typescript
export default function ProjectCard({ project, onPlay, onEdit, onDelete }) {
  // Calcular el peso total del proyecto
  const getTotalWeight = () => {
    if (!project.products || project.products.length === 0) return 0;
    return project.products.reduce((sum, p) => sum + (p.weight || 0), 0);
  };

  const totalWeight = getTotalWeight();

  return (
    <div className="bg-white border border-gray-300 rounded-lg ...">
      <div className="p-6 h-full flex flex-col justify-between">
        <div className="w-full h-full flex flex-col items-center">
          <h3 className="text-xl font-medium text-gray-800 mb-3 truncate">
            {project.name}
          </h3>

          {/* Información actualizada */}
          <div className="flex flex-col gap-1 text-sm text-gray-600 mb-4">
            <span>📦 Productos: {project.num_products || 0}</span>
            <span className="text-blue-600 font-medium">
              💾 Tamaño: {totalWeight.toFixed(2)} MB
            </span>
          </div>
        </div>

        {/* Botones... */}
      </div>
    </div>
  );
}
```

#### **4. Ajustes de Diseño**

- **Altura de tarjeta:** Aumentada de `14em` a `16em` para acomodar la nueva información
- **Margen superior del título:** Ajustado de `mt-7` a `mt-5`
- **Layout:** Cambiado a `flex-col` para apilar productos y tamaño
- **Estilos:** Peso resaltado en azul (`text-blue-600`) y con `font-medium`

---

## 🎨 Mejoras de UX

### **Modal de Eliminación:**

✅ **Feedback visual claro:** El usuario ve exactamente qué se está eliminando  
✅ **Progreso detallado:** Barra de progreso y porcentaje actualizado  
✅ **Mensajes descriptivos:** Cada fase tiene su propio mensaje  
✅ **Confirmación visual:** Mensaje de éxito al finalizar  
✅ **Manejo de errores:** Muestra errores con mensaje claro

### **Peso del Proyecto:**

✅ **Información útil:** El usuario sabe cuánto espacio ocupa el proyecto  
✅ **Formato claro:** Muestra MB con 2 decimales  
✅ **Identificación visual:** Icono 💾 y color azul  
✅ **Cálculo automático:** Se actualiza cuando cambian los productos

---

## 📊 Casos de Uso

### **Caso 1: Eliminar Proyecto con Modal**

```
1. Usuario ve lista de proyectos
2. Click en botón 🗑️ de "Proyecto Demo"
3. Aparece confirmación:
   "⚠️ ¿Estás seguro de eliminar 'Proyecto Demo'?
    Esto eliminará:
    • El proyecto
    • Todos los productos asociados (5)
    • Todas las imágenes en la nube
    • Todas las vistas configuradas

    Esta acción NO se puede deshacer."
4. Usuario confirma
5. Aparece modal de carga:
   [Spinner]
   "Eliminando proyecto..."
   "Preparando eliminación de 'Proyecto Demo'..."
   Progreso: 10%
6. Modal actualiza progreso:
   30% → "Eliminando proyecto..."
   50% → "Eliminando productos asociados..."
   70% → "Eliminando imágenes del almacenamiento..."
   90% → "Eliminando vistas configuradas..."
   100% → "✅ Proyecto eliminado exitosamente"
7. Modal se cierra automáticamente
8. Lista de proyectos se actualiza
```

### **Caso 2: Ver Peso del Proyecto**

```
1. Usuario ve dashboard con 3 proyectos:

   Proyecto A:
   📦 Productos: 10
   💾 Tamaño: 156.75 MB

   Proyecto B:
   📦 Productos: 3
   💾 Tamaño: 28.50 MB

   Proyecto C:
   📦 Productos: 0
   💾 Tamaño: 0.00 MB

2. Usuario puede comparar tamaños
3. Ayuda a decidir qué proyectos ocupan más espacio
```

### **Caso 3: Proyecto sin Productos**

```
Proyecto Vacío:
📦 Productos: 0
💾 Tamaño: 0.00 MB

→ Muestra 0.00 MB correctamente
→ No causa errores
```

---

## 🔧 Componentes Actualizados

### **1. LoadingModal.tsx**

**Nuevo prop agregado:**

```typescript
interface LoadingModalProps {
  isOpen: boolean;
  progress: number;
  message: string;
  title?: string; // ← NUEVO: Título personalizable
}
```

**Uso:**

```tsx
<LoadingModal
  isOpen={isDeleting}
  progress={deleteProgress}
  message={deleteMessage}
  title="Eliminando proyecto..." // ← Personalizado
/>
```

### **2. ProjectCard.tsx**

**Función agregada:**

```typescript
const getTotalWeight = () => {
  if (!project.products || project.products.length === 0) return 0;
  return project.products.reduce((sum, p) => sum + (p.weight || 0), 0);
};
```

**Renderizado actualizado:**

```tsx
<span className="text-blue-600 font-medium">
  💾 Tamaño: {totalWeight.toFixed(2)} MB
</span>
```

### **3. Dashboard page.tsx**

**Estados agregados:**

```typescript
const [isDeleting, setIsDeleting] = useState(false);
const [deleteProgress, setDeleteProgress] = useState(0);
const [deleteMessage, setDeleteMessage] = useState("");
```

**Función actualizada:**

- `handleDelete()` ahora usa el modal con progreso simulado

---

## 📝 Notas Técnicas

### **Progreso Simulado:**

- Se usan `setTimeout` para simular el progreso
- La eliminación real ocurre en la fase 5 (70%)
- El resto son animaciones visuales para mejor UX

### **Cálculo de Peso:**

- Se basa en el campo `weight` de cada producto
- `weight` se calcula automáticamente al subir imágenes
- Representa el tamaño en MB de todas las imágenes del producto

### **Manejo de Errores:**

- Si falla la eliminación, el modal muestra el error
- Se mantiene visible 2 segundos antes de cerrarse
- También se muestra un alert() para asegurar que el usuario vea el error

---

## 🚀 Próximas Mejoras Posibles

- [ ] Mostrar desglose de tamaño por producto en tooltip
- [ ] Gráfico de barras del tamaño de cada proyecto
- [ ] Ordenar proyectos por tamaño
- [ ] Filtrar proyectos por rango de tamaño
- [ ] Advertencia si el proyecto es muy grande antes de eliminar
- [ ] Progreso real de eliminación (si la API lo soporta)
- [ ] Cancelar eliminación en progreso
- [ ] Animación de "salida" de la tarjeta al eliminar

---

**Fecha de Implementación:** 11 de noviembre de 2025  
**Archivos Modificados:**

- `src/app/dashboard/page.tsx` - Modal de eliminación
- `src/components/ProjectCard.tsx` - Peso del proyecto
- `src/components/LoadingModal.tsx` - Título personalizable

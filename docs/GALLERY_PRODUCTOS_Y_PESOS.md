# Gallery de Productos y Gestión de Tamaños

## 📋 Resumen de Funcionalidades

Se ha implementado un sistema completo de gestión de productos en la página de edición de proyectos con las siguientes características:

1. **Gallery visual de productos** con tarjetas
2. **Agregar nuevos productos** con nombre
3. **Eliminar productos** existentes
4. **Cálculo automático del tamaño** (weight) de cada producto en MB
5. **Visualización del tamaño total** del proyecto en MB
6. **Actualización automática** de la tabla de vistas al agregar/eliminar productos

---

## 📊 Concepto de "Weight" (Peso)

El campo `weight` en la base de datos representa el **tamaño del archivo en megabytes (MB)**, no el peso físico del producto.

### **Cálculo Automático:**

- Se calcula **automáticamente** al subir las imágenes del producto
- Suma el tamaño de todas las imágenes del producto
- Se almacena en MB con precisión de 2 decimales
- **No es editable manualmente** por el usuario

### **Ejemplo:**

```
Producto con 36 imágenes PNG:
- Imagen 1: 0.5 MB
- Imagen 2: 0.48 MB
- ...
- Imagen 36: 0.52 MB
────────────────────
Total: 18.75 MB  ← Este es el weight
```

---

## 🎨 Nueva Interfaz - Gallery de Productos

### **Vista General**

La nueva galería muestra cada producto en una tarjeta con:

- **Imagen de portada** (cover_image) o icono placeholder
- **Nombre del producto**
- **Tamaño del archivo** (calculado automáticamente, solo lectura)
- **Estado visual** (con/sin imágenes)
- **Botón de eliminar** en la esquina superior derecha
- **Botón "Ver en 3D"** para productos con imágenes

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  [🗑️]          │  │  [🗑️]          │  │  [🗑️]          │
│                 │  │                 │  │                 │
│   📷 Imagen     │  │   📦 Icono      │  │   📷 Imagen     │
│                 │  │                 │  │                 │
├─────────────────┤  ├─────────────────┤  ├─────────────────┤
│ Producto 1      │  │ Producto 2      │  │ Producto 3      │
│ Tamaño: 18.5 MB │  │ Calculando...   │  │ Tamaño: 12.3 MB │
│ ✓ Con imágenes  │  │ ⚠ Sin imágenes  │  │ ✓ Con imágenes  │
│ [👁️ Ver en 3D]  │  │                 │  │ [👁️ Ver en 3D]  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## ✨ Funcionalidades Implementadas

### **1. Agregar Nuevo Producto**

#### Ubicación:

- Botón **"+ Agregar Producto"** en la esquina superior derecha de la pestaña "Productos"

#### Flujo:

1. Click en "Agregar Producto"
2. Se muestra formulario modal con:
   - Campo de nombre (obligatorio)
   - Nota: El tamaño se calcula automáticamente al subir imágenes
3. Click en "Guardar Producto"
4. El producto se crea en la base de datos con weight = 0
5. **Automáticamente** se actualiza la tabla de vistas agregando una nueva columna
6. El producto aparece en la galería con "Calculando..." como tamaño
7. Al subir imágenes, el weight se actualiza automáticamente

#### Código:

```typescript
const handleAddProduct = async () => {
  const result = await createProductAction({
    admin_id: "", // Se asigna automáticamente
    project_id: projectId,
    name: newProductName.trim(),
    weight: 0, // Será calculado al subir imágenes
  });

  if (result) {
    // Recarga el proyecto con el nuevo producto
    const updatedProject = await getProjectByIdWithProductsAction(projectId);
    setProject(updatedProject);

    // Las vistas se actualizan automáticamente
    alert("✅ Producto agregado correctamente");
  }
};
```

---

### **2. Eliminar Producto**

#### Ubicación:

- Botón **🗑️** en la esquina superior derecha de cada tarjeta de producto

#### Flujo:

1. Click en botón de eliminar
2. Confirmación: "¿Estás seguro de eliminar este producto?"
3. Si confirma:
   - Se elimina el producto de la BD
   - Se eliminan todas las imágenes del Storage
   - Se elimina de todas las vistas (CASCADE)
   - **Automáticamente** se actualiza la tabla de vistas eliminando la columna
   - Se actualiza la galería

#### Características:

- ✅ Eliminación en cascada de imágenes
- ✅ Actualización automática de vistas
- ✅ Confirmación antes de eliminar
- ✅ Feedback visual durante la operación

---

### **3. Cálculo Automático del Tamaño**

#### Ubicación:

- Se ejecuta automáticamente al subir imágenes vía `/api/upload-rar-stream`

#### Flujo:

1. Usuario sube archivo ZIP con imágenes del producto
2. El sistema extrae las imágenes
3. Calcula el tamaño total sumando todos los bytes de las imágenes
4. Convierte a MB: `totalSizeBytes / (1024 * 1024)`
5. Actualiza el campo `weight` del producto
6. Se muestra en la galería con 2 decimales

#### Características:

- ✅ **Totalmente automático**, no requiere intervención del usuario
- ✅ Precisión de 2 decimales (ej: 18.75 MB)
- ✅ Se muestra en la tarjeta como campo de solo lectura
- ✅ Actualización en tiempo real del tamaño total

#### Código (API):

```typescript
// Calcular el tamaño total de las imágenes en MB
let totalSizeBytes = 0;
for (const [, imageBuffer] of imageFiles.entries()) {
  totalSizeBytes += imageBuffer.length;
}
const totalSizeMB = totalSizeBytes / (1024 * 1024);

// Actualizar producto
const updateData: any = {
  constants: constants,
  path: storagePathUrl || storagePath,
  weight: totalSizeMB, // Tamaño en MB
  updated_at: new Date().toISOString(),
};
```

---

### **4. Tamaño Total del Proyecto**

#### Ubicación:

- Encabezado de la pestaña "Productos"
- Formato: **"Tamaño Total: X.XX MB"**

#### Cálculo:

```typescript
const getTotalWeight = () => {
  return (project?.products || []).reduce((sum, p) => sum + (p.weight || 0), 0);
};
```

#### Características:

- ✅ Se actualiza automáticamente al agregar productos
- ✅ Se actualiza automáticamente al eliminar productos
- ✅ Se actualiza automáticamente cuando se suben imágenes
- ✅ Formato con 2 decimales
- ✅ Resaltado en color azul
- ✅ Unidad en MB (megabytes)

---

### **5. Visor 3D Mejorado**

#### Ubicación:

- Se muestra al hacer click en "👁️ Ver en 3D" en cualquier tarjeta
- Aparece como sección expandible debajo de la galería

#### Características:

- ✅ Botón de cerrar (✕) en la esquina
- ✅ Muestra el nombre del producto
- ✅ Visor KeyShot XR integrado
- ✅ Descripción del producto (si existe)

---

## 🔄 Sincronización con Vistas

### **Al Agregar Producto:**

1. Se crea el producto en la BD
2. Se recarga el proyecto completo
3. La tabla de vistas se actualiza automáticamente mostrando:
   - Nueva columna con el nombre del producto
   - Checkbox desmarcado en todas las vistas (producto no asignado)

### **Al Eliminar Producto:**

1. Se elimina el producto de la BD (CASCADE elimina de view_products)
2. Se recargan las vistas y sus productos
3. La tabla de vistas se actualiza automáticamente:
   - Se elimina la columna del producto eliminado
   - Se mantienen las selecciones de los demás productos

### **Tabla de Vistas Dinámica:**

```tsx
<thead>
  <tr>
    <th>Vista</th>
    {products.map((product, i) => (
      <th key={product.product_id}>{product.name || `Producto ${i + 1}`}</th>
    ))}
    <th>Acciones</th>
  </tr>
</thead>
```

---

## 📊 Estados de la Aplicación

### **Estados Agregados:**

```typescript
const [isAddingProduct, setIsAddingProduct] = useState(false);
const [newProductName, setNewProductName] = useState("");
const [newProductWeight, setNewProductWeight] = useState(0);
const [editingProductWeights, setEditingProductWeights] = useState<
  Record<string, number>
>({});
const [selectedProductIndex, setSelectedProductIndex] = useState(-1);
```

### **Flujo de Estados:**

```
Usuario agrega producto
  ↓
isAddingProduct = true (muestra modal)
  ↓
Usuario ingresa datos
  ↓
handleAddProduct()
  ↓
createProductAction() → BD
  ↓
Recarga proyecto
  ↓
isAddingProduct = false (oculta modal)
  ↓
Gallery se actualiza con nuevo producto
  ↓
Tabla de vistas agrega columna
```

---

## 🎯 Mejoras de UX

### **1. Feedback Visual**

- ✅ Loading states durante operaciones
- ✅ Alertas de confirmación para acciones destructivas
- ✅ Mensajes de éxito/error
- ✅ Disabled states en botones durante operaciones

### **2. Diseño Responsivo**

- Grid adaptable: 1 columna (móvil) → 2 columnas (tablet) → 3 columnas (desktop)
- Cards con hover effects
- Imágenes responsive

### **3. Estado Vacío**

Cuando no hay productos:

```
┌────────────────────────────────┐
│                                │
│            📦                  │
│                                │
│  No hay productos en este      │
│  proyecto                      │
│                                │
│  Agrega productos para         │
│  comenzar                      │
│                                │
│  [+ Agregar Primer Producto]   │
│                                │
└────────────────────────────────┘
```

---

## 🧪 Casos de Uso

### **Caso 1: Proyecto Nuevo**

1. Usuario crea proyecto sin productos
2. Ve estado vacío en pestaña "Productos"
3. Click en "Agregar Primer Producto"
4. Completa formulario
5. Producto aparece en galería
6. Vista se crea automáticamente con columna del producto

### **Caso 2: Agregar Producto a Proyecto Existente**

1. Usuario tiene proyecto con 3 productos
2. Click en "Agregar Producto"
3. Completa nombre: "Silla Premium"
4. Guarda
5. Gallery muestra 4 productos
6. Producto nuevo muestra "Calculando..." como tamaño
7. Usuario sube imágenes del producto
8. Tamaño se actualiza automáticamente a 18.75 MB
9. Tabla de vistas tiene 4 columnas de productos
10. Tamaño total se actualiza

### **Caso 3: Subir Imágenes**

1. Usuario crea producto "Mesa Moderna"
2. Producto aparece con tamaño "Calculando..."
3. Sube archivo ZIP con 36 imágenes (total: 18.75 MB)
4. API calcula tamaño automáticamente
5. Campo weight se actualiza a 18.75
6. Galería muestra "18.75 MB"
7. Tamaño total del proyecto se actualiza

### **Caso 4: Eliminar Producto**

1. Usuario elimina Producto 2 (tamaño: 12.5 MB)
2. Confirmación
3. Producto desaparece de galería
4. Columna desaparece de tabla de vistas
5. Tamaño total se reduce en 12.5 MB
6. Visor 3D se cierra si estaba mostrando ese producto

---

## 📝 Notas Técnicas

### **Performance:**

- Se usa `await` para operaciones de BD en secuencia
- Recarga completa del proyecto después de operaciones críticas
- Estado local para ediciones de peso (sin guardar hasta confirmar)

### **Validaciones:**

- Nombre de producto obligatorio
- Peso por defecto: 0 kg
- Confirmación antes de eliminar

### **Seguridad:**

- Autenticación requerida para todas las operaciones
- Verificación de permisos en actions
- admin_id se asigna automáticamente

---

## 🚀 Próximas Mejoras Posibles

- [ ] Subir imágenes de productos desde la galería
- [ ] Drag & drop para reordenar productos
- [ ] Editar nombre del producto inline
- [ ] Búsqueda/filtrado de productos
- [ ] Ordenamiento por peso
- [ ] Exportar lista de productos a CSV
- [ ] Duplicar producto
- [ ] Vista de lista compacta como alternativa al gallery

---

**Fecha de Implementación:** 11 de noviembre de 2025  
**Archivos Modificados:**

- `src/app/edit-project/[id]/page.tsx`
- Imports agregados de `productActions.ts`

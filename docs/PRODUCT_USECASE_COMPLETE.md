# ProductUseCase - Implementación Completa

## 📋 Resumen

Se ha completado el **ProductUseCase** con todos los métodos necesarios para gestionar el ciclo de vida completo de los productos.

---

## ✅ Métodos Implementados

### 1. **createProduct**

Crea un nuevo producto con validaciones de campos requeridos.

```typescript
async createProduct(product: Product, adminId: string)
```

**Validaciones:**

- ✅ Nombre requerido y no vacío
- ✅ URL XR requerida y no vacía

---

### 2. **addImageToProductAction**

Agrega una imagen a un producto existente.

```typescript
async addImageToProductAction(
  productId: string,
  adminId: string,
  image: ProductImage,
  isFirstImage: boolean
)
```

**Características:**

- ✅ Sube imagen a Supabase Storage
- ✅ Registra en base de datos
- ✅ Asigna como cover si es la primera imagen

---

### 3. **getProductById**

Obtiene un producto específico por su ID.

```typescript
async getProductById(productId: string, adminId: string)
```

**Retorna:**

- Producto con todas sus imágenes
- `null` si no existe o no pertenece al admin

---

### 4. **getAllProducts**

Obtiene todos los productos de un administrador.

```typescript
async getAllProducts(adminId: string)
```

**Retorna:**

- Array de productos con sus imágenes
- Array vacío si no hay productos

---

### 5. **updateProduct** ⭐ NUEVO

Actualiza la información de un producto existente.

```typescript
async updateProduct(
  productId: string,
  adminId: string,
  updates: Partial<Product>
)
```

**Campos actualizables:**

- ✅ `name` - Nombre del producto
- ✅ `description` - Descripción
- ✅ `xr_url` - URL del viewer XR
- ✅ `coverImageId` - Imagen de portada

**Validaciones:**

- ✅ ID del producto requerido
- ✅ Nombre no puede estar vacío si se actualiza
- ✅ URL XR no puede estar vacía si se actualiza
- ✅ Solo actualiza productos del admin autenticado

---

### 6. **deleteProduct** ⭐ NUEVO

Elimina un producto y TODAS sus imágenes asociadas.

```typescript
async deleteProduct(productId: string, adminId: string)
```

**Proceso de eliminación:**

1. ✅ Obtiene el producto y sus imágenes
2. ✅ Elimina archivos de Supabase Storage
3. ✅ Elimina registros de imágenes en BD
4. ✅ Elimina el producto en BD

**Importante:**

- ⚠️ **NO existe eliminación de imagen individual**
- ⚠️ Al eliminar el producto, se eliminan TODAS sus imágenes automáticamente
- ⚠️ La eliminación es irreversible

---

### 7. **searchProducts** ⭐ NUEVO

Busca productos por término de búsqueda.

```typescript
async searchProducts(adminId: string, searchTerm: string)
```

**Búsqueda en:**

- ✅ Nombre del producto (case-insensitive)
- ✅ Descripción del producto (case-insensitive)

**Comportamiento:**

- Si `searchTerm` está vacío → retorna todos los productos
- Usa operador `ILIKE` de PostgreSQL (búsqueda flexible)

---

## 🎯 Server Actions Disponibles

### Archivo: `src/app/actions/productActions.ts`

```typescript
// Crear producto
await createProductAction(productData);

// Agregar imágenes
await addImageToProductAction(productId, files, isFirst);

// Obtener producto por ID
const product = await getProductByIdAction(productId);

// Obtener todos los productos
const products = await getAllProductsAction();

// Actualizar producto
await updateProductAction(productId, { name: "Nuevo nombre" });

// Eliminar producto (y todas sus imágenes)
await deleteProductAction(productId);

// Buscar productos
const results = await searchProductsAction("silla");
```

---

## 🏗️ Arquitectura Implementada

### Capas:

```
┌─────────────────────────────────────────┐
│  Server Actions (productActions.ts)    │  ← Capa de presentación
├─────────────────────────────────────────┤
│  ProductUseCase                         │  ← Lógica de negocio
├─────────────────────────────────────────┤
│  IProductRepository (Interface)         │  ← Puerto/Contrato
├─────────────────────────────────────────┤
│  SupabaseProductRepository              │  ← Implementación
├─────────────────────────────────────────┤
│  Supabase Client + Storage              │  ← Infraestructura
└─────────────────────────────────────────┘
```

---

## 📝 Ejemplo de Uso en Componente

```tsx
"use client";
import {
  getAllProductsAction,
  deleteProductAction,
  updateProductAction,
  searchProductsAction,
} from "@/src/app/actions/productActions";

export default function ProductManager() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar productos
  useEffect(() => {
    getAllProductsAction().then(setProducts);
  }, []);

  // Buscar productos
  const handleSearch = async (term: string) => {
    const results = await searchProductsAction(term);
    setProducts(results);
  };

  // Actualizar producto
  const handleUpdate = async (id: string, name: string) => {
    const { ok } = await updateProductAction(id, { name });
    if (ok) {
      // Recargar productos
      const updated = await getAllProductsAction();
      setProducts(updated);
    }
  };

  // Eliminar producto
  const handleDelete = async (id: string) => {
    const { ok } = await deleteProductAction(id);
    if (ok) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar productos..."
        onChange={(e) => handleSearch(e.target.value)}
      />

      {products.map((product) => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <button onClick={() => handleUpdate(product.id, "Nuevo nombre")}>
            Editar
          </button>
          <button onClick={() => handleDelete(product.id)}>
            Eliminar (⚠️ eliminará todas las imágenes)
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🔒 Reglas de Negocio Implementadas

### ✅ Validaciones:

- Todos los métodos requieren autenticación (adminId)
- Los productos solo son accesibles por su creador
- Nombres y URLs no pueden estar vacíos
- IDs de producto son requeridos

### ⚠️ Restricciones:

- **NO hay eliminación de imagen individual**
- **NO hay reordenamiento de imágenes**
- Al eliminar producto → se eliminan TODAS las imágenes
- Las búsquedas solo retornan productos del admin autenticado

### 🔐 Seguridad:

- Todas las operaciones validan el adminId
- Los archivos se almacenan con ruta: `{adminId}/{productId}/{filename}`
- Las consultas filtran por admin_id en la base de datos

---

## ✅ Estado de Completitud

| Funcionalidad      | Estado          | Notas                |
| ------------------ | --------------- | -------------------- |
| Crear producto     | ✅ Completo     | Con validaciones     |
| Agregar imágenes   | ✅ Completo     | Soporta batch upload |
| Obtener por ID     | ✅ Completo     | Con imágenes         |
| Listar todos       | ✅ Completo     | Con imágenes         |
| Actualizar         | ✅ Completo     | Campos parciales     |
| Eliminar           | ✅ Completo     | Cascada a imágenes   |
| Buscar             | ✅ Completo     | Nombre + descripción |
| Eliminar imagen    | ❌ No requerido | Decisión de diseño   |
| Reordenar imágenes | ❌ No requerido | Decisión de diseño   |

---

## 🎯 Próximos Pasos Sugeridos

Ahora que **ProductUseCase** está completo, los casos de uso **CRÍTICOS** que faltan son:

1. **SurveyUseCase** - Gestión de encuestas
2. **QuestionUseCase** - Gestión de preguntas
3. **AnswerUseCase** - Gestión de respuestas
4. **SurveyParticipantUseCase** - Gestión de participantes

¿Quieres que implemente alguno de estos? 🚀

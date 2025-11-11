# 🗑️ Eliminación en Cascada de Proyectos

## 📋 Descripción

Se ha implementado la funcionalidad de eliminación completa de proyectos, incluyendo todos sus recursos asociados:

- ✅ **Productos** asociados al proyecto
- ✅ **Imágenes** almacenadas en Supabase Storage
- ✅ **Vistas** configuradas
- ✅ **Relaciones vista-producto**

## 🔧 Cambios Implementados

### 1. **SupabaseProjectRepository.ts**

#### Constructor Actualizado

```typescript
constructor(
  private supabaseClient: SupabaseClient,
  private storageRepository?: IStorageRepository,
  private productRepository?: IProductRepository
)
```

Se agregaron dependencias opcionales para manejar la eliminación de imágenes.

#### Método `deleteProject()` Mejorado

**Flujo de eliminación:**

1. **Obtener productos del proyecto**

   - Consulta todos los productos asociados con su `path` de almacenamiento

2. **Eliminar carpetas de imágenes**

   - Por cada producto, elimina su carpeta en Supabase Storage
   - Usa `storageRepository.deleteFolder()` de forma recursiva
   - Intenta eliminar tanto la ruta guardada como la ruta fallback `admin_id/product_id`

3. **Eliminar proyecto de la base de datos**
   - La eliminación en cascada de Supabase automáticamente elimina:
     - Productos (`ON DELETE CASCADE`)
     - Vistas (`ON DELETE CASCADE`)
     - Relaciones vista-producto (`ON DELETE CASCADE`)

**Código:**

```typescript
async deleteProject(projectId: string) {
  // 1. Obtener productos
  const { data: productsData } = await this.supabaseClient
    .from("products")
    .select("product_id, admin_id, path")
    .eq("project_id", projectId);

  // 2. Eliminar imágenes
  for (const product of productsData) {
    if (product.path) {
      await this.storageRepository.deleteFolder(product.path);
    }
    // Fallback path
    const fallbackPath = `${product.admin_id}/${product.product_id}`;
    await this.storageRepository.deleteFolder(fallbackPath);
  }

  // 3. Eliminar proyecto (CASCADE hace el resto)
  await this.supabaseClient
    .from("projects")
    .delete()
    .eq("project_id", projectId);
}
```

### 2. **SupabaseStorageRepository.ts**

#### Método `deleteFolder()` Mejorado

**Características:**

- ✅ Eliminación recursiva de subcarpetas
- ✅ Manejo de hasta 1000 archivos por carpeta
- ✅ Separación entre archivos y carpetas
- ✅ Logs detallados del proceso

**Flujo:**

```typescript
async deleteFolder(folderPath: string) {
  // 1. Listar contenido
  const { data: files } = await this.supabaseClient.storage
    .from("files")
    .list(folderPath, { limit: 1000 });

  // 2. Separar archivos y carpetas
  const filesToDelete = [];
  const foldersToDelete = [];

  for (const file of files) {
    if (file.id === null || !file.name.includes('.')) {
      foldersToDelete.push(fullPath); // Carpeta
    } else {
      filesToDelete.push(fullPath); // Archivo
    }
  }

  // 3. Eliminar subcarpetas (recursivo)
  for (const folder of foldersToDelete) {
    await this.deleteFolder(folder);
  }

  // 4. Eliminar archivos del nivel actual
  await this.supabaseClient.storage
    .from("files")
    .remove(filesToDelete);
}
```

### 3. **projectActions.ts**

#### `deleteProjectAction()` Actualizado

Ahora inyecta los repositorios necesarios:

```typescript
export async function deleteProjectAction(projectId: string) {
  const client = await createClient();

  // Crear repositorios con dependencias
  const storageRepository = new SupabaseStorageRepository(client);
  const productRepository = new SupabaseProductRepository(
    client,
    storageRepository
  );
  const projectRepository = new SupabaseProjectRepository(
    client,
    storageRepository,
    productRepository
  );

  const projectUseCase = new ProjectUseCase(projectRepository);
  return await projectUseCase.deleteProject(projectId);
}
```

### 4. **Dashboard UI**

#### Mensaje de Confirmación Mejorado

```typescript
const handleDelete = async (projectId: string) => {
  const confirmed = window.confirm(
    `⚠️ ¿Estás seguro de que deseas eliminar "${projectName}"?\n\n` +
      `Esto eliminará:\n` +
      `• El proyecto\n` +
      `• Todos los productos asociados\n` +
      `• Todas las imágenes en la nube\n` +
      `• Todas las vistas configuradas\n\n` +
      `Esta acción NO se puede deshacer.`
  );

  if (confirmed) {
    const result = await deleteProjectAction(projectId);
    if (result.ok) {
      alert(`✅ Proyecto "${projectName}" eliminado exitosamente`);
    }
  }
};
```

## 🎯 Resultado Final

Cuando un usuario elimina un proyecto:

1. ✅ Se muestra un mensaje de confirmación detallado
2. ✅ Se eliminan todas las carpetas de imágenes de Supabase Storage
3. ✅ Se eliminan todos los productos de la base de datos
4. ✅ Se eliminan todas las vistas configuradas
5. ✅ Se eliminan todas las relaciones vista-producto
6. ✅ Se elimina el proyecto de la base de datos
7. ✅ Se muestra un mensaje de éxito
8. ✅ Se recarga la lista de proyectos

## 🧪 Logs de Consola

Durante la eliminación, verás logs como:

```
🗑️ Eliminando imágenes de 4 productos...
📂 Carpeta admin-id/product-1 vacía o no existe
🗑️ Eliminando 45 archivos de admin-id/product-2...
✅ Carpeta admin-id/product-2 eliminada exitosamente
✅ Carpeta eliminada: admin-id/product-3
✅ Imágenes eliminadas correctamente
✅ Proyecto abc-123 eliminado correctamente
```

## 📊 Estructura de Base de Datos

Las relaciones CASCADE en Supabase:

```sql
projects (project_id)
  └── products (project_id) ON DELETE CASCADE
       └── view_products (product_id) ON DELETE CASCADE
  └── views (project_id) ON DELETE CASCADE
       └── view_products (view_id) ON DELETE CASCADE
```

## ⚠️ Consideraciones

1. **Rendimiento**: Para proyectos con muchas imágenes (>1000), el proceso puede tardar varios segundos
2. **Reversibilidad**: La eliminación es **permanente** y no se puede deshacer
3. **Permisos**: Solo el propietario del proyecto puede eliminarlo (validado por RLS)
4. **Logs**: Todos los errores se registran en la consola del servidor

## 🔒 Seguridad

- ✅ Validación de autenticación antes de eliminar
- ✅ RLS de Supabase valida permisos
- ✅ Mensaje de confirmación en el cliente
- ✅ Manejo de errores robusto
- ✅ Logs detallados para debugging

## 📝 Próximos Pasos Recomendados

1. Agregar un sistema de "papelera" o soft-delete (opcional)
2. Implementar confirmación con input del nombre del proyecto
3. Agregar barra de progreso para eliminaciones largas
4. Notificaciones toast en lugar de alerts
5. Implementar undo temporal (5 segundos para cancelar)

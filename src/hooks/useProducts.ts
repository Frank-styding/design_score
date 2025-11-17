import { useState, useEffect } from "react";
import { Product } from "@/src/domain/entities/Product";
import {
  getAllProductsAction,
  createProductAction,
  deleteProductAction,
} from "@/src/app/actions/productActions";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar productos
  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedProducts = await getAllProductsAction();
      setProducts(fetchedProducts);
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error cargando productos:", error);
      setError(error.message || "Error al cargar productos");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar productos al montar
  useEffect(() => {
    loadProducts();
  }, []);

  // Crear producto (solo crea en DB, sin archivos)
  const createProduct = async (
    name: string,
    description: string,
    _files: File[] = [] // Parámetro ignorado, mantenido por compatibilidad
  ) => {
    try {
      // Crear el producto en la base de datos
      const newProduct = await createProductAction({
        name,
        description,
        weight: 0,
        admin_id: "", // Se establece automáticamente en la acción
      } as Product);

      if (!newProduct || !newProduct.product_id) {
        return { ok: false, error: "Error al crear producto" };
      }

      /*       console.log(`✅ Producto creado: ${newProduct.product_id}`);
       */
      return { ok: true, product: newProduct };
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error creando producto:", error);
      return { ok: false, error: error.message };
    }
  };

  // Eliminar producto
  const deleteProduct = async (productId: string) => {
    try {
      const result = await deleteProductAction(productId);

      if (result.ok) {
        setProducts((prev) =>
          prev.filter((p) => p.product_id !== productId && p.id !== productId)
        );
        return { ok: true };
      }

      return { ok: false, error: result.error };
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Error eliminando producto:", error);
      return { ok: false, error: error.message };
    }
  };

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    products,
    filteredProducts,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    createProduct,
    deleteProduct,
    refreshProducts: loadProducts,
  };
}

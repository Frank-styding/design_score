"use client";

import { useState, useEffect } from "react";
import { Product } from "@/src/domain/entities/Product";
import { getAllProductsAction } from "@/src/app/actions/productActions";
import ProductCard from "@/src/components/ProductCard";
import Button from "@/src/components/ui/Button";

interface ProductSelectionSectionProps {
  initialSelectedProducts?: string[];
  onProductsSelected: (productIds: string[]) => void;
  onBack: () => void;
}

export default function ProductSelectionSection({
  initialSelectedProducts = [],
  onProductsSelected,
  onBack,
}: ProductSelectionSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set(initialSelectedProducts)
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const fetchedProducts = await getAllProductsAction();
      // Ordenar por fecha de creación (más reciente primero)
      const sortedProducts = fetchedProducts.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Orden descendente
      });
      setProducts(sortedProducts);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleContinue = () => {
    if (selectedProducts.size === 0) {
      alert("Debes seleccionar al menos un producto");
      return;
    }
    onProductsSelected(Array.from(selectedProducts));
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-600">Cargando productos...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-light text-gray-800 mb-6">
        Selecciona los Productos
      </h2>

      {/* Search Bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Buscar productos por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-black px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
        />
        <SearchIcon />
      </div>

      {/* Selected Count */}
      <div className="mb-4 text-sm text-gray-600">
        {selectedProducts.size} producto(s) seleccionado(s)
      </div>

      {/* Products Grid */}
      <div className="max-h-[500px] overflow-y-auto mb-6 border border-gray-200 rounded-lg p-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            {searchTerm
              ? "No se encontraron productos con ese nombre"
              : "No hay productos disponibles. Crea productos primero en el Dashboard."}
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.product_id || product.id}
                product={product}
                selectionMode={true}
                isSelected={selectedProducts.has(
                  product.product_id || product.id || ""
                )}
                onSelect={handleToggleProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button type="button" variant="secondary" onClick={onBack}>
          ← Atrás
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleContinue}
          disabled={selectedProducts.size === 0}
        >
          Continuar ({selectedProducts.size})
        </Button>
      </div>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

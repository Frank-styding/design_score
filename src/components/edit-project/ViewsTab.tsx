import { useRouter } from "next/navigation";
import Button from "@/src/components/ui/Button";
import { View } from "@/src/domain/entities/View";
import { Product } from "@/src/domain/entities/Product";

interface ViewsTabProps {
  views: View[];
  products: Product[];
  viewProducts: Record<string, string[]>;
  onToggleProduct: (viewId: string, productId: string) => Promise<void>;
  onAddView: () => Promise<void>;
  onDeleteView: (viewId: string) => Promise<void>;
}

export function ViewsTab({
  views,
  products,
  viewProducts,
  onToggleProduct,
  onAddView,
  onDeleteView,
}: ViewsTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-light text-gray-800 mb-2">
            Configurar Vistas
          </h2>
          <p className="text-gray-600 text-sm">
            Define qué productos se mostrarán en cada vista
          </p>
        </div>
        <Button type="button" variant="primary" onClick={onAddView}>
          + Agregar Vista
        </Button>
      </div>

      {views.length > 0 ? (
        <div className="overflow-x-auto border border-gray-300 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left text-sm font-medium text-gray-700 border-r border-gray-300 min-w-[150px]">
                  Vista
                </th>
                {products.map((product, i) => (
                  <th
                    key={product.product_id}
                    className="p-3 text-center text-sm font-medium text-gray-700 border-r border-gray-300 min-w-[100px]"
                  >
                    {product.name || `Producto ${i + 1}`}
                  </th>
                ))}
                <th className="p-3 text-center text-sm font-medium text-gray-700 min-w-[120px]">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {views.map((view) => (
                <tr
                  key={view.view_id}
                  className="border-t border-gray-200 hover:bg-gray-50"
                >
                  <td className="p-3 border-r border-gray-300">
                    <span className="text-gray-800 font-medium">
                      Vista {parseInt(view.idx) + 1}
                    </span>
                  </td>
                  {products.map((product) => (
                    <td
                      key={product.product_id}
                      className="p-3 text-center border-r border-gray-300"
                    >
                      <input
                        type="checkbox"
                        checked={(viewProducts[view.view_id!] || []).includes(
                          product.product_id!
                        )}
                        onChange={() =>
                          onToggleProduct(view.view_id!, product.product_id!)
                        }
                        className="w-5 h-5 text-gray-800 cursor-pointer"
                      />
                    </td>
                  ))}
                  <td className="p-3 text-center">
                    <button
                      onClick={() => onDeleteView(view.view_id!)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Eliminar vista"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-300 rounded-lg bg-gray-50">
          <p className="text-gray-600">No hay vistas configuradas</p>
          <p className="text-gray-500 text-sm mt-1">
            Haz clic en "Agregar Vista" para comenzar
          </p>
        </div>
      )}

      <div className="flex justify-start pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/dashboard")}
        >
          ← Volver al Dashboard
        </Button>
      </div>
    </div>
  );
}

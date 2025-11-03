"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UploadFolderForm from "@/src/components/UploadFolderForm";
import { getCurrentUserAction } from "../actions/authActions";

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const result = await getCurrentUserAction();
      if (
        result.success &&
        result.user &&
        result.user.id &&
        result.user.email
      ) {
        setUser({
          id: result.user.id,
          email: result.user.email,
        });
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (productId: string) => {
    console.log("✅ Producto subido:", productId);
    alert("¡Producto subido exitosamente!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">
            No se pudo cargar la información del usuario
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Subir Modelo 3D
          </h1>
          <p className="text-gray-600">
            Usuario: <span className="font-medium">{user.email}</span>
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <UploadFolderForm adminId={user.id} onSuccess={handleSuccess} />
        </div>

        {/* Navigation */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="bg-gray-600 hover:bg-gray-500 text-white py-2 px-6 rounded-lg transition-colors"
          >
            ← Volver al Dashboard
          </button>
          <button
            onClick={() => router.push("/products")}
            className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-6 rounded-lg transition-colors"
          >
            Ver Productos →
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthForm from "../components/AuthForm";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    // Obtener la ruta a la que se debe redirigir después del login
    const redirect = searchParams.get("redirectTo");
    if (redirect) {
      setRedirectTo(redirect);
      /* console.log("📍 Redirigirá a:", redirect); */
    }
  }, [searchParams]);

  const handleAuthSuccess = (authenticatedUser: {
    id: string;
    email: string;
  }) => {
    /*  console.log("✅ Usuario autenticado:", authenticatedUser.email); */

    // Redirigir a la ruta guardada o al dashboard por defecto
    const destination = redirectTo || "/dashboard";
    /*   console.log("🚀 Redirigiendo a:", destination); */
    router.push(destination);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Design Score</h1>
        <p className="text-gray-600">
          Plataforma de visualización 3D interactiva
        </p>
      </div>

      {redirectTo && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md">
          <p className="text-sm text-yellow-800">
            ⚠️ Debes iniciar sesión para acceder a esta página
          </p>
        </div>
      )}

      <AuthForm onAuthSuccess={handleAuthSuccess} />

      <div className="mt-6 text-sm text-gray-500 text-center">
        <p>Inicia sesión para acceder a la plataforma</p>
      </div>
    </div>
  );
}

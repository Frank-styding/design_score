"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthForm from "../components/AuthForm";
import { createBrowserClient } from "@supabase/ssr";

export default function LoginPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  // Verificar si ya hay una sesión activa
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
        );

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          // Si hay sesión activa, redirigir al dashboard
          router.push("/dashboard");
        } else {
          setIsChecking(false);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        setIsChecking(false);
      }
    };

    checkSession();
  }, [router]);

  const handleAuthSuccess = (authenticatedUser: {
    id: string;
    email: string;
  }) => {
    // Redirigir directamente a /dashboard
    router.push("/dashboard");
  };

  // Mostrar un loader mientras verifica la sesión
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-gray-800 mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-light text-gray-800 mb-2">Design Score</h1>
      </div>

      <AuthForm onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}

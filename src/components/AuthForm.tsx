"use client";

import { useState, FormEvent, useEffect } from "react";
import {
  signInAction,
  signUpAction,
  signOutAction,
} from "../app/actions/authActions";

interface AuthFormProps {
  onAuthSuccess: (user: { id: string; email: string }) => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Limpiar formulario cuando se monta el componente
  useEffect(() => {
    setEmail("");
    setPassword("");
    setError(null);
    setMode("signin");
  }, []);

  const handleClearSession = async () => {
    try {
      await signOutAction();
      setError(null);
      setEmail("");
      setPassword("");
      alert("✅ Sesión limpiada. Intenta iniciar sesión nuevamente.");
    } catch (err: any) {
      console.error("Error limpiando sesión:", err);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let result;
      if (mode === "signin") {
        result = await signInAction(email, password);
      } else {
        result = await signUpAction(email, password);
      }

      if (!result.success || !result.user) {
        setError(result.error || "Error en autenticación");
        return;
      }

      onAuthSuccess({
        id: result.user.id,
        email: result.user.email || email,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col bg-gray-800 p-4 rounded mb-6 w-80 mx-auto"
    >
      <h3 className="text-lg font-semibold mb-3 text-white">
        {mode === "signin" ? "Iniciar Sesión" : "Crear Cuenta"}
      </h3>

      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2 p-2 rounded bg-white text-black"
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-3 p-2 rounded bg-white text-black"
        required
      />

      {error && <p className="text-red-400 mb-2">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded mb-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        {isSubmitting
          ? "Procesando..."
          : mode === "signin"
          ? "Entrar"
          : "Registrarse"}
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="text-blue-300 text-sm hover:underline mb-2"
      >
        {mode === "signin"
          ? "¿No tienes cuenta? Regístrate"
          : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
      {/* 
      <button
        type="button"
        onClick={handleClearSession}
        className="text-red-300 text-xs hover:underline"
      >
        🔄 Limpiar sesión (si tienes problemas)
      </button> */}
    </form>
  );
}

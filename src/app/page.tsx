// src/app/(frontend)/components/LoginForm.tsx
"use client";

import { signUpAction } from "@/src/app/actions/authActions";
import { useState } from "react";

export default function Home() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null); // Limpiar error previo

    const result = await signUpAction(formData);

    if (!result.success) {
      setError(result.error || "Ocurrió un error");
    } else {
      // Éxito: redirigir al dashboard
      // (usualmente `router.push('/dashboard')` o `window.location.href`)
      alert("Login exitoso! Usuario: " + result.user?.email);
      // Aquí puedes recargar la página o redirigir
      window.location.href = "/dashboard"; // O usar router.refresh()
    }
  };

  return (
    <form
      action={handleSubmit}
      className="flex bg-gray-800 mx-auto p-4 rounded"
    >
      <h3>Iniciar Sesión</h3>
      <label>
        Email:
        <input
          type="email"
          name="email"
          required
          className="bg-white rounded"
        />
      </label>
      <label>
        Contraseña:
        <input
          type="password"
          name="password"
          required
          className="bg-white rounded"
        />
      </label>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button
        type="submit"
        className="bg-blue-500 text-white rounded px-4 py-2"
      >
        Login
      </button>
    </form>
  );
}

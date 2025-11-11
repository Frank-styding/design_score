"use client";

import { useRouter } from "next/navigation";
import AuthForm from "../components/AuthForm";

export default function LoginPage() {
  const router = useRouter();

  const handleAuthSuccess = (authenticatedUser: {
    id: string;
    email: string;
  }) => {
    // Redirigir directamente a /upload
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-light text-gray-800 mb-2">Design Score</h1>
      </div>

      <AuthForm onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}

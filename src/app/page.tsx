"use client";

import { useState } from "react";
import AuthForm from "../components/AuthForm";
import UploadFolderForm from "../components/UploadFolderForm";
import ViewProduct from "../components/ViewProduct";
import { signOutAction } from "./actions/authActions";

export default function Home() {
  const [displayView, setDisplayView] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  const handleSignOut = async () => {
    await signOutAction();
    setUser(null);
  };

  const handleAuthSuccess = (authenticatedUser: {
    id: string;
    email: string;
  }) => {
    setUser(authenticatedUser);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      {displayView ? (
        !user ? (
          <AuthForm onAuthSuccess={handleAuthSuccess} />
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded mb-6"
            >
              Cerrar Sesión
            </button>

            <UploadFolderForm
              adminId={user.id}
              onSuccess={(productId) => {
                console.log("Producto subido exitosamente:", productId);
              }}
            />
            <button
              className="bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded mt-6"
              onClick={() => setDisplayView(!displayView)}
            >
              {displayView ? "Ver Productos" : "Subir Producto"}
            </button>
          </div>
        )
      ) : (
        <>
          <ViewProduct adminId={user?.id} />
          <button
            className="bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded mt-6"
            onClick={() => setDisplayView(!displayView)}
          >
            {displayView ? "Ver Productos" : "Subir Producto"}
          </button>
        </>
      )}
    </div>
  );
}

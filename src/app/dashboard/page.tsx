"use client";

import ProjectCard from "@/src/components/ProjectCard";
import LoadingModal from "@/src/components/LoadingModal";
import { useDashboard } from "@/src/hooks/useDashboard";
import { signOutAction } from "@/src/app/actions/authActions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DashboardPage() {
  const dashboard = useDashboard();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOutAction();
      router.push("/");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setIsLoggingOut(false);
    }
  };

  if (dashboard.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-800 text-xl">Cargando proyectos...</div>
      </div>
    );
  }

  if (dashboard.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600 text-xl">{dashboard.error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-light text-gray-800 mb-2">
              Dashboard
            </h1>
            <p className="text-gray-600">Gestiona tus proyectos</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={dashboard.handleCreateProject}
              className="px-5 py-2 bg-gray-800 hover:bg-black text-white rounded transition-colors flex items-center gap-2"
            >
              <PlusIcon />
              <span>Nuevo Proyecto</span>
            </button>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Cerrar sesión"
            >
              <LogoutIcon />
              <span>{isLoggingOut ? "Cerrando..." : "Cerrar Sesión"}</span>
            </button>
          </div>
        </div>

        {/* Projects Gallery */}
        {dashboard.projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">No tienes proyectos aún</p>
            <p className="text-gray-500 mt-2">
              Crea tu primer proyecto para comenzar
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            {dashboard.projects.map((project) => (
              <ProjectCard
                key={project.project_id}
                project={project}
                onPlay={dashboard.handlePlay}
                onInfo={dashboard.handleEdit}
                onDelete={dashboard.handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de carga para eliminación */}
      <LoadingModal
        isOpen={dashboard.isDeleting}
        progress={dashboard.deleteProgress}
        message={dashboard.deleteMessage}
        title="Eliminando proyecto..."
      />
    </div>
  );
}

// Icono Plus SVG
function PlusIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

// Icono Logout SVG
function LogoutIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

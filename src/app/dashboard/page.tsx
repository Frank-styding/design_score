"use client";

import { useEffect, useState } from "react";
import {
  getAllProjectsAction,
  deleteProjectAction,
} from "../actions/projectActions";
import ProjectCard from "@/src/components/ProjectCard";
import { Project } from "@/src/domain/entities/Project";
import LoadingModal from "@/src/components/LoadingModal";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para el modal de eliminación
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState(0);
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const projectsList = await getAllProjectsAction();
      setProjects(projectsList);
    } catch (err: any) {
      setError(err.message || "Error inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = (projectId: string) => {
    console.log("Play project:", projectId);
    // Redirigir a la página de visualización del proyecto
    window.location.href = `/project/${projectId}`;
  };

  const handleEdit = (projectId: string) => {
    console.log("Edit project:", projectId);
    // Redirigir a la página de edición del proyecto
    window.location.href = `/edit-project/${projectId}`;
  };

  const handleDelete = async (projectId: string) => {
    const project = projects.find((p) => p.project_id === projectId);
    const projectName = project?.name || "este proyecto";

    const confirmed = window.confirm(
      `⚠️ ¿Estás seguro de que deseas eliminar "${projectName}"?\n\n` +
        `Esto eliminará:\n` +
        `• El proyecto\n` +
        `• Todos los productos asociados (${project?.num_products || 0})\n` +
        `• Todas las imágenes en la nube\n` +
        `• Todas las vistas configuradas\n\n` +
        `Esta acción NO se puede deshacer.`
    );

    if (confirmed) {
      try {
        setIsDeleting(true);
        setDeleteProgress(0);
        setDeleteMessage(`Preparando eliminación de "${projectName}"...`);

        // Simular progreso inicial
        await new Promise((resolve) => setTimeout(resolve, 300));
        setDeleteProgress(10);
        setDeleteMessage(`Eliminando proyecto "${projectName}"...`);

        await new Promise((resolve) => setTimeout(resolve, 200));
        setDeleteProgress(30);
        setDeleteMessage("Eliminando productos asociados...");

        await new Promise((resolve) => setTimeout(resolve, 200));
        setDeleteProgress(50);
        setDeleteMessage("Eliminando imágenes del almacenamiento...");

        await new Promise((resolve) => setTimeout(resolve, 200));
        setDeleteProgress(70);
        setDeleteMessage("Eliminando vistas configuradas...");

        // Ejecutar la eliminación real
        const result = await deleteProjectAction(projectId);

        setDeleteProgress(90);
        setDeleteMessage("Finalizando eliminación...");

        await new Promise((resolve) => setTimeout(resolve, 200));

        if (result.ok) {
          setDeleteProgress(100);
          setDeleteMessage(
            `✅ Proyecto "${projectName}" eliminado exitosamente`
          );

          // Pequeña pausa para mostrar el mensaje de éxito
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Recargar proyectos
          await loadProjects();
        } else {
          throw new Error(result.error || "Error desconocido al eliminar");
        }
      } catch (err: any) {
        setDeleteMessage(`❌ Error: ${err.message}`);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        alert(`❌ Error al eliminar: ${err.message}`);
      } finally {
        setIsDeleting(false);
        setDeleteProgress(0);
        setDeleteMessage("");
      }
    }
  };

  const handleCreateProject = () => {
    // Redirigir a la página de creación de proyecto
    window.location.href = "/create-project";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-800 text-xl">Cargando proyectos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-600 text-xl">{error}</div>
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
          <button
            onClick={handleCreateProject}
            className="px-5 py-2 bg-gray-800 hover:bg-black text-white rounded transition-colors flex items-center gap-2"
          >
            <PlusIcon />
            <span>Nuevo Proyecto</span>
          </button>
        </div>

        {/* Projects Gallery */}
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">No tienes proyectos aún</p>
            <p className="text-gray-500 mt-2">
              Crea tu primer proyecto para comenzar
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.project_id}
                project={project}
                onPlay={handlePlay}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de carga para eliminación */}
      <LoadingModal
        isOpen={isDeleting}
        progress={deleteProgress}
        message={deleteMessage}
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

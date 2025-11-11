import { useProjects } from "./useProjects";
import { useProjectDeletion } from "./useProjectDeletion";
import { useProjectNavigation } from "./useProjectNavigation";

/**
 * Hook principal para manejar toda la lógica del Dashboard
 */
export function useDashboard() {
  const projectsState = useProjects();
  const deletionState = useProjectDeletion();
  const navigation = useProjectNavigation();

  /**
   * Maneja el evento de reproducir/visualizar un proyecto
   */
  const handlePlay = (projectId: string) => {
    console.log("Play project:", projectId);
    navigation.navigateToPlay(projectId);
  };

  /**
   * Maneja el evento de editar un proyecto
   */
  const handleEdit = (projectId: string) => {
    console.log("Edit project:", projectId);
    navigation.navigateToEdit(projectId);
  };

  /**
   * Maneja el evento de eliminar un proyecto
   */
  const handleDelete = async (projectId: string) => {
    const project = projectsState.findProject(projectId);
    const projectName = project?.name || "este proyecto";
    const numProducts = project?.num_products || 0;

    // Confirmar con el usuario
    const confirmed = deletionState.confirmDeletion(projectName, numProducts);
    if (!confirmed) return;

    // Ejecutar eliminación con progreso
    const result = await deletionState.deleteProject(projectId, projectName);

    if (result.success) {
      // Recargar proyectos después de eliminar exitosamente
      await projectsState.loadProjects();
    } else {
      // Mostrar error al usuario
      alert(`❌ Error al eliminar: ${result.error}`);
    }
  };

  /**
   * Maneja el evento de crear un nuevo proyecto
   */
  const handleCreateProject = () => {
    navigation.navigateToCreate();
  };

  return {
    // Estado de proyectos
    projects: projectsState.projects,
    isLoading: projectsState.isLoading,
    error: projectsState.error,

    // Estado de eliminación
    isDeleting: deletionState.isDeleting,
    deleteProgress: deletionState.deleteProgress,
    deleteMessage: deletionState.deleteMessage,

    // Acciones
    handlePlay,
    handleEdit,
    handleDelete,
    handleCreateProject,
    reloadProjects: projectsState.loadProjects,
  };
}

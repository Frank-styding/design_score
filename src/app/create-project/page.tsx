"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProjectAction } from "../actions/projectActions";
import { createProductAction } from "../actions/productActions";
import {
  createViewAction,
  assignProductsToViewAction,
} from "../actions/viewActions";
import Button from "@/src/components/ui/Button";
import FileUploadSection from "@/src/components/create-project/FileUploadSection";
import ProjectInfoForm from "@/src/components/create-project/ProjectInfoForm";
import ViewsConfigSection from "@/src/components/create-project/ViewsConfigSection";
import LoadingModal from "@/src/components/LoadingModal";

type Step = "info" | "upload" | "views";

export default function CreateProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>("info");
  const [projectData, setProjectData] = useState({
    name: "",
    finalMessage: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [views, setViews] = useState<{ name: string; products: boolean[] }[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");

  const handleProjectInfoSubmit = (data: {
    name: string;
    finalMessage: string;
  }) => {
    setProjectData(data);
    setCurrentStep("upload");
  };

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files);

    const numProducts = files.length;

    // Inicializar vistas basadas en la cantidad de archivos subidos
    if (views.length === 0) {
      const initialViews = [
        {
          name: "Vista 1",
          products: Array(numProducts).fill(false),
        },
      ];
      setViews(initialViews);
    } else {
      // Ajustar vistas existentes al nuevo número de productos
      const updatedViews = views.map((view) => {
        const currentProducts = view.products;
        const newProducts = Array(numProducts).fill(false);

        // Mantener los valores existentes hasta el nuevo límite
        for (
          let i = 0;
          i < Math.min(currentProducts.length, numProducts);
          i++
        ) {
          newProducts[i] = currentProducts[i];
        }

        return { ...view, products: newProducts };
      });
      setViews(updatedViews);
    }

    setCurrentStep("views");
  };

  const handleCreateProject = async () => {
    let createdProject: any = null;
    let createdProducts: any[] = [];

    try {
      setLoadingProgress(0);
      setLoadingMessage("");

      // 1. Crear el proyecto
      const projectResult = await createProjectAction({
        name: projectData.name,
        num_products: uploadedFiles.length,
        final_message: projectData.finalMessage || undefined,
      });

      if (!projectResult.ok || !projectResult.project) {
        throw new Error(projectResult.error || "Error al crear proyecto");
      }

      createdProject = projectResult.project;

      // 2. Crear los productos
      const productPromises = Array.from(
        { length: uploadedFiles.length },
        (_, i) =>
          createProductAction({
            project_id: createdProject.project_id!,
            name: `Producto ${i + 1}`,
            idx: i.toString(),
          } as any)
      );

      const products = await Promise.all(productPromises);

      if (products.some((p) => !p)) {
        throw new Error("Error al crear algunos productos");
      }

      createdProducts = products;

      // 3. Subir archivos RAR/ZIP para cada producto - MOSTRAR MODAL AQUÍ
      if (uploadedFiles.length > 0) {
        setIsSubmitting(true); // Mostrar modal solo para la subida
        setLoadingMessage("Preparando subida de archivos...");

        // Pequeño delay para asegurar que el modal se muestre
        await new Promise((resolve) => setTimeout(resolve, 100));

        for (
          let i = 0;
          i < Math.min(uploadedFiles.length, createdProducts.length);
          i++
        ) {
          const file = uploadedFiles[i];
          const product = createdProducts[i];

          if (product && product.product_id) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("product_id", product.product_id);
            formData.append("admin_id", product.admin_id);

            // Establecer mensaje inicial para este archivo
            setLoadingMessage(
              `Iniciando subida del archivo ${i + 1}/${uploadedFiles.length}...`
            );

            try {
              const baseProgress = (i / uploadedFiles.length) * 100;
              const progressRange = 100 / uploadedFiles.length;

              // Usar fetch para enviar y recibir stream
              const response = await fetch("/api/upload-rar-stream", {
                method: "POST",
                body: formData,
              });

              console.log("📡 Response status:", response.status);
              console.log(
                "📡 Response headers:",
                Object.fromEntries(response.headers.entries())
              );

              if (!response.ok) {
                const errorText = await response.text();
                console.error(
                  "❌ Error en respuesta (primeros 500 chars):",
                  errorText.substring(0, 500)
                );

                // Intentar extraer el mensaje de error del HTML si es posible
                let errorMessage = `Error ${response.status}: ${response.statusText}`;
                if (errorText.includes("Error:")) {
                  const match = errorText.match(/Error:\s*([^<\n]+)/);
                  if (match) {
                    errorMessage = match[1];
                  }
                }

                throw new Error(errorMessage);
              }

              // Verificar que la respuesta es realmente un stream SSE
              const contentType = response.headers.get("content-type");
              console.log("📡 Content-Type:", contentType);

              if (!contentType || !contentType.includes("text/event-stream")) {
                const text = await response.text();
                console.error(
                  "❌ Respuesta no es SSE (primeros 500 chars):",
                  text.substring(0, 500)
                );
                throw new Error(
                  "El servidor no respondió con un stream válido. Revisa los logs del servidor."
                );
              }

              const reader = response.body?.getReader();
              const decoder = new TextDecoder();

              if (reader) {
                let done = false;
                let buffer = "";

                while (!done) {
                  const { value, done: streamDone } = await reader.read();
                  done = streamDone;

                  if (value) {
                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split("\n");

                    // Guardar la última línea incompleta
                    buffer = lines.pop() || "";

                    for (const line of lines) {
                      if (line.startsWith("data: ")) {
                        try {
                          const jsonStr = line.substring(6).trim();

                          // Saltar líneas vacías
                          if (!jsonStr) continue;

                          // Verificar que parece JSON antes de parsear
                          if (
                            !jsonStr.startsWith("{") &&
                            !jsonStr.startsWith("[")
                          ) {
                            console.warn(
                              "Línea SSE no es JSON:",
                              jsonStr.substring(0, 50)
                            );
                            continue;
                          }

                          const data = JSON.parse(jsonStr);

                          if (data.type === "progress") {
                            let phaseProgress = 0;

                            if (data.phase === "upload-complete") {
                              phaseProgress = 10;
                              setLoadingMessage(
                                `Archivo ${i + 1}/${
                                  uploadedFiles.length
                                } - Recibido en servidor`
                              );
                            } else if (data.phase === "extracting") {
                              phaseProgress = 20;
                              setLoadingMessage(
                                `Archivo ${i + 1}/${
                                  uploadedFiles.length
                                } - Extrayendo archivos...`
                              );
                            } else if (data.phase === "extracted") {
                              phaseProgress = 30;
                              setLoadingMessage(
                                `Archivo ${i + 1}/${uploadedFiles.length} - ${
                                  data.imageCount
                                } imágenes extraídas`
                              );
                            } else if (data.phase === "uploading-images") {
                              // 30% base + hasta 65% según progreso de imágenes
                              phaseProgress =
                                30 + (data.percentage || 0) * 0.65;
                              setLoadingMessage(
                                `Archivo ${i + 1}/${
                                  uploadedFiles.length
                                } - Subiendo imagen ${data.uploaded}/${
                                  data.total
                                } a la BD (${data.percentage}%)`
                              );
                            } else if (data.phase === "images-uploaded") {
                              phaseProgress = 95;
                              setLoadingMessage(
                                `Archivo ${i + 1}/${uploadedFiles.length} - ${
                                  data.uploaded
                                } imágenes subidas a la BD`
                              );
                            } else if (data.phase === "updating-product") {
                              phaseProgress = 98;
                              setLoadingMessage(
                                `Archivo ${i + 1}/${
                                  uploadedFiles.length
                                } - Actualizando producto...`
                              );
                            }

                            const totalProgress =
                              baseProgress +
                              (phaseProgress / 100) * progressRange;
                            setLoadingProgress(Math.round(totalProgress));
                          } else if (data.type === "complete") {
                            const totalProgress = baseProgress + progressRange;
                            setLoadingProgress(Math.round(totalProgress));
                            setLoadingMessage(
                              `Archivo ${i + 1}/${
                                uploadedFiles.length
                              } completado - ${
                                data.imageCount
                              } imágenes en la BD`
                            );
                            console.log(
                              `✅ Archivo ${i + 1} procesado: ${
                                data.imageCount
                              } imágenes`
                            );
                          } else if (data.type === "error") {
                            console.error(`❌ Error: ${data.message}`);
                            throw new Error(data.message);
                          }
                        } catch (parseError: any) {
                          // Ignorar errores de parsing de líneas incompletas
                          if (!line.includes("</html>")) {
                            console.warn(
                              "Error parseando línea SSE:",
                              parseError.message,
                              "Línea:",
                              line.substring(0, 50)
                            );
                          }
                        }
                      }
                    }
                  }
                }
              }

              // Pequeño delay para que se vea el mensaje
              await new Promise((resolve) => setTimeout(resolve, 500));
            } catch (error: any) {
              console.error(`Error subiendo producto ${i + 1}:`, error.message);
              setLoadingMessage(`Error en archivo ${i + 1}: ${error.message}`);
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          }
        }

        setLoadingProgress(100);
        setLoadingMessage("¡Archivos subidos exitosamente!");

        // Esperar un momento antes de ocultar el modal
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSubmitting(false); // Ocultar modal
      }

      // 4. Crear las vistas configuradas (sin modal)
      const viewCreationResults = await Promise.all(
        views.map((view, idx) =>
          createViewAction(createdProject.project_id!, idx.toString())
        )
      );

      // Log de resultados de vistas para debug
      viewCreationResults.forEach((result, idx) => {
        if (!result.ok) {
          console.error(`❌ Error creando vista ${idx + 1}:`, result.error);
        } else {
          console.log(`✅ Vista ${idx + 1} creada: ${result.view?.view_id}`);
        }
      });

      const failedViews = viewCreationResults.filter((v) => !v.ok);
      if (failedViews.length > 0) {
        console.warn(
          `⚠️ ${failedViews.length} vista(s) no se pudieron crear, pero continuando con el proceso...`
        );
      }

      // 5. Asignar productos a cada vista según la configuración de checkboxes
      for (let viewIdx = 0; viewIdx < views.length; viewIdx++) {
        const viewConfig = views[viewIdx];
        const viewResult = viewCreationResults[viewIdx];

        if (viewResult.ok && viewResult.view) {
          // Obtener los IDs de productos que están marcados como true
          const selectedProductIds = viewConfig.products
            .map((isSelected, productIdx) =>
              isSelected ? createdProducts[productIdx]?.product_id : null
            )
            .filter((id): id is string => id !== null);

          if (selectedProductIds.length > 0) {
            console.log(
              `Asignando ${selectedProductIds.length} productos a vista ${
                viewIdx + 1
              }`
            );

            const assignResult = await assignProductsToViewAction(
              viewResult.view.view_id!,
              selectedProductIds
            );

            if (!assignResult.ok) {
              console.error(
                `❌ Error asignando productos a vista ${viewIdx + 1}:`,
                assignResult.error
              );
            } else {
              console.log(`✅ Productos asignados a vista ${viewIdx + 1}`);
            }
          } else {
            console.log(
              `ℹ️ Vista ${viewIdx + 1} no tiene productos seleccionados`
            );
          }
        } else {
          console.warn(
            `⚠️ Saltando asignación de productos para vista ${
              viewIdx + 1
            } (no se creó correctamente)`
          );
        }
      }

      console.log("✅ Proyecto creado completamente");
      // Redireccionar al dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error("❌ Error creando proyecto:", error);

      // ROLLBACK: Eliminar todo lo creado si hubo un error
      setLoadingMessage("Error detectado. Realizando limpieza...");

      try {
        // Importar la acción de eliminación
        const { deleteProjectAction } = await import(
          "@/src/app/actions/projectActions"
        );

        // Si se creó el proyecto, eliminarlo (esto eliminará automáticamente productos, vistas e imágenes)
        if (createdProject?.project_id) {
          console.log("🗑️ Eliminando proyecto y recursos asociados...");
          const deleteResult = await deleteProjectAction(
            createdProject.project_id
          );

          if (deleteResult.ok) {
            console.log(
              "✅ Rollback completado: Proyecto y recursos eliminados"
            );
          } else {
            console.error("⚠️ Error en rollback:", deleteResult.error);
          }
        }
      } catch (rollbackError: any) {
        console.error("❌ Error durante rollback:", rollbackError.message);
      }

      // Mostrar error al usuario
      alert(
        `❌ Error al crear el proyecto: ${error.message}\n\n` +
          `Los cambios han sido revertidos automáticamente.`
      );
      setIsSubmitting(false);
      setLoadingProgress(0);
      setLoadingMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light text-gray-800 mb-2">
            Crear Nuevo Proyecto
          </h1>
          <p className="text-gray-600">
            Completa los pasos para crear tu proyecto
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          <StepIndicator
            step={1}
            label="Información"
            isActive={currentStep === "info"}
            isCompleted={currentStep === "upload" || currentStep === "views"}
          />
          <div className="w-16 h-0.5 bg-gray-300" />
          <StepIndicator
            step={2}
            label="Archivos"
            isActive={currentStep === "upload"}
            isCompleted={currentStep === "views"}
          />
          <div className="w-16 h-0.5 bg-gray-300" />
          <StepIndicator
            step={3}
            label="Vistas"
            isActive={currentStep === "views"}
            isCompleted={false}
          />
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-300 rounded-lg p-8 shadow-md">
          {currentStep === "info" && (
            <ProjectInfoForm
              onSubmit={handleProjectInfoSubmit}
              initialData={projectData}
            />
          )}

          {currentStep === "upload" && (
            <FileUploadSection
              initialFiles={uploadedFiles}
              onFilesUploaded={handleFilesUploaded}
              onBack={() => setCurrentStep("info")}
            />
          )}

          {currentStep === "views" && (
            <ViewsConfigSection
              numProducts={uploadedFiles.length}
              views={views}
              onViewsChange={setViews}
              onBack={() => setCurrentStep("upload")}
              onSubmit={handleCreateProject}
              isSubmitting={isSubmitting}
            />
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-4 text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="hover:underline"
          >
            ← Volver al Dashboard
          </Button>
        </div>
      </div>

      {/* Loading Modal */}
      <LoadingModal
        isOpen={isSubmitting}
        progress={loadingProgress}
        message={loadingMessage}
      />
    </div>
  );
}

// Componente indicador de paso
function StepIndicator({
  step,
  label,
  isActive,
  isCompleted,
}: {
  step: number;
  label: string;
  isActive: boolean;
  isCompleted: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
          isCompleted
            ? "bg-gray-800 text-white"
            : isActive
            ? "bg-gray-600 text-white"
            : "bg-gray-200 text-gray-500"
        }`}
      >
        {isCompleted ? "✓" : step}
      </div>
      <span
        className={`text-sm ${
          isActive || isCompleted ? "text-gray-800" : "text-gray-500"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

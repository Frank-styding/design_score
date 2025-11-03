"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUserAction } from "../actions/authActions";
import CreateSurveyWizard from "@/src/components/CreateSurveyWizard";
import {
  getAllSurveysAction,
  updateSurveyAction,
  deleteSurveyAction,
} from "../actions/surveyActions";
import { Survey } from "@/src/domain/entities/Survey";

export default function SurveysPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loadingSurveys, setLoadingSurveys] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const result = await getCurrentUserAction();
      if (
        result.success &&
        result.user &&
        result.user.id &&
        result.user.email
      ) {
        setUser({
          id: result.user.id,
          email: result.user.email,
        });
        loadSurveys(result.user.id);
      }
    } catch (error) {
      console.error("Error al cargar usuario:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSurveys = async (userId: string) => {
    try {
      setLoadingSurveys(true);
      /*    console.log("📋 Cargando encuestas para usuario:", userId); */
      const result = await getAllSurveysAction(userId);
      /*  console.log("📥 Resultado getAllSurveys:", result); */

      if (result.ok && result.surveys) {
        /*   console.log("✅ Encuestas cargadas:", result.surveys.length); */
        setSurveys(result.surveys);
      } else {
        console.error("❌ Error en resultado:", result.error);
      }
    } catch (error) {
      console.error("❌ Error cargando encuestas:", error);
    } finally {
      setLoadingSurveys(false);
    }
  };

  const handleSurveyCreated = () => {
    setShowCreateWizard(false);
    if (user) {
      loadSurveys(user.id);
    }
  };

  const toggleSurveyPublic = async (
    surveyId: string | number,
    currentStatus: boolean
  ) => {
    try {
      const result = await updateSurveyAction(surveyId, {
        isPublic: !currentStatus,
      });
      if (result.ok) {
        // Recargar encuestas
        if (user) {
          loadSurveys(user.id);
        }
      } else {
        alert("Error al actualizar el estado: " + result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al actualizar el estado");
    }
  };

  const handleDeleteSurvey = async (
    surveyId: string | number,
    surveyTitle: string
  ) => {
    if (
      !confirm(
        `¿Estás seguro de eliminar la encuesta "${surveyTitle}"?\n\nEsta acción eliminará también todas las preguntas, respuestas y participantes asociados.\n\n⚠️ Esta acción NO se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      const result = await deleteSurveyAction(surveyId);
      if (result.ok) {
        alert("✅ Encuesta eliminada exitosamente");
        if (user) {
          loadSurveys(user.id);
        }
      } else {
        alert("❌ Error al eliminar: " + result.error);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ Error al eliminar la encuesta");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">
            No se pudo cargar la información del usuario
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-purple-600 hover:text-purple-800 mb-2 flex items-center gap-2"
            >
              ← Volver al Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-800">
              Gestión de Encuestas
            </h1>
          </div>
          <button
            onClick={() => setShowCreateWizard(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            ➕ Nueva Encuesta
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Wizard de creación */}
        {showCreateWizard ? (
          <CreateSurveyWizard
            userId={user.id}
            onSuccess={handleSurveyCreated}
            onCancel={() => setShowCreateWizard(false)}
          />
        ) : (
          <>
            {/* Lista de encuestas */}
            {loadingSurveys ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : surveys.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">📋</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  No hay encuestas todavía
                </h2>
                <p className="text-gray-600 mb-6">
                  Crea tu primera encuesta para empezar a recopilar opiniones
                </p>
                <button
                  onClick={() => setShowCreateWizard(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white py-3 px-8 rounded-lg transition-colors"
                >
                  ➕ Crear Primera Encuesta
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {surveys.map((survey) => (
                  <div
                    key={survey.id}
                    className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <button
                        onClick={() =>
                          toggleSurveyPublic(survey.id!, survey.isPublic)
                        }
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          survey.isPublic
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {survey.isPublic ? "✓ Pública" : "⏸ Privada"}
                      </button>
                    </div>

                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {survey.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {survey.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>🔑 {survey.password || "Sin contraseña"}</span>
                    </div>

                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/surveys/${String(survey.id).replace(
                              /-/g,
                              "_"
                            )}/edit`
                          )
                        }
                        className="flex-1 bg-purple-100 text-purple-700 py-2 rounded-lg hover:bg-purple-200 transition-colors text-sm font-medium"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/surveys/${String(survey.id).replace(
                              /-/g,
                              "_"
                            )}/results`
                          )
                        }
                        className="flex-1 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                      >
                        📊 Resultados
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteSurvey(survey.id!, survey.title)
                        }
                        className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

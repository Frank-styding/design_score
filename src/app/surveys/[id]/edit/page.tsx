"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCurrentUserAction } from "@/src/app/actions/authActions";
import {
  getSurveyByIdAction,
  updateSurveyAction,
} from "@/src/app/actions/surveyActions";
import { Survey } from "@/src/domain/entities/Survey";

export default function EditSurveyPage() {
  const router = useRouter();
  const params = useParams();
  const surveyIdParam = params?.id as string;
  // Convertir underscores de vuelta a guiones para UUID
  const surveyId = surveyIdParam?.replace(/_/g, "-") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);

  // Formulario
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [password, setPassword] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      console.log("🔍 EditSurvey - Survey ID:", surveyId);

      // Verificar usuario
      const userResult = await getCurrentUserAction();
      console.log("👤 User Result:", userResult);

      if (!userResult.success || !userResult.user?.id) {
        router.push("/login");
        return;
      }

      setUser({
        id: userResult.user.id,
        email: userResult.user.email || "",
      });

      // Cargar encuesta
      console.log("📥 Cargando encuesta con ID:", surveyId);
      const surveyResult = await getSurveyByIdAction(surveyId);
      console.log("📋 Survey Result:", surveyResult);

      if (!surveyResult.ok || !surveyResult.survey) {
        console.error("❌ Error en surveyResult:", surveyResult.error);
        alert(
          "No se pudo cargar la encuesta: " +
            (surveyResult.error || "Error desconocido")
        );
        router.push("/surveys");
        return;
      }

      // Verificar que es el dueño
      console.log("🔐 Verificando permisos:", {
        surveyAdminId: surveyResult.survey.adminId,
        currentUserId: userResult.user.id,
      });

      if (surveyResult.survey.adminId !== userResult.user.id) {
        alert("No tienes permiso para editar esta encuesta");
        router.push("/surveys");
        return;
      }

      setSurvey(surveyResult.survey);
      setTitle(surveyResult.survey.title);
      setDescription(surveyResult.survey.description);
      setPassword(surveyResult.survey.password || "");
      setIsPublic(surveyResult.survey.isPublic);

      console.log("✅ Encuesta cargada correctamente");
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
      alert("Error al cargar la encuesta: " + (error as Error).message);
      router.push("/surveys");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      alert("Por favor completa todos los campos requeridos");
      return;
    }

    try {
      setSaving(true);

      const updates: Partial<Survey> = {
        title: title.trim(),
        description: description.trim(),
        password: password.trim() || undefined,
        isPublic,
      };

      const result = await updateSurveyAction(surveyId, updates);

      if (result.ok) {
        alert("✅ Encuesta actualizada exitosamente");
        router.push("/surveys");
      } else {
        alert("❌ Error: " + result.error);
      }
    } catch (error: any) {
      console.error("Error guardando:", error);
      alert("❌ Error al guardar: " + error.message);
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push("/surveys")}
            className="text-purple-600 hover:text-purple-800 mb-2 flex items-center gap-2"
          >
            ← Volver a Encuestas
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Editar Encuesta</h1>
        </div>
      </header>

      {/* Formulario */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              placeholder="Título de la encuesta"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              placeholder="Describe el propósito de la encuesta"
            />
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña (opcional)
            </label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              placeholder="Deja en blanco para acceso sin contraseña"
            />
            <p className="text-sm text-gray-500 mt-1">
              Si defines una contraseña, los participantes deberán ingresarla
              para acceder
            </p>
          </div>

          {/* Estado Público/Privado */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-5 w-5 text-purple-600 rounded"
              />
              <div>
                <div className="font-medium text-gray-900">
                  {isPublic ? "✓ Encuesta Pública" : "⏸ Encuesta Privada"}
                </div>
                <div className="text-sm text-gray-600">
                  {isPublic
                    ? "Visible y accesible para participantes"
                    : "Oculta, no aparecerá en búsquedas"}
                </div>
              </div>
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => router.push("/surveys")}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "💾 Guardar Cambios"}
            </button>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-6 space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Información</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• ID de la encuesta: #{surveyId}</li>
              <li>• Esta página solo permite editar información básica</li>
              <li>
                • Para editar preguntas, usa el botón "Editar Preguntas" abajo
              </li>
            </ul>
          </div>

          {/* Botón para editar preguntas */}
          <button
            onClick={() =>
              router.push(`/surveys/${surveyIdParam}/edit-questions`)
            }
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg flex items-center justify-center gap-2"
          >
            ❓ Editar Preguntas de la Encuesta
          </button>
        </div>
      </main>
    </div>
  );
}

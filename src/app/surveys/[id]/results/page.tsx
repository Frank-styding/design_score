"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCurrentUserAction } from "@/src/app/actions/authActions";
import {
  getSurveyByIdAction,
  getAnswersBySurveyIdAction,
  getQuestionsBySurveyIdAction,
  getParticipantsByIdsAction,
} from "@/src/app/actions/surveyActions";
import { getAllPublicProductsAction } from "@/src/app/actions/productActions";
import { Survey } from "@/src/domain/entities/Survey";
import { Answer } from "@/src/domain/entities/Answer";
import { Question } from "@/src/domain/entities/Question";
import { Product } from "@/src/domain/entities/Product";
import { SurveyParticipant } from "@/src/domain/entities/SurveyParticipant";

interface AnswerWithDetails extends Answer {
  questionTitle?: string;
  productName?: string;
}

export default function SurveyResultsPage() {
  const router = useRouter();
  const params = useParams();
  const surveyIdParam = params?.id as string;
  // Convertir underscores de vuelta a guiones para UUID
  const surveyId = surveyIdParam?.replace(/_/g, "-") || "";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [participants, setParticipants] = useState<SurveyParticipant[]>([]);

  // Estadísticas
  const [totalResponses, setTotalResponses] = useState(0);
  const [uniqueParticipants, setUniqueParticipants] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      console.log("🔍 Results - Survey ID:", surveyId);

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
        alert("No tienes permiso para ver estos resultados");
        router.push("/surveys");
        return;
      }

      setSurvey(surveyResult.survey);

      // Cargar preguntas
      console.log("📥 Cargando preguntas...");
      const questionsResult = await getQuestionsBySurveyIdAction(surveyId);
      if (questionsResult.ok && questionsResult.questions) {
        setQuestions(questionsResult.questions);
        console.log("✅ Preguntas cargadas:", questionsResult.questions.length);
      }

      // Cargar productos
      console.log("📥 Cargando productos...");
      const productsData = await getAllPublicProductsAction();
      setProducts(productsData);
      console.log("✅ Productos cargados:", productsData.length);

      // Cargar respuestas
      console.log("📥 Cargando respuestas...");
      const answersResult = await getAnswersBySurveyIdAction(surveyId);
      console.log("📋 Answers Result:", answersResult);

      if (answersResult.ok && answersResult.answers) {
        setAnswers(answersResult.answers);
        calculateStats(answersResult.answers);

        // Cargar participantes únicos
        const uniqueParticipantIds = [
          ...new Set(answersResult.answers.map((a) => a.participantId)),
        ];
        console.log("👥 Cargando participantes:", uniqueParticipantIds.length);
        const participantsResult = await getParticipantsByIdsAction(
          uniqueParticipantIds
        );
        if (participantsResult.ok && participantsResult.participants) {
          setParticipants(participantsResult.participants);
          console.log(
            "✅ Participantes cargados:",
            participantsResult.participants.length
          );
        }
      }

      console.log("✅ Datos cargados correctamente");
    } catch (error) {
      console.error("❌ Error cargando datos:", error);
      alert("Error al cargar los resultados: " + (error as Error).message);
      router.push("/surveys");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (answersData: Answer[]) => {
    // Total de respuestas
    setTotalResponses(answersData.length);

    // Participantes únicos
    const uniqueParticipantIds = new Set(
      answersData.map((a) => a.participantId)
    );
    setUniqueParticipants(uniqueParticipantIds.size);
  };

  const getQuestionTitle = (questionId: string | number): string => {
    const question = questions.find((q) => String(q.id) === String(questionId));
    return question?.title || `Pregunta ${questionId}`;
  };

  const getProductName = (productId: string): string => {
    const product = products.find((p) => p.id === productId);
    return product?.name || `[Producto no encontrado: ${productId.substring(0, 8)}...]`;
  };

  const getParticipantName = (participantId: string): string => {
    const participant = participants.find((p) => p.id === participantId);
    return participant?.name || `Participante ${participantId.substring(0, 8)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push("/surveys")}
            className="text-purple-600 hover:text-purple-800 mb-2 flex items-center gap-2"
          >
            ← Volver a Encuestas
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                📊 Resultados de la Encuesta
              </h1>
              <p className="text-gray-600 mt-1">{survey?.title}</p>
            </div>
            <button
              onClick={() => router.push(`/surveys/${surveyId}/edit`)}
              className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              ✏️ Editar Encuesta
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-3xl">📝</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Respuestas</p>
                <p className="text-3xl font-bold text-gray-900">
                  {totalResponses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <span className="text-3xl">👥</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Participantes</p>
                <p className="text-3xl font-bold text-gray-900">
                  {uniqueParticipants}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información de la encuesta */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Información de la Encuesta
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Descripción</p>
              <p className="text-gray-900">{survey?.description}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <div
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  survey?.isPublic
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {survey?.isPublic ? "✓ Pública" : "⏸ Privada"}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-600">Preguntas</p>
              <p className="text-gray-900">
                {survey?.questions?.length || 0} pregunta(s)
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contraseña</p>
              <p className="text-gray-900">
                {survey?.password || "Sin contraseña"}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de respuestas */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Todas las Respuestas ({answers.length})
          </h2>

          {answers.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                No hay respuestas todavía
              </h3>
              <p className="text-gray-600">
                Comparte tu encuesta para empezar a recibir respuestas
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <div
                  key={answer.id || index}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                          👤 {getParticipantName(answer.participantId)}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900 mb-2">
                        📝 Pregunta: {getQuestionTitle(answer.questionId)}
                      </p>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="font-medium">Seleccionó:</span>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                          {getProductName(answer.answer_option)}
                        </span>
                      </p>
                    </div>
                  </div>
                  {answer.comment && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900 font-medium mb-1">
                        💬 Comentario:
                      </p>
                      <p className="text-sm text-gray-700">{answer.comment}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Acciones adicionales */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => alert("Funcionalidad de exportar próximamente")}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            📥 Exportar a CSV
          </button>
          <button
            onClick={() => alert("Funcionalidad de análisis próximamente")}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            📈 Análisis Detallado
          </button>
        </div>
      </main>
    </div>
  );
}

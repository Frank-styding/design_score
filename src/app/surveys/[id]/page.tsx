"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getSurveyByIdAction,
  getQuestionsBySurveyIdAction,
  createParticipantAction,
  createAnswerAction,
  getProductsByQuestionIdAction,
} from "@/src/app/actions/surveyActions";
import { getAllPublicProductsAction } from "@/src/app/actions/productActions";
import { getCurrentUserAction } from "@/src/app/actions/authActions";
import { Survey } from "@/src/domain/entities/Survey";
import { Question } from "@/src/domain/entities/Question";
import { Product } from "@/src/domain/entities/Product";
import { Answer } from "@/src/domain/entities/Answer";
import { SurveyParticipant } from "@/src/domain/entities/SurveyParticipant";

// Importación dinámica del visor KeyShot XR
const KeyShotXRViewer = dynamic(
  () => import("@/src/components/KeyShotXRViewer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Cargando visor 3D...</p>
      </div>
    ),
  }
);

export default function PublicSurveyPage() {
  const router = useRouter();
  const params = useParams();
  const surveyIdParam = params?.id as string;
  // Convertir underscores de vuelta a guiones para UUID
  const surveyId = surveyIdParam?.replace(/_/g, "-") || "";

  const [loading, setLoading] = useState(true);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionProducts, setQuestionProducts] = useState<
    Map<number, Product[]>
  >(new Map());
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);

  // Visor 3D
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);

  // Autenticación
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Participante
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");

  // Respuestas
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<number, string>>(new Map());
  const [comments, setComments] = useState<Map<number, string>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startingSession, setStartingSession] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    // Cargar usuario (solo para el visor 3D)
    const userResult = await getCurrentUserAction();
    if (userResult.success && userResult.user?.id) {
      setUser({
        id: userResult.user.id,
        email: userResult.user.email || "",
      });
    }

    // Cargar productos públicos (sin necesidad de autenticación)
    const products = await getAllPublicProductsAction();
    console.log("📦 Productos públicos cargados:", products.length);
    setAllProducts(products);

    // Cargar encuesta (ahora pasa productos como parámetro)
    await loadSurvey(products);
  };

  const loadSurvey = async (products?: Product[]) => {
    try {
      setLoading(true);

      console.log("🔍 Public Survey - Survey ID:", surveyId);

      const surveyResult = await getSurveyByIdAction(surveyId);
      console.log("📋 Survey Result:", surveyResult);

      if (!surveyResult.ok || !surveyResult.survey) {
        console.error("❌ Error:", surveyResult.error);
        alert(
          "Encuesta no encontrada: " +
            (surveyResult.error || "Error desconocido")
        );
        return;
      }

      // Verificar que esté pública
      if (!surveyResult.survey.isPublic) {
        alert("Esta encuesta no está disponible públicamente");
        return;
      }

      setSurvey(surveyResult.survey);
      console.log("✅ Encuesta cargada:", surveyResult.survey.title);

      // Si no tiene contraseña, permitir acceso directo
      if (!surveyResult.survey.password) {
        setAuthenticated(true);
        console.log("🔓 Sin contraseña, acceso directo");
      } else {
        console.log("🔒 Contraseña requerida");
      }

      // Cargar preguntas - usar surveyId como string (UUID)
      console.log("📥 Cargando preguntas...");
      const questionsResult = await getQuestionsBySurveyIdAction(surveyId);
      console.log("📋 Questions Result:", questionsResult);

      if (questionsResult.ok && questionsResult.questions) {
        setQuestions(questionsResult.questions);
        console.log("✅ Preguntas cargadas:", questionsResult.questions.length);

        // Cargar productos para cada pregunta
        // Si products está disponible, usarlo, sino usar allProducts del estado
        const productsToUse = products || allProducts;
        console.log("📦 Productos a usar para filtrar:", productsToUse.length);
        await loadProductsForQuestions(
          questionsResult.questions,
          productsToUse
        );
      }
    } catch (error) {
      console.error("❌ Error cargando encuesta:", error);
      alert("Error al cargar la encuesta: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadProductsForQuestions = async (
    questionsList: Question[],
    productsToFilter: Product[]
  ) => {
    console.log("🔄 Cargando productos para preguntas...");
    console.log("📦 Total productos disponibles:", productsToFilter.length);

    const productsMap = new Map<number, Product[]>();

    for (const question of questionsList) {
      try {
        console.log(`🔍 Cargando productos para pregunta ${question.id}...`);

        // Obtener IDs de productos de la pregunta
        const result = await getProductsByQuestionIdAction(String(question.id));
        console.log(`📥 Resultado para pregunta ${question.id}:`, result);

        if (result.ok && result.productIds && result.productIds.length > 0) {
          console.log(`🎯 IDs de productos encontrados:`, result.productIds);

          // Filtrar productos del array proporcionado
          const questionProds = productsToFilter.filter((p) =>
            (result.productIds as string[]).includes(p.id!)
          );

          console.log(
            `✅ Productos filtrados (${questionProds.length}):`,
            questionProds.map((p) => p.name)
          );
          productsMap.set(question.id!, questionProds);
        } else {
          console.warn(`⚠️ No hay productos para pregunta ${question.id}`);
        }
      } catch (error) {
        console.error(
          `❌ Error cargando productos para pregunta ${question.id}:`,
          error
        );
      }
    }

    console.log("🗺️ Mapa final de productos por pregunta:", productsMap);
    setQuestionProducts(productsMap);
  };

  const handlePasswordSubmit = () => {
    if (passwordInput.trim() === survey?.password) {
      setAuthenticated(true);
      setPasswordError("");
    } else {
      setPasswordError("Contraseña incorrecta");
    }
  };

  const handleStartSurvey = async () => {
    if (!participantName.trim() || !participantEmail.trim()) {
      alert("Por favor completa tu nombre y email");
      return;
    }

    try {
      setStartingSession(true);

      // Crear participante
      const participant: SurveyParticipant = {
        name: participantName,
        email: participantEmail,
      };

      console.log("📝 Creando participante:", participant);
      const result = await createParticipantAction(participant);
      console.log("📥 Resultado createParticipant:", result);

      if (result.ok && result.participant?.id) {
        console.log("✅ Participante creado con ID:", result.participant.id);
        setParticipantId(result.participant.id);
      } else {
        console.error("❌ Error al crear participante:", result.error);
        alert(
          "Error al registrar participante: " +
            (result.error || "Error desconocido")
        );
      }
    } catch (error) {
      console.error("❌ Exception al crear participante:", error);
      alert("Error al iniciar encuesta: " + (error as Error).message);
    } finally {
      setStartingSession(false);
    }
  };

  const handleAnswerChange = (productId: string) => {
    const newAnswers = new Map(answers);
    newAnswers.set(questions[currentQuestionIndex].id!, productId);
    setAnswers(newAnswers);
  };

  const handleCommentChange = (comment: string) => {
    const newComments = new Map(comments);
    newComments.set(questions[currentQuestionIndex].id!, comment);
    setComments(newComments);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!participantId) {
      alert("Error: No se registró el participante");
      return;
    }

    // Verificar que todas las preguntas tengan respuesta
    for (const question of questions) {
      if (!answers.has(question.id!)) {
        alert(`Por favor responde la pregunta: ${question.title}`);
        return;
      }
    }

    try {
      setSubmitting(true);

      // Crear respuestas
      for (const question of questions) {
        const answer: Answer = {
          questionId: question.id!,
          participantId: participantId,
          answer_option: answers.get(question.id!) || "",
          comment: comments.get(question.id!) || "",
        };

        await createAnswerAction(answer);
      }

      setCompleted(true);
    } catch (error) {
      console.error("Error enviando respuestas:", error);
      alert("Error al enviar las respuestas");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando encuesta...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-center">
          <p className="text-gray-600">Encuesta no encontrada</p>
        </div>
      </div>
    );
  }

  // Pantalla de autenticación con contraseña
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-gray-800">
              Encuesta Protegida
            </h1>
            <p className="text-gray-600 mt-2">{survey.title}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handlePasswordSubmit()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                placeholder="Ingresa la contraseña"
              />
              {passwordError && (
                <p className="text-red-600 text-sm mt-1">{passwordError}</p>
              )}
            </div>

            <button
              onClick={handlePasswordSubmit}
              className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Acceder
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de registro de participante
  if (!participantId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">📋</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {survey.title}
            </h1>
            <p className="text-gray-600">{survey.description}</p>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu Nombre *
              </label>
              <input
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                placeholder="Ingresa tu nombre"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tu Email *
              </label>
              <input
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700">
              ℹ️ Esta encuesta contiene <strong>{questions.length}</strong>{" "}
              pregunta(s). Tus respuestas serán anónimas.
            </p>
          </div>

          <button
            onClick={handleStartSurvey}
            disabled={startingSession}
            className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {startingSession ? "Registrando..." : "Comenzar Encuesta →"}
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de finalización
  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            ¡Gracias por tu participación!
          </h1>
          <p className="text-gray-600 mb-6">
            Tus respuestas han sido guardadas exitosamente. Apreciamos tu tiempo
            y opinión.
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Finalizar
          </button>
        </div>
      </div>
    );
  }

  // Pantalla de preguntas
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Progreso */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              Pregunta {currentQuestionIndex + 1} de {questions.length}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {Math.round(
                ((currentQuestionIndex + 1) / questions.length) * 100
              )}
              % Completado
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) / questions.length) * 100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Pregunta actual */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {currentQuestion.title}
          </h2>
          <p className="text-gray-600 mb-6">{currentQuestion.description}</p>

          {/* Productos */}
          <div className="space-y-3 mb-6">
            {questionProducts
              .get(currentQuestion.id!)
              ?.map((product: Product) => (
                <div
                  key={product.id}
                  className={`border-2 rounded-lg transition-all ${
                    answers.get(currentQuestion.id!) === product.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200"
                  }`}
                >
                  <label className="flex items-center gap-4 p-4 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      checked={answers.get(currentQuestion.id!) === product.id}
                      onChange={() => handleAnswerChange(product.id!)}
                      className="h-5 w-5 text-purple-600"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setViewingProduct(product);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                      👁️ Ver 3D
                    </button>
                  </label>
                </div>
              ))}

            {(!questionProducts.get(currentQuestion.id!) ||
              questionProducts.get(currentQuestion.id!)!.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No hay productos disponibles para esta pregunta
              </div>
            )}
          </div>

          {/* Comentarios opcionales */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentarios adicionales (opcional)
            </label>
            <textarea
              value={comments.get(currentQuestion.id!) || ""}
              onChange={(e) => handleCommentChange(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
              placeholder="Comparte tu opinión..."
            />
          </div>

          {/* Navegación */}
          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>

            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting || !answers.has(currentQuestion.id!)}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Enviando..." : "✓ Enviar Respuestas"}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={!answers.has(currentQuestion.id!)}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modal del Visor 3D */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            {/* Header del modal */}
            <div className="p-4 bg-gray-800 text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{viewingProduct.name}</h2>
                <p className="text-gray-300 text-sm">
                  {viewingProduct.description || "Visor 3D"}
                </p>
              </div>
              <button
                onClick={() => setViewingProduct(null)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Visor 3D */}
            <div className="flex-1 overflow-hidden">
              {viewingProduct.constants && viewingProduct.adminId ? (
                <KeyShotXRViewer
                  config={JSON.parse(viewingProduct.constants)}
                  baseUrl={`https://emrgqbrqnqpbkrpruwts.supabase.co/storage/v1/object/public/files/${viewingProduct.adminId}/${viewingProduct.id}/`}
                  onLoad={() => console.log("Visor 3D cargado")}
                  onError={(error) =>
                    console.error("Error en visor 3D:", error)
                  }
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <p className="text-gray-600 text-lg">
                      No hay configuración 3D disponible para este producto
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

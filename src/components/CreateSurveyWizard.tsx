"use client";

import { useState, useEffect } from "react";
import { Product } from "../domain/entities/Product";
import { Survey } from "../domain/entities/Survey";
import { Question } from "../domain/entities/Question";
import {
  createSurveyAction,
  createQuestionAction,
  assignProductsToSurveyAction,
  assignProductsToQuestionAction,
} from "../app/actions/surveyActions";
import { getAllProductsAction } from "../app/actions/productActions";

interface QuestionForm {
  tempId: string;
  title: string;
  description: string;
  selectedProductIds: string[];
  allowComments: boolean;
}

interface CreateSurveyWizardProps {
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateSurveyWizard({
  userId,
  onSuccess,
  onCancel,
}: CreateSurveyWizardProps) {
  // Estados principales
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Datos del formulario
  const [surveyTitle, setSurveyTitle] = useState("");
  const [surveyDescription, setSurveyDescription] = useState("");
  const [surveyPassword, setSurveyPassword] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuestionForm[]>([]);

  // Cargar productos
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const allProducts = await getAllProductsAction();
      setProducts(allProducts);
    } catch (error) {
      console.error("Error cargando productos:", error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Toggle selección de producto para la encuesta
  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Agregar nueva pregunta
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        tempId: `temp-${Date.now()}`,
        title: "",
        description: "",
        selectedProductIds: [],
        allowComments: true,
      },
    ]);
  };

  // Eliminar pregunta
  const removeQuestion = (tempId: string) => {
    setQuestions(questions.filter((q) => q.tempId !== tempId));
  };

  // Actualizar pregunta
  const updateQuestion = (
    tempId: string,
    field: keyof QuestionForm,
    value: any
  ) => {
    setQuestions(
      questions.map((q) => (q.tempId === tempId ? { ...q, [field]: value } : q))
    );
  };

  // Toggle producto en pregunta
  const toggleQuestionProduct = (tempId: string, productId: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.tempId === tempId) {
          const newSelected = q.selectedProductIds.includes(productId)
            ? q.selectedProductIds.filter((id) => id !== productId)
            : [...q.selectedProductIds, productId];
          return { ...q, selectedProductIds: newSelected };
        }
        return q;
      })
    );
  };

  // Validaciones
  const canGoToStep2 = () => {
    return (
      surveyTitle.trim() !== "" &&
      surveyDescription.trim() !== "" &&
      selectedProductIds.length > 0
    );
  };

  const canSubmit = () => {
    return (
      questions.length > 0 &&
      questions.every(
        (q) =>
          q.title.trim() !== "" &&
          q.description.trim() !== "" &&
          q.selectedProductIds.length > 0
      )
    );
  };

  // Crear encuesta
  const handleSubmit = async () => {
    if (!canSubmit()) {
      alert("Por favor completa todas las preguntas correctamente");
      return;
    }

    try {
      setLoading(true);

      /*  console.log("🚀 Iniciando creación de encuesta...");
      console.log("📋 Datos:", {
        title: surveyTitle,
        numProducts: selectedProductIds.length,
        numQuestions: questions.length,
      }); */

      // 1. Crear la encuesta
      const surveyData: Survey = {
        title: surveyTitle,
        description: surveyDescription,
        password: surveyPassword.trim() || undefined, // Solo incluir si tiene valor
        adminId: userId,
        isPublic: true,
      };

      /*       console.log("📤 Creando encuesta..."); */
      const surveyResult = await createSurveyAction(surveyData);

      /*       console.log("📥 Resultado encuesta:", surveyResult); */

      if (!surveyResult.ok || !surveyResult.survey?.id) {
        throw new Error(surveyResult.error || "Error creando encuesta");
      }

      const surveyId = surveyResult.survey.id.toString();
      /*       console.log("✅ Encuesta creada con ID:", surveyId);

      // 2. Asignar productos a la encuesta
      console.log("🔗 Asignando productos a encuesta..."); */
      await assignProductsToSurveyAction(surveyId, selectedProductIds);
      /*       console.log("✅ Productos asignados a encuesta");

      // 3. Crear preguntas y asignar productos
      console.log("❓ Creando", questions.length, "preguntas..."); */
      for (let i = 0; i < questions.length; i++) {
        const questionForm = questions[i];
        /*      console.log(`📝 Pregunta ${i + 1}:`, {
          title: questionForm.title,
          surveyId: surveyResult.survey.id,
          numProducts: questionForm.selectedProductIds.length,
        }); */

        const questionData: Question = {
          surveyId: surveyResult.survey.id,
          title: questionForm.title,
          description: questionForm.description,
          // questionType: "selection", // Tipo por defecto: selección de productos
          numProducts: questionForm.selectedProductIds.length,
          products: [],
        };

        const questionResult = await createQuestionAction(questionData);
        /*   console.log(`📥 Resultado pregunta ${i + 1}:`, questionResult); */

        if (questionResult.ok && questionResult.question?.id) {
          /*       console.log(
            `✅ Pregunta ${i + 1} creada con ID:`,
            questionResult.question.id
          ); */

          // Asignar productos a la pregunta
          /*         console.log(
            `🔗 Asignando ${questionForm.selectedProductIds.length} productos a pregunta...`
          ); */
          const assignResult = await assignProductsToQuestionAction(
            questionResult.question.id.toString(),
            questionForm.selectedProductIds
          );
          /*          console.log(
            `✅ Productos asignados a pregunta ${i + 1}:`,
            assignResult
          ); */
        } else {
          /*         console.error(
            `❌ Error creando pregunta ${i + 1}:`,
            questionResult.error
          ); */
        }
      }

      /*       console.log("🎉 Proceso completado exitosamente"); */
      alert("✅ Encuesta creada exitosamente");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("❌ Error creando encuesta:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Productos disponibles para la encuesta
  const availableProducts = products.filter((p) =>
    selectedProductIds.includes(p.id!)
  );

  if (loadingProducts) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8">
      {/* Header con progreso */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Crear Nueva Encuesta
        </h2>
        <div className="flex items-center gap-4">
          <div
            className={`flex-1 h-2 rounded ${
              step >= 1 ? "bg-blue-600" : "bg-gray-200"
            }`}
          />
          <div
            className={`flex-1 h-2 rounded ${
              step >= 2 ? "bg-blue-600" : "bg-gray-200"
            }`}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm font-medium text-gray-600">
            1. Información y Productos
          </span>
          <span className="text-sm font-medium text-gray-600">
            2. Preguntas
          </span>
        </div>
      </div>

      {/* Step 1: Información básica y selección de productos */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Información de la encuesta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título de la Encuesta *
            </label>
            <input
              type="text"
              value={surveyTitle}
              onChange={(e) => setSurveyTitle(e.target.value)}
              placeholder="Ej: Evaluación de Diseño de Productos 2024"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              value={surveyDescription}
              onChange={(e) => setSurveyDescription(e.target.value)}
              placeholder="Describe el propósito de la encuesta..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña de Acceso (opcional)
            </label>
            <input
              type="text"
              value={surveyPassword}
              onChange={(e) => setSurveyPassword(e.target.value)}
              placeholder="Deja en blanco para acceso sin contraseña"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <p className="text-sm text-gray-500 mt-1">
              Si defines una contraseña, los participantes deberán ingresarla
              para acceder a la encuesta
            </p>
          </div>

          {/* Selección de productos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecciona los Productos a Usar * ({selectedProductIds.length}{" "}
              seleccionados)
            </label>

            {products.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">
                  No tienes productos disponibles. Sube productos primero.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => toggleProductSelection(product.id!)}
                    className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedProductIds.includes(product.id!)
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedProductIds.includes(product.id!)}
                        onChange={() => {}}
                        className="mt-1 h-5 w-5 text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded mb-2 flex items-center justify-center">
                          <span className="text-4xl">🎨</span>
                        </div>
                        <h4 className="font-semibold text-gray-800">
                          {product.name}
                        </h4>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.description || "Sin descripción"}
                        </p>
                        {product.num_images && (
                          <p className="text-xs text-gray-500 mt-1">
                            {product.num_images} imágenes
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex justify-between pt-6 border-t">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => setStep(2)}
              disabled={!canGoToStep2()}
              className={`px-6 py-2 rounded-lg transition-colors ${
                canGoToStep2()
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Siguiente: Crear Preguntas →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preguntas */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Productos seleccionados:</strong>{" "}
              {availableProducts.map((p) => p.name).join(", ")}
            </p>
          </div>

          {/* Lista de preguntas */}
          {questions.map((question, index) => (
            <div
              key={question.tempId}
              className="border border-gray-300 rounded-lg p-6 bg-gray-50"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Pregunta {index + 1}
                </h3>
                <button
                  onClick={() => removeQuestion(question.tempId)}
                  className="text-red-600 hover:text-red-800"
                >
                  🗑️ Eliminar
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título de la Pregunta *
                  </label>
                  <input
                    type="text"
                    value={question.title}
                    onChange={(e) =>
                      updateQuestion(question.tempId, "title", e.target.value)
                    }
                    placeholder="Ej: ¿Cuál diseño te gusta más?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción/Instrucciones *
                  </label>
                  <textarea
                    value={question.description}
                    onChange={(e) =>
                      updateQuestion(
                        question.tempId,
                        "description",
                        e.target.value
                      )
                    }
                    placeholder="Proporciona contexto o instrucciones..."
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelos a Mostrar en esta Pregunta * (
                    {question.selectedProductIds.length} seleccionados)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {availableProducts.map((product) => (
                      <div
                        key={product.id}
                        onClick={() =>
                          toggleQuestionProduct(question.tempId, product.id!)
                        }
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                          question.selectedProductIds.includes(product.id!)
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={question.selectedProductIds.includes(
                              product.id!
                            )}
                            onChange={() => {}}
                            className="h-4 w-4 text-green-600"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="w-full h-20 bg-gradient-to-br from-green-100 to-blue-100 rounded mb-1 flex items-center justify-center">
                              <span className="text-2xl">🎨</span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {product.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`comments-${question.tempId}`}
                    checked={question.allowComments}
                    onChange={(e) =>
                      updateQuestion(
                        question.tempId,
                        "allowComments",
                        e.target.checked
                      )
                    }
                    className="h-4 w-4 text-blue-600"
                  />
                  <label
                    htmlFor={`comments-${question.tempId}`}
                    className="text-sm text-gray-700"
                  >
                    Permitir comentarios en esta pregunta
                  </label>
                </div>
              </div>
            </div>
          ))}

          {/* Botón agregar pregunta */}
          <button
            onClick={addQuestion}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            ➕ Agregar Pregunta
          </button>

          {/* Botones finales */}
          <div className="flex justify-between pt-6 border-t">
            <button
              onClick={() => setStep(1)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Volver
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || loading}
              className={`px-6 py-2 rounded-lg transition-colors ${
                canSubmit() && !loading
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? "Creando..." : "✅ Crear Encuesta"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

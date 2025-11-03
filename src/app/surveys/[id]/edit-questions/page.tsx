"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getCurrentUserAction } from "@/src/app/actions/authActions";
import {
  getSurveyByIdAction,
  getQuestionsBySurveyIdAction,
  updateQuestionAction,
  deleteQuestionAction,
  assignProductsToQuestionAction,
  getProductsByQuestionIdAction,
} from "@/src/app/actions/surveyActions";
import { getAllProductsAction } from "@/src/app/actions/productActions";
import { Survey } from "@/src/domain/entities/Survey";
import { Question } from "@/src/domain/entities/Question";
import { Product } from "@/src/domain/entities/Product";

export default function EditQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const surveyIdParam = params?.id as string;
  const surveyId = surveyIdParam?.replace(/_/g, "-") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(
    null
  );

  // Estado del formulario de edición
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    selectedProductIds: string[];
  }>({
    title: "",
    description: "",
    selectedProductIds: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Verificar usuario
      const userResult = await getCurrentUserAction();
      if (!userResult.success || !userResult.user?.id) {
        router.push("/login");
        return;
      }

      setUser({
        id: userResult.user.id,
        email: userResult.user.email || "",
      });

      // Cargar encuesta
      const surveyResult = await getSurveyByIdAction(surveyId);
      if (!surveyResult.ok || !surveyResult.survey) {
        alert("No se pudo cargar la encuesta");
        router.push("/surveys");
        return;
      }

      // Verificar permisos
      if (surveyResult.survey.adminId !== userResult.user.id) {
        alert("No tienes permiso para editar esta encuesta");
        router.push("/surveys");
        return;
      }

      setSurvey(surveyResult.survey);

      // Cargar preguntas - usar surveyId como string (UUID)
      const questionsResult = await getQuestionsBySurveyIdAction(surveyId);
      if (questionsResult.ok && questionsResult.questions) {
        setQuestions(questionsResult.questions);
      }

      // Cargar productos
      const products = await getAllProductsAction();
      setAllProducts(products);
    } catch (error) {
      console.error("Error cargando datos:", error);
      alert("Error al cargar los datos");
      router.push("/surveys");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = async (question: Question) => {
    setEditingQuestionId(question.id!);

    // Cargar productos de la pregunta
    const productsResult = await getProductsByQuestionIdAction(
      String(question.id)
    );

    setEditForm({
      title: question.title,
      description: question.description,
      selectedProductIds: productsResult.ok ? productsResult.productIds : [],
    });
  };

  const cancelEditing = () => {
    setEditingQuestionId(null);
    setEditForm({
      title: "",
      description: "",
      selectedProductIds: [],
    });
  };

  const toggleProduct = (productId: string) => {
    setEditForm((prev) => ({
      ...prev,
      selectedProductIds: prev.selectedProductIds.includes(productId)
        ? prev.selectedProductIds.filter((id) => id !== productId)
        : [...prev.selectedProductIds, productId],
    }));
  };

  const handleSave = async () => {
    if (!editForm.title.trim() || !editForm.description.trim()) {
      alert("Por favor completa todos los campos");
      return;
    }

    if (editForm.selectedProductIds.length === 0) {
      alert("Selecciona al menos un producto");
      return;
    }

    try {
      setSaving(true);

      // Actualizar pregunta
      const result = await updateQuestionAction(editingQuestionId!, {
        title: editForm.title,
        description: editForm.description,
        numProducts: editForm.selectedProductIds.length,
      });

      if (!result.ok) {
        alert("Error al actualizar: " + result.error);
        return;
      }

      // Actualizar productos
      await assignProductsToQuestionAction(
        String(editingQuestionId),
        editForm.selectedProductIds
      );

      alert("✅ Pregunta actualizada exitosamente");
      cancelEditing();
      loadData(); // Recargar datos
    } catch (error: any) {
      console.error("Error guardando:", error);
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (questionId: number) => {
    if (
      !confirm(
        "¿Estás seguro de eliminar esta pregunta? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      const result = await deleteQuestionAction(questionId);
      if (result.ok) {
        alert("✅ Pregunta eliminada");
        loadData();
      } else {
        alert("Error al eliminar: " + result.error);
      }
    } catch (error: any) {
      console.error("Error:", error);
      alert("Error al eliminar: " + error.message);
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
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={() => router.push("/surveys")}
            className="text-purple-600 hover:text-purple-800 mb-2 flex items-center gap-2"
          >
            ← Volver a Encuestas
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Editar Preguntas
            </h1>
            <p className="text-gray-600 mt-1">{survey?.title}</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {questions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">❓</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No hay preguntas todavía
            </h2>
            <p className="text-gray-600">
              Esta encuesta aún no tiene preguntas agregadas
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((question, index) => (
              <div
                key={question.id}
                className="bg-white rounded-xl shadow-lg p-6"
              >
                {editingQuestionId === question.id ? (
                  // Modo edición
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-gray-800">
                        ✏️ Editando Pregunta #{index + 1}
                      </h3>
                      <button
                        onClick={cancelEditing}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Título *
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm({ ...editForm, title: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción *
                      </label>
                      <textarea
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            description: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Productos ({editForm.selectedProductIds.length}{" "}
                        seleccionados)
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                        {allProducts.map((product) => (
                          <label
                            key={product.id}
                            className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              editForm.selectedProductIds.includes(product.id!)
                                ? "border-purple-500 bg-purple-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={editForm.selectedProductIds.includes(
                                product.id!
                              )}
                              onChange={() => toggleProduct(product.id!)}
                              className="h-5 w-5 text-purple-600"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {product.name}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {product.description}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={cancelEditing}
                        className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {saving ? "Guardando..." : "💾 Guardar"}
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo vista
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            Pregunta #{index + 1}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                          {question.title}
                        </h3>
                        <p className="text-gray-600">{question.description}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        📦 {question.numProducts} producto(s) asignado(s)
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => startEditing(question)}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(question.id!)}
                        className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

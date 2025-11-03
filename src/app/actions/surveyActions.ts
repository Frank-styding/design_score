"use server";

import { Survey } from "@/src/domain/entities/Survey";
import { Question } from "@/src/domain/entities/Question";
import { Answer } from "@/src/domain/entities/Answer";
import { SurveyParticipant } from "@/src/domain/entities/SurveyParticipant";
import { SurveyUseCase } from "@/src/domain/usecase/SurveyUseCase";
import { createClient } from "@/src/infrastrucutre/supabse/client";
import { SupabaseSurveyRepository } from "@/src/infrastrucutre/supabse/SupabaseSurveyRepository";
import { SupabaseClient } from "@supabase/supabase-js";

// ============================================================
// 🔹 SURVEY ACTIONS
// ============================================================

export async function createSurveyAction(survey: Survey) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.createSurvey(survey);
    return result;
  } catch (error: any) {
    return { survey: null, ok: false, error: error.message };
  }
}

export async function getSurveyByIdAction(surveyId: string | number) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.getSurveyById(surveyId);
    return result;
  } catch (error: any) {
    return { survey: null, ok: false, error: error.message };
  }
}

export async function getAllSurveysAction(adminId: string) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.getAllSurveys(adminId);
    return result;
  } catch (error: any) {
    return { surveys: [], ok: false, error: error.message };
  }
}

export async function updateSurveyAction(
  surveyId: string | number,
  updates: Partial<Survey>
) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.updateSurvey(surveyId, updates);
    return result;
  } catch (error: any) {
    return { survey: null, ok: false, error: error.message };
  }
}

export async function deleteSurveyAction(surveyId: string | number) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.deleteSurvey(surveyId);
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function getSurveyByPasswordAction(password: string) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.getSurveyByPassword(password);
    return result;
  } catch (error: any) {
    return { survey: null, ok: false, error: error.message };
  }
}

// ============================================================
// 🔹 QUESTION ACTIONS
// ============================================================

export async function createQuestionAction(question: Question) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.createQuestion(question);
    return result;
  } catch (error: any) {
    return { question: null, ok: false, error: error.message };
  }
}

export async function getQuestionsBySurveyIdAction(surveyId: string | number) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.getQuestionsBySurveyId(surveyId);
    return result;
  } catch (error: any) {
    return { questions: [], ok: false, error: error.message };
  }
}

export async function updateQuestionAction(
  questionId: number,
  updates: Partial<Question>
) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.updateQuestion(questionId, updates);
    return result;
  } catch (error: any) {
    return { question: null, ok: false, error: error.message };
  }
}

export async function deleteQuestionAction(questionId: number) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.deleteQuestion(questionId);
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

// ============================================================
// 🔹 PARTICIPANT ACTIONS
// ============================================================

export async function createParticipantAction(participant: SurveyParticipant) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.createParticipant(participant);
    return result;
  } catch (error: any) {
    return { participant: null, ok: false, error: error.message };
  }
}

export async function getParticipantByIdAction(participantId: string) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.getParticipantById(participantId);
    return result;
  } catch (error: any) {
    return { participant: null, ok: false, error: error.message };
  }
}

export async function getParticipantsByIdsAction(participantIds: string[]) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.getParticipantsByIds(participantIds);
    return result;
  } catch (error: any) {
    return { participants: [], ok: false, error: error.message };
  }
}

// ============================================================
// 🔹 ANSWER ACTIONS
// ============================================================

export async function createAnswerAction(answer: Answer) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.createAnswer(answer);
    return result;
  } catch (error: any) {
    return { answer: null, ok: false, error: error.message };
  }
}

export async function getAnswersByQuestionIdAction(questionId: number) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.getAnswersByQuestionId(questionId);
    return result;
  } catch (error: any) {
    return { answers: [], ok: false, error: error.message };
  }
}

export async function getAnswersByParticipantIdAction(participantId: string) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.getAnswersByParticipantId(participantId);
    return result;
  } catch (error: any) {
    return { answers: [], ok: false, error: error.message };
  }
}

export async function getAnswersBySurveyIdAction(surveyId: string | number) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.getAnswersBySurveyId(surveyId);
    return result;
  } catch (error: any) {
    return { answers: [], ok: false, error: error.message };
  }
}

// ============================================================
// 🔹 SURVEY-PRODUCT ACTIONS
// ============================================================

export async function assignProductsToSurveyAction(
  surveyId: string,
  productIds: string[]
) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.assignProductsToSurvey(
      surveyId,
      productIds
    );
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function removeProductsFromSurveyAction(
  surveyId: string,
  productIds: string[]
) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.removeProductsFromSurvey(
      surveyId,
      productIds
    );
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function getProductsBySurveyIdAction(surveyId: string) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.getProductsBySurveyId(surveyId);
    return result;
  } catch (error: any) {
    return { productIds: [], ok: false, error: error.message };
  }
}

// ============================================================
// 🔹 QUESTION-PRODUCT ACTIONS
// ============================================================

export async function assignProductsToQuestionAction(
  questionId: string,
  productIds: string[]
) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.assignProductsToQuestion(
      questionId,
      productIds
    );
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function removeProductsFromQuestionAction(
  questionId: string,
  productIds: string[]
) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.removeProductsFromQuestion(
      questionId,
      productIds
    );
    return result;
  } catch (error: any) {
    return { ok: false, error: error.message };
  }
}

export async function getProductsByQuestionIdAction(questionId: string) {
  try {
    const client = await createClient();
    const surveyRepository = new SupabaseSurveyRepository(client);
    const surveyUseCase = new SurveyUseCase(surveyRepository);

    const result = await surveyUseCase.getProductsByQuestionId(questionId);
    return result;
  } catch (error: any) {
    return { productIds: [], ok: false, error: error.message };
  }
}

// ============================================================
// 🔹 DASHBOARD STATS ACTIONS
// ============================================================

/**
 * Obtiene estadísticas del dashboard para el usuario actual
 */
export async function getDashboardStatsAction(adminId: string) {
  try {
    const client = await createClient();

    // Contar encuestas activas del admin
    const { count: surveysCount, error: surveysError } = await client
      .from("survey")
      .select("*", { count: "exact", head: true })
      .eq("admin_id", adminId)
      .eq("is_public", true);

    if (surveysError) {
      console.error("Error counting surveys:", surveysError);
      return {
        surveysCount: 0,
        totalAnswers: 0,
        ok: false,
        error: surveysError.message,
      };
    }

    // Obtener IDs de todas las encuestas del admin
    const { data: adminSurveys, error: adminSurveysError } = await client
      .from("survey")
      .select("survey_id")
      .eq("admin_id", adminId);

    if (adminSurveysError) {
      console.error("Error getting admin surveys:", adminSurveysError);
      return {
        surveysCount: surveysCount || 0,
        totalAnswers: 0,
        ok: false,
        error: adminSurveysError.message,
      };
    }

    const surveyIds = adminSurveys?.map((s) => s.survey_id) || [];

    // Si no hay encuestas, retornar 0 respuestas
    if (surveyIds.length === 0) {
      return { surveysCount: surveysCount || 0, totalAnswers: 0, ok: true };
    }

    // Contar respuestas totales de las encuestas del admin
    // Primero obtenemos todas las preguntas de las encuestas del admin
    const { data: questions, error: questionsError } = await client
      .from("question")
      .select("question_id")
      .in("survey_id", surveyIds);

    if (questionsError) {
      console.error("Error getting questions:", questionsError);
      return {
        surveysCount: surveysCount || 0,
        totalAnswers: 0,
        ok: false,
        error: questionsError.message,
      };
    }

    const questionIds = questions?.map((q) => q.question_id) || [];

    // Si no hay preguntas, retornar 0 respuestas
    if (questionIds.length === 0) {
      return { surveysCount: surveysCount || 0, totalAnswers: 0, ok: true };
    }

    // Ahora contamos las respuestas de esas preguntas
    const { count: answersCount, error: answersError } = await client
      .from("answer")
      .select("*", { count: "exact", head: true })
      .in("question_id", questionIds);

    if (answersError) {
      console.error("Error counting answers:", answersError);
      return {
        surveysCount: surveysCount || 0,
        totalAnswers: 0,
        ok: false,
        error: answersError.message,
      };
    }

    return {
      surveysCount: surveysCount || 0,
      totalAnswers: answersCount || 0,
      ok: true,
    };
  } catch (error: any) {
    console.error("Error getting dashboard stats:", error);
    return {
      surveysCount: 0,
      totalAnswers: 0,
      ok: false,
      error: error.message,
    };
  }
}

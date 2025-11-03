import { Survey } from "../entities/Survey";
import { Question } from "../entities/Question";
import { Answer } from "../entities/Answer";
import { SurveyParticipant } from "../entities/SurveyParticipant";
import { ISurveyRepository } from "../ports/ISurveyRepository";

export class SurveyUseCase {
  constructor(private surveyRepository: ISurveyRepository) {}

  // ============================================================
  // 🔹 SURVEY OPERATIONS
  // ============================================================

  /**
   * Crear una nueva encuesta
   */
  async createSurvey(
    survey: Survey
  ): Promise<{ survey: Survey | null; ok: boolean; error?: string }> {
    try {
      // Validaciones
      if (!survey.title || survey.title.trim() === "") {
        return { survey: null, ok: false, error: "El título es requerido" };
      }

      if (!survey.adminId) {
        return { survey: null, ok: false, error: "El adminId es requerido" };
      }

      const createdSurvey = await this.surveyRepository.createSurvey(survey);
      return { survey: createdSurvey, ok: true };
    } catch (error: any) {
      return { survey: null, ok: false, error: error.message };
    }
  }

  /**
   * Obtener encuesta por ID
   */
  async getSurveyById(
    surveyId: string | number
  ): Promise<{ survey: Survey | null; ok: boolean; error?: string }> {
    try {
      const survey = await this.surveyRepository.getSurveyById(surveyId);
      if (!survey) {
        return { survey: null, ok: false, error: "Encuesta no encontrada" };
      }
      return { survey, ok: true };
    } catch (error: any) {
      return { survey: null, ok: false, error: error.message };
    }
  }

  /**
   * Obtener todas las encuestas de un administrador
   */
  async getAllSurveys(
    adminId: string
  ): Promise<{ surveys: Survey[]; ok: boolean; error?: string }> {
    try {
      const surveys = await this.surveyRepository.getAllSurveys(adminId);
      return { surveys, ok: true };
    } catch (error: any) {
      return { surveys: [], ok: false, error: error.message };
    }
  }

  /**
   * Actualizar una encuesta
   */
  async updateSurvey(
    surveyId: string | number,
    updates: Partial<Survey>
  ): Promise<{ survey: Survey | null; ok: boolean; error?: string }> {
    try {
      const survey = await this.surveyRepository.updateSurvey(
        surveyId,
        updates
      );
      if (!survey) {
        return { survey: null, ok: false, error: "Encuesta no encontrada" };
      }
      return { survey, ok: true };
    } catch (error: any) {
      return { survey: null, ok: false, error: error.message };
    }
  }

  /**
   * Eliminar una encuesta (y sus preguntas y respuestas en cascada)
   */
  async deleteSurvey(
    surveyId: string | number
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const deleted = await this.surveyRepository.deleteSurvey(surveyId);
      if (!deleted) {
        return { ok: false, error: "No se pudo eliminar la encuesta" };
      }
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener encuesta por contraseña (para participantes)
   */
  async getSurveyByPassword(
    password: string
  ): Promise<{ survey: Survey | null; ok: boolean; error?: string }> {
    try {
      if (!password || password.trim() === "") {
        return { survey: null, ok: false, error: "La contraseña es requerida" };
      }

      const survey = await this.surveyRepository.getSurveyByPassword(password);
      if (!survey) {
        return {
          survey: null,
          ok: false,
          error: "Encuesta no encontrada con esa contraseña",
        };
      }

      if (!survey.isPublic) {
        return {
          survey: null,
          ok: false,
          error: "Esta encuesta está desactivada",
        };
      }

      return { survey, ok: true };
    } catch (error: any) {
      return { survey: null, ok: false, error: error.message };
    }
  }

  // ============================================================
  // 🔹 QUESTION OPERATIONS
  // ============================================================

  /**
   * Crear una nueva pregunta
   */
  async createQuestion(
    question: Question
  ): Promise<{ question: Question | null; ok: boolean; error?: string }> {
    try {
      // Validaciones
      if (!question.title || question.title.trim() === "") {
        return {
          question: null,
          ok: false,
          error: "El título de la pregunta es requerido",
        };
      }

      if (!question.surveyId) {
        return { question: null, ok: false, error: "El surveyId es requerido" };
      }

      if (question.numProducts < 1) {
        return {
          question: null,
          ok: false,
          error: "Debe haber al menos 1 producto",
        };
      }

      const createdQuestion = await this.surveyRepository.createQuestion(
        question
      );
      return { question: createdQuestion, ok: true };
    } catch (error: any) {
      return { question: null, ok: false, error: error.message };
    }
  }

  /**
   * Obtener preguntas de una encuesta
   */
  async getQuestionsBySurveyId(
    surveyId: string | number
  ): Promise<{ questions: Question[]; ok: boolean; error?: string }> {
    try {
      const questions = await this.surveyRepository.getQuestionsBySurveyId(
        surveyId
      );
      return { questions, ok: true };
    } catch (error: any) {
      return { questions: [], ok: false, error: error.message };
    }
  }

  /**
   * Actualizar una pregunta
   */
  async updateQuestion(
    questionId: number,
    updates: Partial<Question>
  ): Promise<{ question: Question | null; ok: boolean; error?: string }> {
    try {
      const question = await this.surveyRepository.updateQuestion(
        questionId,
        updates
      );
      if (!question) {
        return { question: null, ok: false, error: "Pregunta no encontrada" };
      }
      return { question, ok: true };
    } catch (error: any) {
      return { question: null, ok: false, error: error.message };
    }
  }

  /**
   * Eliminar una pregunta
   */
  async deleteQuestion(
    questionId: number
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      const deleted = await this.surveyRepository.deleteQuestion(questionId);
      if (!deleted) {
        return { ok: false, error: "No se pudo eliminar la pregunta" };
      }
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  // ============================================================
  // 🔹 PARTICIPANT OPERATIONS
  // ============================================================

  /**
   * Crear un participante
   */
  async createParticipant(participant: SurveyParticipant): Promise<{
    participant: SurveyParticipant | null;
    ok: boolean;
    error?: string;
  }> {
    try {
      // Validaciones
      if (!participant.name || participant.name.trim() === "") {
        return {
          participant: null,
          ok: false,
          error: "El nombre es requerido",
        };
      }

      const createdParticipant = await this.surveyRepository.createParticipant(
        participant
      );
      return { participant: createdParticipant, ok: true };
    } catch (error: any) {
      return { participant: null, ok: false, error: error.message };
    }
  }

  /**
   * Obtener participante por ID
   */
  async getParticipantById(participantId: string): Promise<{
    participant: SurveyParticipant | null;
    ok: boolean;
    error?: string;
  }> {
    try {
      const participant = await this.surveyRepository.getParticipantById(
        participantId
      );
      if (!participant) {
        return {
          participant: null,
          ok: false,
          error: "Participante no encontrado",
        };
      }
      return { participant, ok: true };
    } catch (error: any) {
      return { participant: null, ok: false, error: error.message };
    }
  }

  /**
   * Obtener múltiples participantes por sus IDs
   */
  async getParticipantsByIds(participantIds: string[]): Promise<{
    participants: SurveyParticipant[];
    ok: boolean;
    error?: string;
  }> {
    try {
      const participants = await this.surveyRepository.getParticipantsByIds(
        participantIds
      );
      return { participants, ok: true };
    } catch (error: any) {
      return { participants: [], ok: false, error: error.message };
    }
  }

  // ============================================================
  // 🔹 ANSWER OPERATIONS
  // ============================================================

  /**
   * Crear una respuesta
   */
  async createAnswer(
    answer: Answer
  ): Promise<{ answer: Answer | null; ok: boolean; error?: string }> {
    try {
      // Validaciones
      if (!answer.questionId) {
        return { answer: null, ok: false, error: "El questionId es requerido" };
      }

      if (!answer.participantId) {
        return {
          answer: null,
          ok: false,
          error: "El participantId es requerido",
        };
      }

      const createdAnswer = await this.surveyRepository.createAnswer(answer);
      return { answer: createdAnswer, ok: true };
    } catch (error: any) {
      return { answer: null, ok: false, error: error.message };
    }
  }

  /**
   * Obtener respuestas por pregunta
   */
  async getAnswersByQuestionId(
    questionId: number
  ): Promise<{ answers: Answer[]; ok: boolean; error?: string }> {
    try {
      const answers = await this.surveyRepository.getAnswersByQuestionId(
        questionId
      );
      return { answers, ok: true };
    } catch (error: any) {
      return { answers: [], ok: false, error: error.message };
    }
  }

  /**
   * Obtener respuestas por participante
   */
  async getAnswersByParticipantId(
    participantId: string
  ): Promise<{ answers: Answer[]; ok: boolean; error?: string }> {
    try {
      const answers = await this.surveyRepository.getAnswersByParticipantId(
        participantId
      );
      return { answers, ok: true };
    } catch (error: any) {
      return { answers: [], ok: false, error: error.message };
    }
  }

  /**
   * Obtener todas las respuestas de una encuesta
   */
  async getAnswersBySurveyId(
    surveyId: string | number
  ): Promise<{ answers: Answer[]; ok: boolean; error?: string }> {
    try {
      const answers = await this.surveyRepository.getAnswersBySurveyId(
        surveyId
      );
      return { answers, ok: true };
    } catch (error: any) {
      return { answers: [], ok: false, error: error.message };
    }
  }

  // ============================================================
  // 🔹 SURVEY-PRODUCT OPERATIONS
  // ============================================================

  /**
   * Asignar productos a una encuesta
   */
  async assignProductsToSurvey(
    surveyId: string,
    productIds: string[]
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      if (!surveyId) {
        return { ok: false, error: "El surveyId es requerido" };
      }

      if (!productIds || productIds.length === 0) {
        return { ok: false, error: "Debe proporcionar al menos un producto" };
      }

      const success = await this.surveyRepository.assignProductsToSurvey(
        surveyId,
        productIds
      );

      if (!success) {
        return { ok: false, error: "No se pudieron asignar los productos" };
      }

      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Remover productos de una encuesta
   */
  async removeProductsFromSurvey(
    surveyId: string,
    productIds: string[]
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      if (!surveyId) {
        return { ok: false, error: "El surveyId es requerido" };
      }

      if (!productIds || productIds.length === 0) {
        return { ok: false, error: "Debe proporcionar al menos un producto" };
      }

      const success = await this.surveyRepository.removeProductsFromSurvey(
        surveyId,
        productIds
      );

      if (!success) {
        return { ok: false, error: "No se pudieron remover los productos" };
      }

      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener productos de una encuesta
   */
  async getProductsBySurveyId(
    surveyId: string
  ): Promise<{ productIds: string[]; ok: boolean; error?: string }> {
    try {
      if (!surveyId) {
        return { productIds: [], ok: false, error: "El surveyId es requerido" };
      }

      const productIds = await this.surveyRepository.getProductsBySurveyId(
        surveyId
      );

      return { productIds, ok: true };
    } catch (error: any) {
      return { productIds: [], ok: false, error: error.message };
    }
  }

  // ============================================================
  // 🔹 QUESTION-PRODUCT OPERATIONS
  // ============================================================

  /**
   * Asignar productos a una pregunta
   */
  async assignProductsToQuestion(
    questionId: string,
    productIds: string[]
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      if (!questionId) {
        return { ok: false, error: "El questionId es requerido" };
      }

      if (!productIds || productIds.length === 0) {
        return { ok: false, error: "Debe proporcionar al menos un producto" };
      }

      const success = await this.surveyRepository.assignProductsToQuestion(
        questionId,
        productIds
      );

      if (!success) {
        return { ok: false, error: "No se pudieron asignar los productos" };
      }

      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Remover productos de una pregunta
   */
  async removeProductsFromQuestion(
    questionId: string,
    productIds: string[]
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      if (!questionId) {
        return { ok: false, error: "El questionId es requerido" };
      }

      if (!productIds || productIds.length === 0) {
        return { ok: false, error: "Debe proporcionar al menos un producto" };
      }

      const success = await this.surveyRepository.removeProductsFromQuestion(
        questionId,
        productIds
      );

      if (!success) {
        return { ok: false, error: "No se pudieron remover los productos" };
      }

      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: error.message };
    }
  }

  /**
   * Obtener productos de una pregunta
   */
  async getProductsByQuestionId(
    questionId: string
  ): Promise<{ productIds: string[]; ok: boolean; error?: string }> {
    try {
      if (!questionId) {
        return {
          productIds: [],
          ok: false,
          error: "El questionId es requerido",
        };
      }

      const productIds = await this.surveyRepository.getProductsByQuestionId(
        questionId
      );

      return { productIds, ok: true };
    } catch (error: any) {
      return { productIds: [], ok: false, error: error.message };
    }
  }
}

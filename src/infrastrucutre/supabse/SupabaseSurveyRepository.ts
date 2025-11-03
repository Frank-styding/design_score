import { SupabaseClient } from "@supabase/supabase-js";
import { Survey } from "@/src/domain/entities/Survey";
import { Question } from "@/src/domain/entities/Question";
import { Answer } from "@/src/domain/entities/Answer";
import { SurveyParticipant } from "@/src/domain/entities/SurveyParticipant";
import { ISurveyRepository } from "@/src/domain/ports/ISurveyRepository";

export class SupabaseSurveyRepository implements ISurveyRepository {
  constructor(private supabaseClient: SupabaseClient) {}

  // ============================================================
  // 🔹 SURVEY OPERATIONS
  // ============================================================

  async createSurvey(survey: Survey): Promise<Survey> {
    const { data, error } = await this.supabaseClient
      .from("survey")
      .insert({
        title: survey.title,
        description: survey.description,
        admin_id: survey.adminId,
        is_public: survey.isPublic ?? true,
        password: survey.password,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating survey: ${error.message}`);
    }

    return this.mapSurveyFromDb(data);
  }

  async getSurveyById(surveyId: string | number): Promise<Survey | null> {
    const { data, error } = await this.supabaseClient
      .from("survey")
      .select(
        `
        *,
        questions:question(*)
      `
      )
      .eq("survey_id", surveyId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Error getting survey: ${error.message}`);
    }

    return this.mapSurveyFromDb(data);
  }

  async getAllSurveys(adminId: string): Promise<Survey[]> {
    /* console.log("🔍 getAllSurveys - adminId:", adminId); */

    const { data, error } = await this.supabaseClient
      .from("survey")
      .select(
        `
        *,
        questions:question(*)
      `
      )
      .eq("admin_id", adminId)
      .order("survey_id", { ascending: false });

    /* console.log("📥 getAllSurveys - data:", data);
    console.log("📥 getAllSurveys - error:", error); */

    if (error) {
      throw new Error(`Error getting surveys: ${error.message}`);
    }

    const surveys = data.map((data) => {
      return this.mapSurveyFromDb(data);
    });

    /*  console.log("✅ getAllSurveys - surveys mapeadas:", surveys.length); */

    return surveys;
  }

  async updateSurvey(
    surveyId: string | number,
    updates: Partial<Survey>
  ): Promise<Survey | null> {
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
    if (updates.password !== undefined) updateData.password = updates.password;

    const { data, error } = await this.supabaseClient
      .from("survey")
      .update(updateData)
      .eq("survey_id", surveyId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Error updating survey: ${error.message}`);
    }

    return this.mapSurveyFromDb(data);
  }

  async deleteSurvey(surveyId: string | number): Promise<boolean> {
    // Las respuestas y preguntas se eliminarán en cascada por la BD
    const { error } = await this.supabaseClient
      .from("survey")
      .delete()
      .eq("survey_id", surveyId);

    if (error) {
      throw new Error(`Error deleting survey: ${error.message}`);
    }

    return true;
  }

  async getSurveyByPassword(password: string): Promise<Survey | null> {
    const { data, error } = await this.supabaseClient
      .from("survey")
      .select(
        `
        *,
        questions:question(*)
      `
      )
      .eq("password", password)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Error getting survey by password: ${error.message}`);
    }

    return this.mapSurveyFromDb(data);
  }

  // ============================================================
  // 🔹 QUESTION OPERATIONS
  // ============================================================

  async createQuestion(question: Question): Promise<Question> {
    /*    console.log("📝 createQuestion - entrada:", question); */

    const { data, error } = await this.supabaseClient
      .from("question")
      .insert({
        survey_id: question.surveyId,
        title: question.title,
        description: question.description,
        //question_type: question.questionType || "selection", // Valor por defecto: selection
        num_products: question.numProducts || 0,
      })
      .select()
      .single();

    /*     console.log("📥 createQuestion - data:", data);
    console.log("📥 createQuestion - error:", error); */

    if (error) {
      throw new Error(`Error creating question: ${error.message}`);
    }

    const createdQuestion = this.mapQuestionFromDb(data);
    /*    console.log("✅ createQuestion - resultado:", createdQuestion); */

    return createdQuestion;
  }

  async getQuestionsBySurveyId(surveyId: string | number): Promise<Question[]> {
    const { data, error } = await this.supabaseClient
      .from("question")
      .select("*")
      .eq("survey_id", surveyId)
      .order("question_id", { ascending: true });

    if (error) {
      throw new Error(`Error getting questions: ${error.message}`);
    }

    return data.map((q) => this.mapQuestionFromDb(q));
  }

  async updateQuestion(
    questionId: number,
    updates: Partial<Question>
  ): Promise<Question | null> {
    const updateData: any = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined)
      updateData.description = updates.description;
    if (updates.numProducts !== undefined)
      updateData.num_products = updates.numProducts;

    const { data, error } = await this.supabaseClient
      .from("question")
      .update(updateData)
      .eq("question_id", questionId)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Error updating question: ${error.message}`);
    }

    return this.mapQuestionFromDb(data);
  }

  async deleteQuestion(questionId: number): Promise<boolean> {
    // Las respuestas se eliminarán en cascada por la BD
    const { error } = await this.supabaseClient
      .from("question")
      .delete()
      .eq("question_id", questionId);

    if (error) {
      throw new Error(`Error deleting question: ${error.message}`);
    }

    return true;
  }

  // ============================================================
  // 🔹 PARTICIPANT OPERATIONS
  // ============================================================

  async createParticipant(
    participant: SurveyParticipant
  ): Promise<SurveyParticipant> {
    const { data, error } = await this.supabaseClient
      .from("survey_participant")
      .insert({
        name: participant.name,
        email: participant.email,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating participant: ${error.message}`);
    }

    return this.mapParticipantFromDb(data);
  }

  async getParticipantById(
    participantId: string
  ): Promise<SurveyParticipant | null> {
    const { data, error } = await this.supabaseClient
      .from("survey_participant")
      .select("*")
      .eq("participant_id", participantId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw new Error(`Error getting participant: ${error.message}`);
    }

    return this.mapParticipantFromDb(data);
  }

  async getParticipantsByIds(
    participantIds: string[]
  ): Promise<SurveyParticipant[]> {
    if (participantIds.length === 0) return [];

    const { data, error } = await this.supabaseClient
      .from("survey_participant")
      .select("*")
      .in("participant_id", participantIds);

    if (error) {
      console.error("Error getting participants:", error);
      return [];
    }

    return data.map(this.mapParticipantFromDb);
  }

  // ============================================================
  // 🔹 ANSWER OPERATIONS
  // ============================================================

  async createAnswer(answer: Answer): Promise<Answer> {
    console.log("💾 Guardando respuesta:", answer);
    
    const { data, error } = await this.supabaseClient
      .from("answer")
      .insert({
        question_id: answer.questionId,
        participant_id: answer.participantId,
        answer_option: answer.answer_option,
        comment: answer.comment,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error guardando respuesta:", error);
      throw new Error(`Error creating answer: ${error.message}`);
    }

    console.log("✅ Respuesta guardada:", data);
    return this.mapAnswerFromDb(data);
  }

  async getAnswersByQuestionId(questionId: number): Promise<Answer[]> {
    const { data, error } = await this.supabaseClient
      .from("answer")
      .select("*")
      .eq("question_id", questionId);

    if (error) {
      throw new Error(`Error getting answers: ${error.message}`);
    }

    return data.map(this.mapAnswerFromDb);
  }

  async getAnswersByParticipantId(participantId: string): Promise<Answer[]> {
    const { data, error } = await this.supabaseClient
      .from("answer")
      .select("*")
      .eq("participant_id", participantId);

    if (error) {
      throw new Error(`Error getting answers: ${error.message}`);
    }

    return data.map(this.mapAnswerFromDb);
  }

  async getAnswersBySurveyId(surveyId: string | number): Promise<Answer[]> {
    console.log("🔍 Buscando respuestas para survey_id:", surveyId);

    const { data, error } = await this.supabaseClient
      .from("answer")
      .select(
        `
        *,
        question!inner(survey_id)
      `
      )
      .eq("question.survey_id", surveyId);

    console.log("📥 Resultado de respuestas:", { data, error });

    if (error) {
      console.error("❌ Error:", error);
      throw new Error(`Error getting answers by survey: ${error.message}`);
    }

    console.log("✅ Respuestas encontradas:", data?.length || 0);
    return data.map(this.mapAnswerFromDb);
  }

  // ============================================================
  // 🔹 SURVEY-PRODUCT OPERATIONS
  // ============================================================

  async assignProductsToSurvey(
    surveyId: string,
    productIds: string[]
  ): Promise<boolean> {
    // Insertar relaciones en survey_product
    const insertData = productIds.map((productId) => ({
      survey_id: surveyId,
      product_id: productId,
    }));

    const { error } = await this.supabaseClient
      .from("survey_product")
      .upsert(insertData, { onConflict: "survey_id,product_id" });

    if (error) {
      throw new Error(`Error assigning products to survey: ${error.message}`);
    }

    return true;
  }

  async removeProductsFromSurvey(
    surveyId: string,
    productIds: string[]
  ): Promise<boolean> {
    const { error } = await this.supabaseClient
      .from("survey_product")
      .delete()
      .eq("survey_id", surveyId)
      .in("product_id", productIds);

    if (error) {
      throw new Error(`Error removing products from survey: ${error.message}`);
    }

    return true;
  }

  async getProductsBySurveyId(surveyId: string): Promise<string[]> {
    const { data, error } = await this.supabaseClient
      .from("survey_product")
      .select("product_id")
      .eq("survey_id", surveyId);

    if (error) {
      throw new Error(`Error getting products by survey: ${error.message}`);
    }

    return data.map((row) => row.product_id);
  }

  // ============================================================
  // 🔹 QUESTION-PRODUCT OPERATIONS
  // ============================================================

  async assignProductsToQuestion(
    questionId: string,
    productIds: string[]
  ): Promise<boolean> {
    // Insertar relaciones en question_product
    const insertData = productIds.map((productId) => ({
      question_id: questionId,
      product_id: productId,
    }));

    const { error } = await this.supabaseClient
      .from("question_product")
      .upsert(insertData, { onConflict: "question_id,product_id" });

    if (error) {
      throw new Error(`Error assigning products to question: ${error.message}`);
    }

    // El trigger update_question_product_count() actualizará num_products automáticamente
    return true;
  }

  async removeProductsFromQuestion(
    questionId: string,
    productIds: string[]
  ): Promise<boolean> {
    const { error } = await this.supabaseClient
      .from("question_product")
      .delete()
      .eq("question_id", questionId)
      .in("product_id", productIds);

    if (error) {
      throw new Error(
        `Error removing products from question: ${error.message}`
      );
    }

    // El trigger update_question_product_count() actualizará num_products automáticamente
    return true;
  }

  async getProductsByQuestionId(questionId: string): Promise<string[]> {
    const { data, error } = await this.supabaseClient
      .from("question_product")
      .select("product_id")
      .eq("question_id", questionId);

    if (error) {
      throw new Error(`Error getting products by question: ${error.message}`);
    }

    return data.map((row) => row.product_id);
  }

  // ============================================================
  // 🔹 MAPPERS (DB -> Domain)
  // ============================================================

  private mapSurveyFromDb(data: any): Survey {
    return {
      id: data.survey_id,
      title: data.title,
      description: data.description,
      adminId: data.admin_id,
      isPublic: data.is_public,
      password: data.password,
      questions:
        data.questions?.map((q: any) => this.mapQuestionFromDb(q)) || [],
      products: [], // Se carga por separado si es necesario
    };
  }

  private mapQuestionFromDb(data: any): Question {
    return {
      id: data.question_id,
      surveyId: data.survey_id,
      title: data.title,
      description: data.description,
      /* questionType: data.question_type, */
      numProducts: data.num_products,
      products: [], // Se carga por separado si es necesario
    };
  }

  private mapParticipantFromDb(data: any): SurveyParticipant {
    return {
      id: data.participant_id,
      name: data.name,
      email: data.email,
    };
  }

  private mapAnswerFromDb(data: any): Answer {
    return {
      id: data.answer_id,
      questionId: data.question_id,
      participantId: data.participant_id,
      answer_option: data.answer_option || "",
      comment: data.comment,
    };
  }
}

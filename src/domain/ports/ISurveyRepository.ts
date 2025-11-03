import { Survey } from "../entities/Survey";
import { Question } from "../entities/Question";
import { Answer } from "../entities/Answer";
import { SurveyParticipant } from "../entities/SurveyParticipant";

export interface ISurveyRepository {
  // Survey CRUD
  createSurvey(survey: Survey): Promise<Survey>;
  getSurveyById(surveyId: string | number): Promise<Survey | null>;
  getAllSurveys(adminId: string): Promise<Survey[]>;
  updateSurvey(
    surveyId: string | number,
    survey: Partial<Survey>
  ): Promise<Survey | null>;
  deleteSurvey(surveyId: string | number): Promise<boolean>;
  getSurveyByPassword(password: string): Promise<Survey | null>;

  // Question CRUD
  createQuestion(question: Question): Promise<Question>;
  getQuestionsBySurveyId(surveyId: string | number): Promise<Question[]>;
  updateQuestion(
    questionId: number,
    question: Partial<Question>
  ): Promise<Question | null>;
  deleteQuestion(questionId: number): Promise<boolean>;

  // Participant CRUD
  createParticipant(participant: SurveyParticipant): Promise<SurveyParticipant>;
  getParticipantById(participantId: string): Promise<SurveyParticipant | null>;
  getParticipantsByIds(participantIds: string[]): Promise<SurveyParticipant[]>;

  // Answer CRUD
  createAnswer(answer: Answer): Promise<Answer>;
  getAnswersByQuestionId(questionId: number): Promise<Answer[]>;
  getAnswersByParticipantId(participantId: string): Promise<Answer[]>;
  getAnswersBySurveyId(surveyId: string | number): Promise<Answer[]>;

  // Survey-Product Relations
  assignProductsToSurvey(
    surveyId: string,
    productIds: string[]
  ): Promise<boolean>;
  removeProductsFromSurvey(
    surveyId: string,
    productIds: string[]
  ): Promise<boolean>;
  getProductsBySurveyId(surveyId: string): Promise<string[]>; // Returns product IDs

  // Question-Product Relations
  assignProductsToQuestion(
    questionId: string,
    productIds: string[]
  ): Promise<boolean>;
  removeProductsFromQuestion(
    questionId: string,
    productIds: string[]
  ): Promise<boolean>;
  getProductsByQuestionId(questionId: string): Promise<string[]>; // Returns product IDs
}

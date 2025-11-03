export interface Answer {
  id?: number;
  questionId: number;
  participantId: string;
  answer_option: string;
  comment: string;
}

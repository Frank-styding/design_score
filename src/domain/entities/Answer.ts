"use server";
export class Answer {
  id?: number;
  questionId!: number;
  participantId!: string;
  comment!: string;
  constructor(params: {
    id?: number;
    questionId: number;
    participantId: string;
    comment: string;
  }) {
    this.id = params.id;
    this.questionId = params.questionId;
    this.participantId = params.participantId;
    this.comment = params.comment;
  }
}

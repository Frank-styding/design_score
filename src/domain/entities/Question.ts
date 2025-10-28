"use server";

export class Question {
  id?: number;
  surveyId!: number;
  title!: string;
  description!: string;
  numProducts!: number;
  constructor(params: {
    id?: number;
    surveyId: number;
    title: string;
    description: string;
    numProducts: number;
  }) {
    this.id = params.id;
    this.surveyId = params.surveyId;
    this.title = params.title;
    this.description = params.description;
    this.numProducts = params.numProducts;
  }
}

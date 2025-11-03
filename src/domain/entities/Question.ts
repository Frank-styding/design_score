import { Product } from "./Product";

export interface Question {
  id?: number;
  surveyId: number;
  title: string;
  description: string;
  //questionType: string; // Tipo de pregunta: 'selection', 'rating', 'text', etc.
  numProducts: number;
  products: Product[];
}

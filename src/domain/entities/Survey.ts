import { Product } from "./Product";
import { Question } from "./Question";

export interface Survey {
  id?: string; // UUID en formato string
  password?: string;
  title: string;
  description: string;
  adminId: string;
  isPublic: boolean;
  questions?: Question[];
  products?: Product[];
}

import { ProductImage } from "./ProductImage";

export class Product {
  constructor(
    public name: string,
    public description: string,
    public weight: number,
    public images: ProductImage[]
  ) {}
}

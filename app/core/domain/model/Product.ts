import { ProductImage } from "./ProductImage";

export class Product {
  constructor(
    public id: number,
    public groupdId: number,
    public name: string,
    public description: string,
    public weight: number,
    public images: ProductImage[]
  ) {}
}

import { ProductImage } from "./ProductImage";

export interface Product {
  id?: string;
  name: string;
  description?: string;
  size?: number;
  num_images?: number;
  images?: ProductImage[];
  //adminId: string;
  coverImageId?: string;
  xr_url: string;
}

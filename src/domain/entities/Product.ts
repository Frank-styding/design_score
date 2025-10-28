"use server";

import { ProductImage } from "./ProductImage";

export class Product {
  id?: string;
  name!: string;
  description!: string;
  weight!: number;
  num_images!: number;
  images!: ProductImage[];
  adminId!: string;
  coverImageId!: string;
  xr_url!: string;

  constructor(params: {
    id?: string;
    name: string;
    description: string;
    weight: number;
    num_images: number;
    images: ProductImage[];
    adminId: string;
    coverImageId: string;
    xr_url: string;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.description = params.description;
    this.weight = params.weight;
    this.num_images = params.num_images;
    this.images = params.images;
    this.adminId = params.adminId;
    this.coverImageId = params.coverImageId;
    this.xr_url = params.xr_url;
  }
}

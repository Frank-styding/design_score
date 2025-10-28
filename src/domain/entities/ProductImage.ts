"use server";
/* import { UploadedFile } from "../../app/core/types";
 */
export class ProductImage {
  id?: string;
  url?: string;
  path!: string;
  productId!: string;
  file_name!: string;
  size!: string;
  /*   private file!: UploadedFile;
   */
  constructor(params: {
    id?: string;
    url?: string;
    path: string;
    productId: string;
    file_name: string;
    size: string;
    /*   file: UploadedFile; */
  }) {
    this.id = params.id;
    this.url = params.url;
    this.path = params.path;
    this.productId = params.productId;
    this.file_name = params.file_name;
    this.size = params.size;
    /* this.file = params.file; */
  }
}

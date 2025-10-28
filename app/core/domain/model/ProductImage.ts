import { UploadedFile } from "../../types";

export class ProductImage {
  constructor(
    public name: string,
    public url: string,
    public path: string,
    public weight: number,
    public dimension: string,
    public file: UploadedFile
  ) {}
}

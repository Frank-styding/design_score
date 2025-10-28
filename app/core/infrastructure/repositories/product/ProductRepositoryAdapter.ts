import { ProductRepositoryPort } from "@/app/core/application/port/out/ProductRepositoryPort";
import { Product } from "@/app/core/domain/model/Product";
import { SubpabaseDB } from "../../db/SubpabaseDB";
import fs from "fs";
export class ProductRepositoryAdapter implements ProductRepositoryPort {
  save(product: Product): Product {
    /*     SubpabaseDB.getClient().from("Product").insert([{
      name: product.name,
      description: product.description,
      weight: product.weight

    }]) */
    /*     const folder_name = product.name;
    product.images.map(({ file }) => {
      const fileBuffer = fs.readFileSync(file.filepath);
      const filePath = `${folder_name}/${file.originalFilename}`;
      SubpabaseDB.getClient()
        .storage.from("products")
        .update(filePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: true,
        });
    });
    //SubpabaseDB.getClient().storage.from("products").update(``,)
    return product; */
  }
}

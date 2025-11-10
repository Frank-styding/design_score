import AdmZip from "adm-zip";
import fs from "fs/promises";
import path, { basename } from "path";

/**
 * Extrae constantes JavaScript del archivo HTML de KeyShot
 */
export function extractConstantsFromHTML(
  htmlText: string
): Record<string, any> {
  const regex = /var\s+(\w+)\s*=\s*([^;]+);/g;
  const constants: Record<string, any> = {};
  let match: RegExpExecArray | null;

  while ((match = regex.exec(htmlText)) !== null) {
    const name = match[1];
    let value: any = match[2].trim();

    if (/^".*"$/.test(value) || /^'.*'$/.test(value)) {
      value = value.slice(1, -1);
    } else if (value === "true" || value === "false") {
      value = value === "true";
    } else if (!isNaN(Number(value))) {
      value = Number(value);
    } else if (value === "{}") {
      value = {};
    }

    constants[name] = value;
  }

  return constants;
}

/**
 * Extrae archivos de un ZIP
 */
export async function extractZipFile(
  zipBuffer: Buffer
): Promise<Map<string, Buffer>> {
  const fileMap = new Map<string, Buffer>();
  const zip = new AdmZip(zipBuffer);
  const zipEntries = zip.getEntries();

  for (const entry of zipEntries) {
    if (!entry.isDirectory) {
      const content = entry.getData();
      fileMap.set(entry.entryName, content);
    }
  }

  return fileMap;
}

/**
 * Procesa archivos extraídos del ZIP (HTML + imágenes PNG)
 * Retorna constantes y lista de archivos de imagen
 */
export async function processExtractedFiles(
  filesMap: Map<string, Buffer>
): Promise<{
  constants: Record<string, any>;
  imageFiles: Map<string, Buffer>;
}> {
  const imageFiles = new Map<string, Buffer>();
  let htmlContent: string | null = null;

  // Filtrar archivos relevantes
  for (const [fileName, fileBuffer] of filesMap.entries()) {
    const baseName = path.basename(fileName);

    // Buscar archivo HTML principal (no instructions.html)
    if (baseName.endsWith(".html") && !baseName.startsWith("instructions")) {
      htmlContent = fileBuffer.toString("utf-8");
    }

    // Buscar imágenes PNG (excluir iconos de KeyShot)
    if (
      (baseName.endsWith(".png") || baseName.endsWith(".jpg")) &&
      !baseName.startsWith("instructions") &&
      !baseName.startsWith("GoFixedSizeIcon") &&
      !baseName.startsWith("GoFullScreenIcon") &&
      !baseName.startsWith("80X80") &&
      !baseName.startsWith("ks_logo")
    ) {
      imageFiles.set(baseName, fileBuffer);
    }
  }

  if (!htmlContent) {
    throw new Error("No se encontró archivo HTML principal en el ZIP");
  }

  const constants = extractConstantsFromHTML(htmlContent);

  return { constants, imageFiles };
}

/**
 * Procesa un archivo ZIP completo: extrae, procesa y retorna datos
 */
export async function processZipFile(zipBuffer: Buffer): Promise<{
  constants: Record<string, any>;
  imageFiles: Map<string, Buffer>;
}> {
  // 1. Extraer archivos del ZIP
  const extractedFiles = await extractZipFile(zipBuffer);

  // 2. Procesar archivos extraídos
  const result = await processExtractedFiles(extractedFiles);

  return result;
}

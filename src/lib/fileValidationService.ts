/**
 * Resultado de la validación
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Servicio para validar archivos ZIP
 */
export class FileValidationService {
  /**
   * Valida que el archivo sea un ZIP
   */
  validateZipExtension(fileName: string): ValidationResult {
    const isZip = fileName.toLowerCase().endsWith(".zip");

    if (!isZip) {
      return {
        isValid: false,
        error:
          "Solo se permiten archivos .zip. Por favor, convierte tu archivo a formato ZIP.",
      };
    }

    return { isValid: true };
  }

  /**
   * Valida que el buffer sea un archivo ZIP válido
   */
  validateZipContent(buffer: Buffer): ValidationResult {
    try {
      const AdmZip = require("adm-zip");
      const testZip = new AdmZip(buffer);
      testZip.getEntries();
      return { isValid: true };
    } catch (error: any) {
      return {
        isValid: false,
        error: `Archivo ZIP corrupto o inválido: ${error.message}`,
      };
    }
  }

  /**
   * Valida que exista un archivo
   */
  validateFileExists(file: File | null): ValidationResult {
    if (!file) {
      return {
        isValid: false,
        error: "No se proporcionó archivo",
      };
    }
    return { isValid: true };
  }

  /**
   * Valida los parámetros requeridos
   */
  validateRequiredParams(
    params: Record<string, string | null>
  ): ValidationResult {
    const missing = Object.entries(params)
      .filter(([, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      return {
        isValid: false,
        error: `Se requiere: ${missing.join(", ")}`,
      };
    }

    return { isValid: true };
  }
}

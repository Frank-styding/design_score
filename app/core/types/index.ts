// types/upload.ts
export interface UploadedFile {
  originalFilename: string;
  mimetype: string;
  size: number;
  filepath: string;
  newFilename: string;
  hash: string | null;
}

export interface UploadResult {
  message: string;
  successful: number;
  failed: number;
  uploads: Array<{
    file: string;
    path: string;
    size?: number;
  }>;
  errors: Array<{
    file: string;
    error: string;
  }>;
}

export interface FormDataFields {
  folderName?: string[];
}

export interface FormDataFiles {
  [key: string]: UploadedFile[];
}

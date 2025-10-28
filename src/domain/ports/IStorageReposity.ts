export interface IStorageRepository {
  uploadFile(
    filePath: string,
    file: File
  ): Promise<{
    ok: boolean;
    data: { fullPath: string; path: string } | null;
    error: string | null;
  }>;
  deleteFile(filePath: string): Promise<{
    ok: boolean;
    error: string | null;
  }>;
  deleteFiles(filePaths: string[]): Promise<{
    ok: boolean;
    error: string | null;
  }>;
  getFileUrl(filePath: string): Promise<{ url: string | null }>;
}

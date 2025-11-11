"use client";

import { useState, useRef, DragEvent } from "react";

interface SingleFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, modelName: string) => Promise<void>;
  adminId: string;
  projectId?: string;
}

export default function SingleFileUploadModal({
  isOpen,
  onClose,
  onUpload,
}: SingleFileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [modelName, setModelName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelection(droppedFiles[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    const fileName = selectedFile.name.toLowerCase();

    // Validar que sea ZIP o RAR
    if (!fileName.endsWith(".zip") && !fileName.endsWith(".rar")) {
      setError("Solo se aceptan archivos .zip o .rar");
      return;
    }

    setFile(selectedFile);
    setError("");

    // Auto-llenar el nombre del modelo basado en el nombre del archivo
    const nameWithoutExtension = selectedFile.name.replace(/\.(zip|rar)$/i, "");
    if (!modelName) {
      setModelName(nameWithoutExtension);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError("");
  };

  const handleSubmit = async () => {
    if (!file || !modelName.trim()) {
      setError("Por favor selecciona un archivo y asigna un nombre");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      await onUpload(file, modelName.trim());
      // Reset y cerrar
      setFile(null);
      setModelName("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al subir el archivo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setModelName("");
      setError("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Subir Modelo 3D
          </h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Nombre del modelo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Modelo
            </label>
            <input
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              placeholder="Ej: Silla Moderna 2024"
              disabled={isUploading}
            />
          </div>

          {/* Drag and Drop Area */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                isDragging
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center gap-3">
                <UploadIcon />
                <div>
                  <p className="text-gray-700 font-medium mb-1">
                    Arrastra tu archivo aquí
                  </p>
                  <p className="text-gray-500 text-sm">
                    o haz clic para seleccionar
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    Solo archivos .zip o .rar
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".zip,.rar"
                disabled={isUploading}
              />
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <FileIcon />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate font-medium">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isUploading}
                className="text-gray-400 hover:text-red-600 transition-colors ml-2 disabled:opacity-50"
              >
                <TrashIcon />
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || !modelName.trim() || isUploading}
            className={`px-6 py-2 rounded-md font-medium text-white transition-colors ${
              !file || !modelName.trim() || isUploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {isUploading ? "Subiendo..." : "Subir Modelo"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Iconos SVG
function UploadIcon() {
  return (
    <svg
      className="w-12 h-12 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg
      className="w-6 h-6 text-blue-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  );
}

"use client";

import { useState } from "react";

interface UploadRarFormProps {
  productId: string;
  adminId: string;
  onSuccess?: () => void;
}

export default function UploadRarForm({
  productId,
  adminId,
  onSuccess,
}: UploadRarFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".zip")) {
        setError("Por favor selecciona un archivo .zip");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Por favor selecciona un archivo");
      return;
    }

    setUploading(true);
    setError(null);
    setProgress("Subiendo archivo...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("product_id", productId);
      formData.append("admin_id", adminId);

      setProgress("Procesando archivo ZIP...");

      const response = await fetch("/api/upload-rar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Error al procesar archivo");
      }

      setProgress("¡Completado!");
      setResult(data);
      setFile(null);

      // Resetear el input
      const fileInput = document.getElementById(
        "zip-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Llamar callback de éxito
      if (onSuccess) {
        setTimeout(onSuccess, 1000);
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Error al subir archivo");
      setProgress("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Subir Archivo KeyShot (.zip)</h2>

      <div className="mb-4">
        <label
          htmlFor="zip-input"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Seleccionar archivo ZIP
        </label>
        <input
          id="zip-input"
          type="file"
          accept=".zip"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
        />
      </div>

      {file && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            📦 Archivo seleccionado: <strong>{file.name}</strong> (
            {(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">❌ {error}</p>
        </div>
      )}

      {progress && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">🔄 {progress}</p>
        </div>
      )}

      {result && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <h3 className="text-sm font-semibold text-green-800 mb-2">
            ✅ Procesado exitosamente
          </h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>
              📊 Constantes extraídas: {Object.keys(result.constants).length}
            </li>
            <li>🖼️ Imágenes subidas: {result.imageCount}</li>
            <li>📁 Path: {result.storagePath}</li>
          </ul>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
          !file || uploading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-600 text-white hover:bg-blue-700"
        }`}
      >
        {uploading ? "Procesando..." : "Subir y Procesar"}
      </button>

      <p className="mt-4 text-xs text-gray-500">
        El archivo ZIP debe contener un archivo HTML principal y las imágenes
        PNG generadas por KeyShot.
      </p>
    </div>
  );
}

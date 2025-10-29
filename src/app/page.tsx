"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import {
  createProductAction,
  addImageToProductAction,
} from "./actions/productActions";
import { signInAction, signUpAction } from "./actions/authActions";

// ---------------------------------------------
// 🔹 Función auxiliar para leer constantes de un HTML
// ---------------------------------------------
function extractConstantsFromHTML(htmlText: string): Record<string, any> {
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

// ---------------------------------------------
// 🔹 Procesar carpeta (HTML + imágenes)
// ---------------------------------------------
async function processFiles(selectedFiles: FileList) {
  const files = Array.from(selectedFiles).filter((file) => {
    return (
      (file.name.endsWith(".png") || file.name.endsWith(".html")) &&
      !file.name.startsWith("instructions") &&
      !file.name.startsWith("GoFixedSizeIcon") &&
      !file.name.startsWith("GoFullScreenIcon") &&
      !file.name.startsWith("80X80") &&
      !file.name.startsWith("ks_logo")
    );
  });

  const images = files.filter((file) => file.name.endsWith(".png"));
  const mainHtmlFile = files.find((file) => file.name.endsWith(".html"));

  if (!mainHtmlFile) throw new Error("No se encontró archivo HTML principal");

  const fileReader = new FileReader();

  const parsedConstants = await new Promise<string>((resolve, reject) => {
    fileReader.onload = () => {
      try {
        const text = fileReader.result as string;
        const constants = extractConstantsFromHTML(text);
        resolve(JSON.stringify(constants));
      } catch {
        reject("Error al procesar main.html");
      }
    };
    fileReader.onerror = () => reject("No se pudo leer el archivo HTML");
    fileReader.readAsText(mainHtmlFile);
  });

  return { parsedConstants, images };
}

// ---------------------------------------------
// 🔹 Formulario de login simple
// ---------------------------------------------
function LoginForm({
  onLogin,
}: {
  onLogin: (email: string, password: string) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }
    setError(null);
    onLogin(email, password);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col bg-gray-800 p-4 rounded mb-6 w-80 mx-auto"
    >
      <h3 className="text-lg font-semibold mb-3 text-white">Iniciar Sesión</h3>

      <input
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2 p-2 rounded bg-white text-black"
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-3 p-2 rounded bg-white text-black"
        required
      />

      {error && <p className="text-red-400 mb-2">{error}</p>}

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded"
      >
        Entrar
      </button>
    </form>
  );
}

// ---------------------------------------------
// 🔹 Formulario de subida de carpeta
// ---------------------------------------------
function UploadFolderForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    if (!selectedFiles || selectedFiles.length === 0) {
      setError("Selecciona una carpeta antes de subir.");
      return;
    }

    try {
      const { parsedConstants, images } = await processFiles(selectedFiles);

      const product = await createProductAction({
        name: "Producto desde carpeta",
        description: "",
        xr_url: parsedConstants,
      });

      if (!product) throw new Error("No se puedo crear el producto");
      console.log(product);
      // 🔹 Subir imágenes una por una
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const progress = Math.round(((i + 1) / images.length) * 100);
        setUploadProgress(progress);

        const res = await addImageToProductAction(product.id as string, image);
        if (!res || !res.ok) throw new Error(`Error en imagen ${image.name}`);
      }

      setSuccess("Producto y todas las imágenes subidas correctamente ✅");
    } catch (err: any) {
      setError(err.message || "Error al subir la carpeta");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col bg-gray-900 text-white p-6 rounded w-fit mx-auto"
    >
      <h3 className="text-lg font-semibold mb-4">Subir Carpeta Completa</h3>

      <input
        ref={fileInputRef}
        type="file"
        name="files"
        multiple
        onChange={handleFileChange}
        className="text-white cursor-pointer"
        title="-"
        {...{ webkitdirectory: "" }}
        {...{ directory: "" }}
      />

      {selectedFiles && (
        <p className="text-sm text-gray-400 mt-2">
          {selectedFiles.length} archivos seleccionados.
        </p>
      )}

      {uploadProgress > 0 && uploadProgress < 100 && (
        <p className="text-sm text-blue-400 mt-2">
          Subiendo imágenes... {uploadProgress}%
        </p>
      )}

      {error && <p className="text-red-400 mt-2">{error}</p>}
      {success && <p className="text-green-400 mt-2">{success}</p>}

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-500 mt-4 py-2 px-4 rounded"
      >
        Subir Carpeta
      </button>
    </form>
  );
}

// ---------------------------------------------
// 🔹 Página principal combinada
// ---------------------------------------------
export default function UploadPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    // Aquí puedes reemplazar con tu auth real
    const { success, error } = await signUpAction(email, password);
    if (!success) {
      alert(error);
    } else {
      setIsLoggedIn(true);
    }
    /*     if (email === "admin@test.com" && password === "123456") {
      setIsLoggedIn(true);
    } else {
      alert("Credenciales incorrectas");
    } */
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {!isLoggedIn ? <LoginForm onLogin={handleLogin} /> : <UploadFolderForm />}
    </div>
  );
}

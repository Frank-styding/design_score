"use client";

import { useState, useRef, ChangeEvent, FormEvent } from "react";
import {
  createProductAction,
  addImageToProductAction,
} from "./actions/productActions";
import {
  signInAction,
  signUpAction,
  signOutAction,
} from "./actions/authActions";
import KeyShotXRViewer from "../components/KeyShotXRViewer";

// ============================================================
// 🔹 Función auxiliar para leer constantes del HTML
// ============================================================
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

// ============================================================
// 🔹 Procesar carpeta (HTML + imágenes)
// ============================================================
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

// ============================================================
// 🔹 Formulario de autenticación (login / signup)
// ============================================================
function AuthForm({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      let result;
      if (mode === "signin") {
        result = await signInAction(email, password);
      } else {
        result = await signUpAction(email, password);
      }

      if (!result.success) {
        setError(result.error || "Error en autenticación");
        return;
      }

      onAuthSuccess();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col bg-gray-800 p-4 rounded mb-6 w-80 mx-auto"
    >
      <h3 className="text-lg font-semibold mb-3 text-white">
        {mode === "signin" ? "Iniciar Sesión" : "Crear Cuenta"}
      </h3>

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
        className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded mb-2"
      >
        {mode === "signin" ? "Entrar" : "Registrarse"}
      </button>

      <button
        type="button"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="text-blue-300 text-sm hover:underline"
      >
        {mode === "signin"
          ? "¿No tienes cuenta? Regístrate"
          : "¿Ya tienes cuenta? Inicia sesión"}
      </button>
    </form>
  );
}

// ============================================================
// 🔹 Subida de carpeta (HTML + imágenes)
// ============================================================
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

      if (!product) throw new Error("No se pudo crear el producto");

      const batchSize = 10;
      for (let i = 0; i < images.length; i += batchSize) {
        const batch = images.slice(i, i + batchSize);

        const results = await Promise.all(
          batch.map((image) =>
            addImageToProductAction(product.id as string, image, i == 0)
          )
        );

        results.forEach((res, index) => {
          if (!res || !res.ok) {
            const failedImage = batch[index];
            throw new Error(`Error en imagen ${failedImage.name}`);
          }
        });

        const progress = Math.round(((i + batch.length) / images.length) * 100);
        setUploadProgress(progress);
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

function ViewProduct() {
  const baseUrl =
    "https://emrgqbrqnqpbkrpruwts.supabase.co/storage/v1/object/public/files/776dbc5d-64e1-4489-8f48-3bb1dfb5ba2e/deed98f7-e7e3-426f-8c28-2f35a4962e36";

  return (
    <KeyShotXRViewer
      containerId="keyshot-viewer"
      baseUrl={baseUrl}
      className="w-40 h-40"
      width={1024}
      height={575}
      columns={36}
      rows={5}
    />
  );
}
// ============================================================
// 🔹 Página principal
// ============================================================
export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [displayView, setDisplayView] = useState(false);

  const handleAuthSuccess = () => setIsLoggedIn(true);

  const handleSignOut = async () => {
    await signOutAction();
    setIsLoggedIn(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6">
      {displayView ? (
        !isLoggedIn ? (
          <>
            <AuthForm onAuthSuccess={handleAuthSuccess} />
          </>
        ) : (
          <div className="flex flex-col items-center">
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded mb-6"
            >
              Cerrar Sesión
            </button>

            <UploadFolderForm />
          </div>
        )
      ) : (
        <ViewProduct />
      )}

      <button
        className="bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded mb-6"
        onClick={() => setDisplayView(!displayView)}
      >
        Show View
      </button>
    </div>
  );
}

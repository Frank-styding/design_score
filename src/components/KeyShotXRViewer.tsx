"use client";
import { useEffect, useMemo, useRef } from "react";

interface KeyShotXRProps {
  containerId: string;
  baseUrl: string; // Carpeta con frames 'row_col.ext'
  width?: number;
  height?: number;
  columns?: number;
  rows?: number;
  backgroundColor?: string;
  className?: string;
  style?: React.CSSProperties;
  imageExt?: "png" | "jpg" | "webp";
}

export default function KeyShotXRViewer({
  containerId = "KeyShotXR",
  baseUrl,
  width = 1024,
  height = 575,
  columns = 36,
  rows = 5,
  backgroundColor = "#000000",
  className,
  style,
  imageExt = "png",
}: KeyShotXRProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const normalized = useMemo(() => {
    if (!baseUrl || typeof baseUrl !== "string") return null;
    const base = baseUrl.replace(/\/+$/, "");
    const startCol = Math.floor(columns / 2);
    const startRow = Math.floor(rows / 2);
    const initialFrame = `${base}/${startRow}_${startCol}.${imageExt}`;
    let origin = "";
    try {
      origin = new URL(base, window.location.origin).origin;
    } catch {
      origin = "";
    }
    return { base, startCol, startRow, initialFrame, origin };
  }, [baseUrl, columns, rows, imageExt]);

  useEffect(() => {
    if (!iframeRef.current) return;

    if (!normalized) {
      console.error(
        "KeyShotXRViewer: baseUrl es requerido y debe ser string. Recibido:",
        baseUrl
      );
      return;
    }

    const { base, startCol, startRow, initialFrame, origin } = normalized;

    // Preconexión al host para reducir el RTT inicial
    const preconnect = origin
      ? `<link rel="preconnect" href="${origin}" crossorigin>
         <link rel="dns-prefetch" href="${origin}">`
      : "";

    // Preload SOLO del frame inicial con prioridad alta
    const preloadInitial = `<link rel="preload" as="image" href="${initialFrame}" fetchpriority="high">`;

    const html = `
      <!DOCTYPE html>
      <html xmlns='http://www.w3.org/1999/xhtml'>
        <head>
          <meta http-equiv="X-UA-Compatible" content="IE=Edge"/>
          <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
          <title>KeyShotXR</title>
          ${preconnect}
          ${preloadInitial}
          <style type="text/css">
            body { 
              -ms-touch-action: none;
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: ${backgroundColor};
            }
            #${containerId} {
              width: 100%;
              height: 100%;
              /* Mostrar algo al instante: el frame inicial como fondo */
              background: ${backgroundColor} url("${initialFrame}") center / contain no-repeat;
            }
          </style>
          <!-- Carga diferida del script y arranque con DOMContentLoaded para no esperar a window.onload -->
          <script src="/js/KeyShotXR.js" defer></script>
          <script defer>
            function initKeyShotXR() {
              console.log("KeyShotXR baseUrl:", "${base}");
              console.log("Primer frame esperado:", "${initialFrame}");

              var keyshotXR = new window.keyshotXR(
                "${containerId}",
                "${base}",
                ${width},
                ${height},
                "${backgroundColor}",
                ${columns},              // columnas
                ${rows},                 // filas
                true,                    // wrap horizontal
                false,                   // wrap vertical
                -0.1,                    // sensibilidad X
                0.0625,                  // sensibilidad Y
                ${startCol},             // columna inicial
                ${startRow},             // fila inicial
                1,                       // zoom min
                1,                       // zoom max
                0.96,                    // inercia
                true,                    // flexible
                false,                   // botón fullscreen
                false,                   // overlay tap-to-start
                "${imageExt}",           // extensión
                true,                    // spinner
                "80X80.png",             // logo spinner
                true,                    // Ga
                false,                   // Ha
                false,                   // Ia
                {},                      // hotspots
                false                    // Ja
              );

              // Paralelismo y semilla de descargas (ajusta entre 6–12 según CDN)
              keyshotXR.Aa = 8;
              for (var i = 1; i < keyshotXR.Aa; i++) keyshotXR.ga();
            }

            document.addEventListener("DOMContentLoaded", function(){
              if (window.keyshotXR) {
                initKeyShotXR();
              } else {
                // Safety: si el script aún no cargó, lo cargamos manualmente y arrancamos al onload
                var s = document.createElement("script");
                s.src = "/js/KeyShotXR.js";
                s.onload = initKeyShotXR;
                document.head.appendChild(s);
              }
            });
          </script>
        </head>
        <body oncontextmenu="return false;">
          <div id="${containerId}"></div>
        </body>
      </html>
    `;

    const iframeDoc = iframeRef.current.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
    }
  }, [
    normalized,
    containerId,
    width,
    height,
    backgroundColor,
    columns,
    rows,
    imageExt,
    className,
    style,
  ]);

  return (
    <div
      style={{
        width: width,
        height: height,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
      className={className}
    >
      <iframe
        ref={iframeRef}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          backgroundColor: "#000000",
        }}
        allow="fullscreen"
      />
    </div>
  );
}

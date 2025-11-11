"use client";
import { useEffect, useMemo, useRef, memo } from "react";

// Configuración completa de KeyShotXR según el formato original
interface KeyShotXRConfig {
  nameOfDiv?: string;
  folderName: string; // Equivalente a baseUrl
  viewPortWidth?: number;
  viewPortHeight?: number;
  backgroundColor?: string;
  uCount?: number; // columns
  vCount?: number; // rows
  uWrap?: boolean;
  vWrap?: boolean;
  uMouseSensitivity?: number;
  vMouseSensitivity?: number;
  uStartIndex?: number;
  vStartIndex?: number;
  minZoom?: number;
  maxZoom?: number;
  rotationDamping?: number;
  downScaleToBrowser?: boolean;
  addDownScaleGUIButton?: boolean;
  downloadOnInteraction?: boolean;
  imageExtension?: string;
  showLoading?: boolean;
  loadingIcon?: string;
  allowFullscreen?: boolean;
  uReverse?: boolean;
  vReverse?: boolean;
  hotspots?: Record<string, any>;
  isIBooksWidget?: boolean;
}

// Props del componente (mantiene retrocompatibilidad)
interface KeyShotXRProps {
  // Opción 1: Configuración completa
  config?: KeyShotXRConfig;

  // Opción 2: Props individuales (retrocompatibilidad)
  containerId?: string;
  baseUrl?: string;
  width?: number;
  height?: number;
  columns?: number;
  rows?: number;
  backgroundColor?: string;
  imageExt?: "png" | "jpg" | "webp";

  // Props adicionales
  className?: string;
  style?: React.CSSProperties;

  // Eventos
  onLoad?: () => void;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}

function KeyShotXRViewer({
  config,
  containerId,
  baseUrl,
  width,
  height,
  columns,
  rows,
  backgroundColor,
  imageExt,
  className,
  style,
  onLoad,
  onProgress,
  onError,
}: KeyShotXRProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Mergear configuración: prioridad a config, fallback a props individuales
  const mergedConfig = useMemo(() => {
    if (config) {
      // Si se proporciona config, usarlo con valores por defecto
      return {
        nameOfDiv: config.nameOfDiv || "KeyShotXR",
        folderName: baseUrl || "",
        viewPortWidth: config.viewPortWidth || 1024,
        viewPortHeight: config.viewPortHeight || 575,
        backgroundColor: config.backgroundColor || "#000000",
        uCount: config.uCount || 36,
        vCount: config.vCount || 5,
        uWrap: config.uWrap !== undefined ? config.uWrap : true,
        vWrap: config.vWrap !== undefined ? config.vWrap : false,
        uMouseSensitivity:
          config.uMouseSensitivity !== undefined
            ? config.uMouseSensitivity
            : -0.1,
        vMouseSensitivity:
          config.vMouseSensitivity !== undefined
            ? config.vMouseSensitivity
            : 0.0625,
        uStartIndex:
          config.uStartIndex !== undefined
            ? config.uStartIndex
            : Math.floor((config.uCount || 36) / 2),
        vStartIndex: config.vStartIndex !== undefined ? config.vStartIndex : 0,
        minZoom: config.minZoom !== undefined ? config.minZoom : 1,
        maxZoom: config.maxZoom !== undefined ? config.maxZoom : 1,
        rotationDamping:
          config.rotationDamping !== undefined ? config.rotationDamping : 0.96,
        downScaleToBrowser:
          config.downScaleToBrowser !== undefined
            ? config.downScaleToBrowser
            : true,
        addDownScaleGUIButton:
          config.addDownScaleGUIButton !== undefined
            ? config.addDownScaleGUIButton
            : false,
        downloadOnInteraction:
          config.downloadOnInteraction !== undefined
            ? config.downloadOnInteraction
            : false,
        imageExtension: config.imageExtension || "png",
        showLoading:
          config.showLoading !== undefined ? config.showLoading : true,
        loadingIcon: config.loadingIcon || "80X80.png",
        allowFullscreen:
          config.allowFullscreen !== undefined ? config.allowFullscreen : true,
        uReverse: config.uReverse !== undefined ? config.uReverse : false,
        vReverse: config.vReverse !== undefined ? config.vReverse : false,
        hotspots: config.hotspots || {},
        isIBooksWidget:
          config.isIBooksWidget !== undefined ? config.isIBooksWidget : false,
      };
    } else {
      // Retrocompatibilidad con props individuales
      const cols = columns || 36;
      const rws = rows || 5;
      return {
        nameOfDiv: containerId || "KeyShotXR",
        folderName: baseUrl || "",
        viewPortWidth: width || 1024,
        viewPortHeight: height || 575,
        backgroundColor: backgroundColor || "#000000",
        uCount: cols,
        vCount: rws,
        uWrap: true,
        vWrap: false,
        uMouseSensitivity: -0.1,
        vMouseSensitivity: 0.0625,
        uStartIndex: Math.floor(cols / 2),
        vStartIndex: 0,
        minZoom: 1,
        maxZoom: 1,
        rotationDamping: 0.96,
        downScaleToBrowser: true,
        addDownScaleGUIButton: false,
        downloadOnInteraction: false,
        imageExtension: imageExt || "png",
        showLoading: true,
        loadingIcon: "80X80.png",
        allowFullscreen: true,
        uReverse: false,
        vReverse: false,
        hotspots: {},
        isIBooksWidget: false,
      };
    }
  }, [
    config,
    containerId,
    baseUrl,
    width,
    height,
    columns,
    rows,
    backgroundColor,
    imageExt,
  ]);

  const normalized = useMemo(() => {
    const cfg = mergedConfig;

    if (!cfg.folderName || typeof cfg.folderName !== "string") return null;

    const base = cfg.folderName.replace(/\/+$/, "");
    const startCol = cfg.uStartIndex;
    const startRow = cfg.vStartIndex;
    const initialFrame = `${base}/${startRow}_${startCol}.${cfg.imageExtension}`;

    let origin = "";
    try {
      origin = new URL(base, window.location.origin).origin;
    } catch {
      origin = "";
    }

    return {
      base,
      startCol,
      startRow,
      initialFrame,
      origin,
      config: cfg,
    };
  }, [mergedConfig]);

  useEffect(() => {
    if (!iframeRef.current) return;

    if (!normalized) {
      const errorMsg =
        "KeyShotXRViewer: folderName/baseUrl es requerido y debe ser string.";
      console.error(errorMsg);
      onError?.(errorMsg);
      return;
    }

    const {
      base,
      startCol,
      startRow,
      initialFrame,
      origin,
      config: cfg,
    } = normalized;

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
              background: ${cfg.backgroundColor};
            }
            #${cfg.nameOfDiv} {
              width: 100%;
              height: 100%;
              /* Mostrar algo al instante: el frame inicial como fondo */
              background: ${
                cfg.backgroundColor
              } url("${initialFrame}") center / contain no-repeat;
            }
          </style>
          <!-- Carga diferida del script y arranque con DOMContentLoaded para no esperar a window.onload -->
          <script src="/js/KeyShotXR.js" defer></script>
          <script defer>
            function initKeyShotXR() {
              //console.log("KeyShotXR config:", ${JSON.stringify(cfg)});
              //console.log("Primer frame esperado:", "${initialFrame}");

              var keyshotXR = new window.keyshotXR(
                "${cfg.nameOfDiv}",
                "${base}",
                ${cfg.viewPortWidth},
                ${cfg.viewPortHeight},
                "${cfg.backgroundColor}",
                ${cfg.uCount},
                ${cfg.vCount},
                ${cfg.uWrap},
                ${cfg.vWrap},
                ${cfg.uMouseSensitivity},
                ${cfg.vMouseSensitivity},
                ${cfg.uStartIndex},
                ${cfg.vStartIndex},
                ${cfg.minZoom},
                ${cfg.maxZoom},
                ${cfg.rotationDamping},
                ${cfg.downScaleToBrowser},
                ${cfg.addDownScaleGUIButton},
                ${cfg.downloadOnInteraction},
                "${cfg.imageExtension}",
                ${cfg.showLoading},
                "${cfg.loadingIcon}",
                ${cfg.allowFullscreen},
                ${cfg.uReverse},
                ${cfg.vReverse},
                ${JSON.stringify(cfg.hotspots)},
                ${cfg.isIBooksWidget}
              );

              // Sobrescribir el método de progreso para reportar al componente React
              var originalSaMethod = keyshotXR.Sa;
              keyshotXR.Sa = function(progress) {
                originalSaMethod.call(keyshotXR, progress);
                // Comunicar el progreso al componente padre
                window.parent.postMessage({
                  type: 'keyshot-progress',
                  containerId: '${cfg.nameOfDiv}',
                  progress: progress * 100
                }, '*');
              };

              // Sobrescribir el método de carga completa
              var originalRaMethod = keyshotXR.Ra;
              keyshotXR.Ra = function() {
                originalRaMethod.call(keyshotXR);
                // Notificar que la carga está completa
                window.parent.postMessage({
                  type: 'keyshot-loaded',
                  containerId: '${cfg.nameOfDiv}'
                }, '*');
                console.log("KeyShotXR: Todas las imágenes cargadas");
              };

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
                s.onerror = function() {
                  window.parent.postMessage({
                    type: 'keyshot-error',
                    containerId: '${cfg.nameOfDiv}',
                    error: 'Failed to load KeyShotXR.js'
                  }, '*');
                };
                document.head.appendChild(s);
              }
            });
          </script>
        </head>
        <body oncontextmenu="return false;">
          <div id="${cfg.nameOfDiv}"></div>
        </body>
      </html>
    `;

    const iframeDoc = iframeRef.current.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();
    }

    // Escuchar mensajes del iframe
    const handleMessage = (event: MessageEvent) => {
      if (
        event.data.type === "keyshot-loaded" &&
        event.data.containerId === cfg.nameOfDiv
      ) {
        onLoad?.();
      } else if (
        event.data.type === "keyshot-progress" &&
        event.data.containerId === cfg.nameOfDiv
      ) {
        onProgress?.(Math.round(event.data.progress));
      } else if (
        event.data.type === "keyshot-error" &&
        event.data.containerId === cfg.nameOfDiv
      ) {
        onError?.(event.data.error);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [normalized, onLoad, onProgress, onError]);

  return (
    <div
      style={{
        width: mergedConfig.viewPortWidth,
        height: mergedConfig.viewPortHeight,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
      className={className}
    >
      <iframe
        ref={iframeRef}
        style={{
          width: width || "100%",
          height: height || "100%",
          border: "none",
          backgroundColor: mergedConfig.backgroundColor,
        }}
        allow="fullscreen"
      />
    </div>
  );
}

// Función de comparación para memo - evita re-renders innecesarios
function arePropsEqual(
  prevProps: Readonly<KeyShotXRProps>,
  nextProps: Readonly<KeyShotXRProps>
): boolean {
  // Comparar config (objeto de configuración completo)
  if (prevProps.config !== nextProps.config) {
    // Si ambos son objetos, comparar propiedades críticas
    if (prevProps.config && nextProps.config) {
      const criticalKeys: (keyof KeyShotXRConfig)[] = [
        "folderName",
        "viewPortWidth",
        "viewPortHeight",
        "uCount",
        "vCount",
        "nameOfDiv",
      ];

      for (const key of criticalKeys) {
        if (prevProps.config[key] !== nextProps.config[key]) {
          return false;
        }
      }
    } else if (prevProps.config !== nextProps.config) {
      return false;
    }
  }

  // Comparar props individuales críticas
  if (
    prevProps.baseUrl !== nextProps.baseUrl ||
    prevProps.containerId !== nextProps.containerId ||
    prevProps.width !== nextProps.width ||
    prevProps.height !== nextProps.height ||
    prevProps.columns !== nextProps.columns ||
    prevProps.rows !== nextProps.rows
  ) {
    return false;
  }

  // No comparar callbacks (onLoad, onProgress, onError)
  // ya que usar useCallback los mantiene estables

  return true;
}

// Usar memo con comparación personalizada para evitar re-renders innecesarios
export default memo(KeyShotXRViewer, arePropsEqual);

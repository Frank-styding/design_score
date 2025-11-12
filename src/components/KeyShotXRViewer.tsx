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

  // Props para sincronización
  viewerId?: string;
  onIframeReady?: (iframe: HTMLIFrameElement | null) => void;

  // Eventos
  onLoad?: () => void;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;

  // NUEVO: alterna entre precarga de imágenes y carga directa
  preloadImages?: boolean;
}

function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          const img = new window.Image();
          img.onload = () => resolve();
          img.onerror = () => reject(url);
          img.src = url;
        })
    )
  );
}

function KeyShotXRViewer({
  config,
  containerId,
  baseUrl,
  width,
  height,
  columns,
  rows,
  backgroundColor = "white",
  imageExt,
  className,
  style,
  viewerId,
  onIframeReady,
  onLoad,
  onProgress,
  onError,
  preloadImages = false,
}: KeyShotXRProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Notificar cuando el iframe esté listo
  useEffect(() => {
    if (iframeRef.current && onIframeReady) {
      onIframeReady(iframeRef.current);
    }
    return () => {
      if (onIframeReady) {
        onIframeReady(null);
      }
    };
  }, [onIframeReady]);

  // Mergear configuración: prioridad a config, fallback a props individuales
  const mergedConfig = useMemo(() => {
    if (config) {
      // Si se proporciona config, usarlo con valores por defecto
      return {
        nameOfDiv: viewerId || config.nameOfDiv || "KeyShotXR",
        folderName: baseUrl || "",
        viewPortWidth: config.viewPortWidth || 1024,
        viewPortHeight: config.viewPortHeight || 575,
        backgroundColor: "#FFFFFF",
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
        // ZOOM PERSONALIZADO: Rango ampliado para que sea más obvio
        minZoom: 0.5,
        maxZoom: 2.0,
        rotationDamping:
          config.rotationDamping !== undefined ? config.rotationDamping : 0.96,
        downScaleToBrowser: false, // Deshabilitado para permitir zoom
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
        nameOfDiv: viewerId || containerId || "KeyShotXR",
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
        // ZOOM PERSONALIZADO: Rango ampliado para que sea más obvio
        minZoom: 0.5,
        maxZoom: 2.0,
        rotationDamping: 0.96,
        downScaleToBrowser: false, // Deshabilitado para permitir zoom
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
    viewerId,
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

    // Sanitizar el nameOfDiv para usarlo como nombre de variable JavaScript
    // Reemplazar guiones y otros caracteres no válidos con guiones bajos
    const sanitizedVarName = cfg.nameOfDiv.replace(/[^a-zA-Z0-9_]/g, "_");

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
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            html, body { 
              -ms-touch-action: none;
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
              background: ${cfg.backgroundColor};
              display: flex;
              align-items: center;
              justify-content: center;
            }
            body > * {
              width: 100%;
              height: 100%;
            }
            #${cfg.nameOfDiv} {
              width: 100%;
              height: 100%;
              position: relative;
              overflow: hidden;
              background: ${cfg.backgroundColor};
              display: flex;
              align-items: center;
              justify-content: center;
            }
           
          </style>
          <!-- Carga diferida del script y arranque con DOMContentLoaded para no esperar a window.onload -->
          <script src="/js/KeyShotXR.js" defer></script>
          <script defer>
            function initKeyShotXR() {
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

              // Exponer la instancia globalmente para sincronización
              window.keyshotXRInstance = keyshotXR;

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

              // 🔄 SINCRONIZACIÓN: Variables de estado
              var syncEnabled = false;
              var isReceivingSync = false;
              
              // Sobrescribir el método de carga completa
              var originalRaMethod = keyshotXR.Ra;
              keyshotXR.Ra = function() {
                originalRaMethod.call(keyshotXR);
                
                // Obtener el contenedor de KeyShot
                var container = document.getElementById("${cfg.nameOfDiv}");
                if (container) {
                  // Función para enviar eventos de mouse
                  function sendMouseEvent(eventType, e) {
                    if (!syncEnabled || isReceivingSync) return;
                    
                    var rect = container.getBoundingClientRect();
                    var relativeX = (e.clientX - rect.left) / rect.width;
                    var relativeY = (e.clientY - rect.top) / rect.height;
                    
                    window.parent.postMessage({
                      type: "keyshot-pointer-event",
                      eventType: eventType,
                      containerId: "${cfg.nameOfDiv}",
                      relativeX: relativeX,
                      relativeY: relativeY,
                      buttons: e.buttons,
                      button: e.button
                    }, "*");
                  }
                  
                  // Capturar eventos de mouse
                  container.addEventListener("mousedown", function(e) {
                    sendMouseEvent("mousedown", e);
                  });
                  
                  container.addEventListener("mousemove", function(e) {
                    sendMouseEvent("mousemove", e);
                  });
                  
                  container.addEventListener("mouseup", function(e) {
                    sendMouseEvent("mouseup", e);
                  });
                }
                
                // Notificar que la carga está completa
                window.parent.postMessage({
                  type: 'keyshot-loaded',
                  containerId: '${cfg.nameOfDiv}'
                }, '*');
              };

              // Paralelismo y semilla de descargas (ajusta entre 6–12 según CDN)
              keyshotXR.Aa = 8;
              for (var i = 1; i < keyshotXR.Aa; i++) keyshotXR.ga();
              
              // 🔄 SINCRONIZACIÓN: Listener de mensajes para sincronizar con otros visores
              window.addEventListener("message", function(event) {
                var data = event.data;
                
                // Habilitar/deshabilitar sincronización
                if (data.type === "keyshot-sync-enable") {
                  syncEnabled = data.enabled;
                }
                
                // Recibir eventos de mouse sincronizados de otro visor
                if (data.type === "keyshot-pointer-event" && syncEnabled) {
                  // No sincronizar si el mensaje viene de este mismo contenedor
                  if (data.containerId === "${cfg.nameOfDiv}") {
                    return;
                  }
                  
                  var eventType = data.eventType;
                  var relativeX = data.relativeX;
                  var relativeY = data.relativeY;
                  var buttons = data.buttons;
                  var button = data.button;
                  
                  // Marcar que estamos recibiendo sincronización para evitar loop
                  isReceivingSync = true;
                  
                  // Obtener el contenedor principal (viewwindow)
                  var container = document.getElementById("${cfg.nameOfDiv}");
                  if (container) {
                    // Encontrar el viewwindow div (primer hijo del contenedor)
                    var viewwindow = container.querySelector('#viewwindow');
                    if (!viewwindow) return;
                    
                    // El overlay es el segundo div hijo de viewwindow (después de turntable)
                    var turntable = viewwindow.querySelector('#turntable');
                    var overlayDiv = turntable ? turntable.nextElementSibling : null;
                    
                    if (!overlayDiv) return;
                    
                    var rect = overlayDiv.getBoundingClientRect();
                    var absoluteX = rect.left + (relativeX * rect.width);
                    var absoluteY = rect.top + (relativeY * rect.height);
                    
                    // IMPORTANTE: pageX/pageY incluyen el scroll, clientX/Y no
                    var pageX = absoluteX + window.pageXOffset;
                    var pageY = absoluteY + window.pageYOffset;
                    
                    // Crear evento sintético de mouse con todas las propiedades necesarias
                    var mouseEvent = new MouseEvent(eventType, {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                      clientX: absoluteX,
                      clientY: absoluteY,
                      screenX: absoluteX,
                      screenY: absoluteY,
                      buttons: buttons,
                      button: button
                    });
                    
                    // CRÍTICO: KeyShotXR usa pageX/pageY, no clientX/clientY
                    // Como MouseEvent no permite configurar pageX/pageY en el constructor,
                    // los agregamos manualmente
                    Object.defineProperty(mouseEvent, 'pageX', {
                      value: pageX,
                      writable: false
                    });
                    Object.defineProperty(mouseEvent, 'pageY', {
                      value: pageY,
                      writable: false
                    });
                    
                    // CRÍTICO: KeyShotXR escucha mousedown/mousemove en el overlay div
                    // pero mouseup en document. Debemos disparar en el target correcto.
                    var targetElement = eventType === "mouseup" ? document : overlayDiv;
                    
                    // Disparar el evento en el elemento correcto
                    targetElement.dispatchEvent(mouseEvent);
                  }
                  
                  // Liberar el flag después de un breve delay
                  setTimeout(function() {
                    isReceivingSync = false;
                  }, 16); // ~1 frame a 60fps
                }
              });
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
        <body oncontextmenu="return false;" style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; margin:0; padding:0;">
          <div id="${cfg.nameOfDiv}"></div>
        </body>
      </html>
    `;

    const iframeDoc = iframeRef.current!.contentWindow?.document;
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
  }, [normalized, onLoad, onProgress, onError, preloadImages]);

  return (
    <div
      className={className}
      style={
        {
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...style,
        } as React.CSSProperties
      }
    >
      <iframe
        ref={iframeRef}
        title="KeyShot XR Viewer"
        style={
          {
            display: "flex",
            width: "100%",
            height: "100%",
            border: "none",
            backgroundColor: mergedConfig.backgroundColor,
          } as React.CSSProperties
        }
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

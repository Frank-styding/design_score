#!/bin/bash

# Script para actualizar KeyShotXRViewer.tsx con la nueva sincronización

INPUT_FILE="src/components/KeyShotXRViewer.tsx"
OUTPUT_FILE="src/components/KeyShotXRViewer_new.tsx"

# Parte 1: Mantener las líneas 1-369 (antes de los event listeners)
sed -n '1,369p' "$INPUT_FILE" > "$OUTPUT_FILE"

# Parte 2: Agregar los nuevos event listeners
cat >> "$OUTPUT_FILE" << 'EVENTLISTENERS'
                  container.addEventListener("mousedown", function(e) {
                    if (!syncEnabled || isReceivingSync) return;
                    isDragging = true;
                    var rect = container.getBoundingClientRect();
                    var relativeX = (e.clientX - rect.left) / rect.width;
                    var relativeY = (e.clientY - rect.top) / rect.height;
                    lastSentX = relativeX;
                    lastSentY = relativeY;
                    console.log("MOUSEDOWN desde ${cfg.nameOfDiv} - x:", relativeX.toFixed(3), "y:", relativeY.toFixed(3));
                    window.parent.postMessage({
                      type: "keyshot-mouse-down",
                      containerId: "${cfg.nameOfDiv}",
                      relativeX: relativeX,
                      relativeY: relativeY
                    }, "*");
                  });
                  
                  container.addEventListener("mousemove", function(e) {
                    if (!syncEnabled || isReceivingSync || !isDragging) return;
                    var rect = container.getBoundingClientRect();
                    var relativeX = (e.clientX - rect.left) / rect.width;
                    var relativeY = (e.clientY - rect.top) / rect.height;
                    if (Math.abs(relativeX - lastSentX) > 0.005 || Math.abs(relativeY - lastSentY) > 0.005) {
                      lastSentX = relativeX;
                      lastSentY = relativeY;
                      console.log("MOUSEMOVE desde ${cfg.nameOfDiv} - x:", relativeX.toFixed(3), "y:", relativeY.toFixed(3));
                      window.parent.postMessage({
                        type: "keyshot-mouse-move",
                        containerId: "${cfg.nameOfDiv}",
                        relativeX: relativeX,
                        relativeY: relativeY
                      }, "*");
                    }
                  });
                  
                  container.addEventListener("mouseup", function(e) {
                    if (!syncEnabled || isReceivingSync) return;
                    isDragging = false;
                    var rect = container.getBoundingClientRect();
                    var relativeX = (e.clientX - rect.left) / rect.width;
                    var relativeY = (e.clientY - rect.top) / rect.height;
                    console.log("MOUSEUP desde ${cfg.nameOfDiv} - x:", relativeX.toFixed(3), "y:", relativeY.toFixed(3));
                    window.parent.postMessage({
                      type: "keyshot-mouse-up",
                      containerId: "${cfg.nameOfDiv}",
                      relativeX: relativeX,
                      relativeY: relativeY
                    }, "*");
                  });
                  
                  console.log("Sistema de sincronizacion por mouse configurado para:", "${cfg.nameOfDiv}");
EVENTLISTENERS

# Parte 3: Agregar líneas 395 en adelante (después del console.log)
sed -n '395,$p' "$INPUT_FILE" >> "$OUTPUT_FILE"

# Reemplazar el archivo original
mv "$OUTPUT_FILE" "$INPUT_FILE"

echo "Archivo actualizado exitosamente!"

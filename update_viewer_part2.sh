#!/bin/bash

# Script para actualizar la parte del receptor de mensajes en KeyShotXRViewer.tsx

INPUT_FILE="src/components/KeyShotXRViewer.tsx"
OUTPUT_FILE="src/components/KeyShotXRViewer_new.tsx"

# Parte 1: Mantener las líneas 1-443 (antes del handler keyshot-mouse-sync)
sed -n '1,443p' "$INPUT_FILE" > "$OUTPUT_FILE"

# Parte 2: Agregar los nuevos manejadores de eventos
cat >> "$OUTPUT_FILE" << 'RECEIVER'
                
                // Recibir MOUSEDOWN
                if (data.type === "keyshot-mouse-down" && syncEnabled) {
                  if (data.containerId === "${cfg.nameOfDiv}") return;
                  
                  console.log("Recibiendo MOUSEDOWN en ${cfg.nameOfDiv}");
                  
                  isReceivingSync = true;
                  isDragging = true;
                  
                  var container = document.getElementById("${cfg.nameOfDiv}");
                  if (container) {
                    var rect = container.getBoundingClientRect();
                    var absoluteX = rect.left + (data.relativeX * rect.width);
                    var absoluteY = rect.top + (data.relativeY * rect.height);
                    
                    var mouseDownEvent = new MouseEvent('mousedown', {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                      clientX: absoluteX,
                      clientY: absoluteY,
                      pageX: absoluteX + window.pageXOffset,
                      pageY: absoluteY + window.pageYOffset,
                      button: 0,
                      buttons: 1
                    });
                    
                    container.dispatchEvent(mouseDownEvent);
                  }
                  
                  setTimeout(function() { isReceivingSync = false; }, 50);
                }
                
                // Recibir MOUSEMOVE
                if (data.type === "keyshot-mouse-move" && syncEnabled) {
                  if (data.containerId === "${cfg.nameOfDiv}") return;
                  
                  console.log("Recibiendo MOUSEMOVE en ${cfg.nameOfDiv}");
                  
                  isReceivingSync = true;
                  
                  var container = document.getElementById("${cfg.nameOfDiv}");
                  if (container) {
                    var rect = container.getBoundingClientRect();
                    var absoluteX = rect.left + (data.relativeX * rect.width);
                    var absoluteY = rect.top + (data.relativeY * rect.height);
                    
                    var mouseMoveEvent = new MouseEvent('mousemove', {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                      clientX: absoluteX,
                      clientY: absoluteY,
                      pageX: absoluteX + window.pageXOffset,
                      pageY: absoluteY + window.pageYOffset,
                      buttons: 1
                    });
                    
                    container.dispatchEvent(mouseMoveEvent);
                  }
                  
                  setTimeout(function() { isReceivingSync = false; }, 50);
                }
                
                // Recibir MOUSEUP
                if (data.type === "keyshot-mouse-up" && syncEnabled) {
                  if (data.containerId === "${cfg.nameOfDiv}") return;
                  
                  console.log("Recibiendo MOUSEUP en ${cfg.nameOfDiv}");
                  
                  isReceivingSync = true;
                  isDragging = false;
                  
                  var container = document.getElementById("${cfg.nameOfDiv}");
                  if (container) {
                    var rect = container.getBoundingClientRect();
                    var absoluteX = rect.left + (data.relativeX * rect.width);
                    var absoluteY = rect.top + (data.relativeY * rect.height);
                    
                    var mouseUpEvent = new MouseEvent('mouseup', {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                      clientX: absoluteX,
                      clientY: absoluteY,
                      pageX: absoluteX + window.pageXOffset,
                      pageY: absoluteY + window.pageYOffset,
                      button: 0,
                      buttons: 0
                    });
                    
                    container.dispatchEvent(mouseUpEvent);
                  }
                  
                  setTimeout(function() { isReceivingSync = false; }, 50);
                }
RECEIVER

# Parte 3: Agregar líneas 488 en adelante (después del handler antiguo)
sed -n '488,$p' "$INPUT_FILE" >> "$OUTPUT_FILE"

# Reemplazar el archivo original
mv "$OUTPUT_FILE" "$INPUT_FILE"

echo "Receptor de eventos actualizado exitosamente!"

#!/bin/bash

# Script para implementar sincronización por índices directos

INPUT_FILE="src/components/KeyShotXRViewer.tsx.backup"
OUTPUT_FILE="src/components/KeyShotXRViewer.tsx"

# Copiar el backup como base
cp "$INPUT_FILE" "$OUTPUT_FILE"

# Usar sed para reemplazar la sección de variables de estado (líneas ~355-360)
sed -i '355,360s/.*/              var syncEnabled = false;\n              var lastSentU = -1;\n              var lastSentV = -1;\n              var isReceivingSync = false;\n              var syncUpdateTimer = null;/' "$OUTPUT_FILE"

echo "Archivo actualizado - Paso 1 completado"

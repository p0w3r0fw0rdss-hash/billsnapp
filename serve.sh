#!/bin/bash
# Script para servir FacturApp localmente

echo "🚀 Iniciando FacturApp..."
echo ""
echo "Abre tu navegador en: http://localhost:8080"
echo ""
echo "Presiona Ctrl+C para detener el servidor"
echo ""

# Intentar con Python
if command -v python3 &> /dev/null; then
    echo "Usando Python..."
    cd "$(dirname "$0")"
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    echo "Usando Python..."
    cd "$(dirname "$0")"
    python -m SimpleHTTPServer 8080
elif command -v npx &> /dev/null; then
    echo "Usando Node.js..."
    cd "$(dirname "$0")"
    npx http-server -p 8080
else
    echo "Error: No se encontró Python ni Node.js"
    echo "Instala uno de ellos o abre index.html directamente en tu navegador"
    exit 1
fi

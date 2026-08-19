@echo off
title SEFA Nexus
cd /d "%~dp0"
where docker >nul 2>nul
if %errorlevel%==0 (
  echo [SEFA Nexus] Docker encontrado. Iniciando...
  docker compose up --build
) else (
  echo [SEFA Nexus] Docker nao encontrado. Tentando Node.js...
  where node >nul 2>nul
  if not %errorlevel%==0 (
    echo Node.js tambem nao foi encontrado.
    echo Instale Docker Desktop ou Node.js 24.
    pause
    exit /b 1
  )
  if not exist node_modules (
    call npm install
  )
  call npm start
)

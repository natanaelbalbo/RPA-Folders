"""
Configurações centralizadas do sistema RPA.
"""
import os
from pathlib import Path

# Diretório base do backend
BASE_DIR = Path(__file__).resolve().parent

# Banco de dados
DATABASE_URL = f"sqlite:///{BASE_DIR / 'rpa_automation.db'}"

# Google Drive
GOOGLE_DRIVE_CREDENTIALS_PATH = os.getenv(
    "GOOGLE_CREDENTIALS_PATH",
    str(BASE_DIR / "credentials" / "service_account.json")
)
GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "")

# Diretório de uploads/downloads
UPLOADS_DIR = BASE_DIR / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

# Diretório de arquivos processados por tipo
PROCESSED_DIRS = {
    "XML": UPLOADS_DIR / "xml",
    "NF": UPLOADS_DIR / "nf",
    "EXTRATO": UPLOADS_DIR / "extratos",
}
for d in PROCESSED_DIRS.values():
    d.mkdir(exist_ok=True)

# Sistema Web Destino (para automação Playwright)
SISTEMA_WEB_URL = os.getenv("SISTEMA_WEB_URL")
SISTEMA_LOGIN_USER = os.getenv("SISTEMA_LOGIN_USER")
SISTEMA_LOGIN_PASS = os.getenv("SISTEMA_LOGIN_PASS")

# Configurações do servidor
API_HOST = os.getenv("API_HOST")
API_PORT = int(os.getenv("API_PORT"))

# Tipos de arquivo suportados
FILE_TYPES = {
    "XML": {"extensoes": [".xml"], "pasta_destino": "XML"},
    "NF": {"extensoes": [".pdf"], "pasta_destino": "NF"},
    "EXTRATO": {"extensoes": [".ofx", ".pdf"], "pasta_destino": "Extratos"},
}

# Configurações de Fuso Horário (Brasília - UTC-3)
from datetime import datetime, timezone, timedelta
BR_TIMEZONE = timezone(timedelta(hours=-3))

def get_now_br():
    """Retorna o datetime atual no fuso horário de Brasília (UTC-3) como naive."""
    return datetime.now(BR_TIMEZONE).replace(tzinfo=None)

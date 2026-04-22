"""
Serviço de integração com Google Drive API.
Utiliza Service Account para autenticação.
"""
import io
import os
from pathlib import Path
from typing import Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from config import GOOGLE_DRIVE_CREDENTIALS_PATH, GOOGLE_DRIVE_FOLDER_ID, UPLOADS_DIR

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


class GoogleDriveService:
    """Gerencia a conexão e operações com o Google Drive."""

    def __init__(self):
        self.service = None
        self.folder_id = GOOGLE_DRIVE_FOLDER_ID
        self._authenticated = False

    def authenticate(self) -> bool:
        """Autentica com o Google Drive usando Service Account."""
        try:
            creds_path = GOOGLE_DRIVE_CREDENTIALS_PATH
            if not os.path.exists(creds_path):
                raise FileNotFoundError(
                    f"Arquivo de credenciais não encontrado: {creds_path}. "
                    "Coloque o JSON da Service Account em backend/credentials/service_account.json"
                )
            
            credentials = service_account.Credentials.from_service_account_file(
                creds_path, scopes=SCOPES
            )
            self.service = build("drive", "v3", credentials=credentials)
            self._authenticated = True
            return True
        except Exception as e:
            self._authenticated = False
            raise Exception(f"Falha na autenticação com Google Drive: {str(e)}")

    def is_authenticated(self) -> bool:
        """Verifica se o serviço está autenticado."""
        return self._authenticated and self.service is not None

    def list_files(self, folder_id: Optional[str] = None) -> list[dict]:
        """
        Lista todos os arquivos em uma pasta do Drive.
        Retorna lista de dicts com id, name, mimeType.
        """
        if not self.is_authenticated():
            self.authenticate()

        target_folder = folder_id or self.folder_id
        if not target_folder:
            raise ValueError(
                "GOOGLE_DRIVE_FOLDER_ID não configurado. "
                "Defina a variável de ambiente GOOGLE_DRIVE_FOLDER_ID."
            )

        query = f"'{target_folder}' in parents and trashed = false"
        results = self.service.files().list(
            q=query,
            fields="files(id, name, mimeType, size, createdTime)",
            orderBy="createdTime desc"
        ).execute()

        files = results.get("files", [])
        return [
            {
                "id": f["id"],
                "name": f["name"],
                "mime_type": f.get("mimeType", ""),
                "size": f.get("size", "0"),
                "created_time": f.get("createdTime", ""),
            }
            for f in files
        ]

    def download_file(self, file_id: str, file_name: str) -> Path:
        """
        Baixa um arquivo do Drive para o diretório local de uploads.
        Retorna o Path do arquivo baixado.
        """
        if not self.is_authenticated():
            self.authenticate()

        request = self.service.files().get_media(fileId=file_id)
        
        dest_path = UPLOADS_DIR / file_name
        fh = io.FileIO(str(dest_path), "wb")
        downloader = MediaIoBaseDownload(fh, request)

        done = False
        while not done:
            _, done = downloader.next_chunk()

        fh.close()
        return dest_path

    def download_all_from_folder(self, folder_id: Optional[str] = None) -> list[dict]:
        """
        Baixa todos os arquivos de uma pasta do Drive.
        Retorna lista de dicts com informações de cada arquivo baixado.
        """
        files = self.list_files(folder_id)
        downloaded = []

        for file_info in files:
            try:
                local_path = self.download_file(file_info["id"], file_info["name"])
                downloaded.append({
                    **file_info,
                    "local_path": str(local_path),
                    "status": "downloaded"
                })
            except Exception as e:
                downloaded.append({
                    **file_info,
                    "local_path": None,
                    "status": "error",
                    "error": str(e)
                })

        return downloaded



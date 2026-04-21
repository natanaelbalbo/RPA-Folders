"""
Testes para o serviço do Google Drive (Fase 1).
Usa mocks para simular a API do Google Drive sem credenciais reais.
"""
import os
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock, PropertyMock

import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.google_drive import GoogleDriveService


# TESTES – AUTENTICAÇÃO

class TestGoogleDriveAuth:
    """Testes de autenticação com o Google Drive."""

    def test_servico_inicia_nao_autenticado(self):
        """Serviço deve iniciar não autenticado."""
        drive = GoogleDriveService()
        assert drive.is_authenticated() is False
        assert drive.service is None

    def test_autenticacao_sem_credenciais_levanta_erro(self):
        """Sem arquivo de credenciais, authenticate() deve lançar exceção."""
        drive = GoogleDriveService()
        with patch("services.google_drive.GOOGLE_DRIVE_CREDENTIALS_PATH", "/caminho/inexistente/creds.json"):
            with pytest.raises(Exception, match="Falha na autenticação"):
                drive.authenticate()

    @patch("services.google_drive.build")
    @patch("services.google_drive.service_account.Credentials.from_service_account_file")
    @patch("os.path.exists", return_value=True)
    def test_autenticacao_sucesso(self, mock_exists, mock_creds, mock_build):
        """Com credenciais válidas, authenticate() deve retornar True."""
        mock_creds.return_value = MagicMock()
        mock_build.return_value = MagicMock()

        drive = GoogleDriveService()
        result = drive.authenticate()

        assert result is True
        assert drive.is_authenticated() is True
        mock_build.assert_called_once()

    @patch("services.google_drive.build")
    @patch("services.google_drive.service_account.Credentials.from_service_account_file")
    @patch("os.path.exists", return_value=True)
    def test_autenticacao_falha_no_build(self, mock_exists, mock_creds, mock_build):
        """Se o build falhar, deve levantar exceção e manter não autenticado."""
        mock_creds.return_value = MagicMock()
        mock_build.side_effect = Exception("Falha na API")

        drive = GoogleDriveService()
        with pytest.raises(Exception, match="Falha na autenticação"):
            drive.authenticate()
        assert drive.is_authenticated() is False


# TESTES – LISTAGEM DE ARQUIVOS

class TestGoogleDriveList:
    """Testes de listagem de arquivos do Drive."""

    def _make_authenticated_drive(self):
        """Cria um serviço Drive mock autenticado."""
        drive = GoogleDriveService()
        drive._authenticated = True
        drive.service = MagicMock()
        drive.folder_id = "test-folder-id"
        return drive

    def test_list_files_retorna_lista(self):
        """list_files deve retornar uma lista de dicts."""
        drive = self._make_authenticated_drive()
        drive.service.files().list().execute.return_value = {
            "files": [
                {"id": "1", "name": "nfe.xml", "mimeType": "text/xml", "size": "1024", "createdTime": "2026-04-20"},
                {"id": "2", "name": "nota.pdf", "mimeType": "application/pdf", "size": "2048", "createdTime": "2026-04-20"},
            ]
        }

        result = drive.list_files()
        assert len(result) == 2
        assert result[0]["name"] == "nfe.xml"
        assert result[1]["name"] == "nota.pdf"

    def test_list_files_pasta_vazia(self):
        """Se a pasta estiver vazia, deve retornar lista vazia."""
        drive = self._make_authenticated_drive()
        drive.service.files().list().execute.return_value = {"files": []}

        result = drive.list_files()
        assert result == []

    def test_list_files_sem_folder_id(self):
        """Sem FOLDER_ID configurado, deve lançar ValueError."""
        drive = self._make_authenticated_drive()
        drive.folder_id = ""

        with pytest.raises(ValueError, match="GOOGLE_DRIVE_FOLDER_ID"):
            drive.list_files()

    def test_list_files_com_folder_custom(self):
        """Deve aceitar folder_id como parâmetro."""
        drive = self._make_authenticated_drive()
        drive.service.files().list().execute.return_value = {"files": []}

        drive.list_files(folder_id="custom-folder")
        # Verifica que a chamada foi feita (não levantou erro)
        assert True


# TESTES – DOWNLOAD DE ARQUIVOS

class TestGoogleDriveDownload:
    """Testes de download de arquivos do Drive."""

    def _make_authenticated_drive(self):
        drive = GoogleDriveService()
        drive._authenticated = True
        drive.service = MagicMock()
        drive.folder_id = "test-folder-id"
        return drive

    @patch("services.google_drive.MediaIoBaseDownload")
    @patch("services.google_drive.io.FileIO")
    def test_download_file_retorna_path(self, mock_fileio, mock_downloader):
        """download_file deve retornar um Path."""
        drive = self._make_authenticated_drive()
        mock_downloader.return_value.next_chunk.return_value = (None, True)

        result = drive.download_file("file-id-123", "teste.xml")
        assert isinstance(result, Path)
        assert result.name == "teste.xml"

    def test_download_all_com_erro_parcial(self):
        """Se um arquivo falhar, deve registrar erro e continuar com os demais."""
        drive = self._make_authenticated_drive()

        # Mock list_files
        drive.list_files = MagicMock(return_value=[
            {"id": "1", "name": "ok.xml", "mime_type": "text/xml", "size": "100", "created_time": ""},
            {"id": "2", "name": "erro.pdf", "mime_type": "application/pdf", "size": "200", "created_time": ""},
        ])

        # Mock download_file: primeiro OK, segundo falha
        def mock_download(file_id, file_name):
            if file_id == "1":
                return Path("/fake/ok.xml")
            raise Exception("Erro ao baixar")

        drive.download_file = mock_download

        results = drive.download_all_from_folder()
        assert len(results) == 2
        assert results[0]["status"] == "downloaded"
        assert results[1]["status"] == "error"
        assert "Erro ao baixar" in results[1]["error"]

    def test_download_all_pasta_vazia(self):
        """Download de pasta vazia deve retornar lista vazia."""
        drive = self._make_authenticated_drive()
        drive.list_files = MagicMock(return_value=[])

        results = drive.download_all_from_folder()
        assert results == []

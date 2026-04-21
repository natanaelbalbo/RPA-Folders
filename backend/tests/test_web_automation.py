"""
Testes para a automação web com Playwright (Fase 3).
Usa mocks para simular o navegador sem precisar abrir um browser real.
"""
import os
import sys
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.web_automation import WebAutomation


# TESTES – INICIALIZAÇÃO

class TestWebAutomationInit:
    """Testes de inicialização do WebAutomation."""

    def test_inicia_sem_browser(self):
        """Deve iniciar sem browser e sem estar logado."""
        wa = WebAutomation()
        assert wa.browser is None
        assert wa.page is None
        assert wa.logged_in is False


# TESTES – LOGIN

class TestWebAutomationLogin:
    """Testes do fluxo de login no sistema web."""

    @pytest.mark.asyncio
    async def test_login_sucesso(self):
        """Login bem-sucedido deve retornar status 'sucesso'."""
        wa = WebAutomation()
        wa.page = AsyncMock()
        wa.page.goto = AsyncMock()
        wa.page.wait_for_load_state = AsyncMock()
        wa.page.fill = AsyncMock()
        wa.page.click = AsyncMock()
        wa.page.wait_for_url = AsyncMock()

        result = await wa.login()
        assert result["status"] == "sucesso"
        assert wa.logged_in is True

    @pytest.mark.asyncio
    async def test_login_falha_timeout(self):
        """Se wait_for_url falhar (timeout), deve retornar status 'erro'."""
        wa = WebAutomation()
        wa.page = AsyncMock()
        wa.page.goto = AsyncMock()
        wa.page.wait_for_load_state = AsyncMock()
        wa.page.fill = AsyncMock()
        wa.page.click = AsyncMock()
        wa.page.wait_for_url = AsyncMock(side_effect=Exception("Timeout esperando redirecionamento"))

        result = await wa.login()
        assert result["status"] == "erro"
        assert "Falha no login" in result["mensagem"]
        assert wa.logged_in is False

    @pytest.mark.asyncio
    async def test_login_falha_navegacao(self):
        """Se goto falhar, deve retornar erro e não travar."""
        wa = WebAutomation()
        wa.page = AsyncMock()
        wa.page.goto = AsyncMock(side_effect=Exception("ERR_CONNECTION_REFUSED"))

        result = await wa.login()
        assert result["status"] == "erro"
        assert wa.logged_in is False


# TESTES – UPLOAD DE ARQUIVO

class TestWebAutomationUpload:
    """Testes do fluxo de upload de arquivo."""

    @pytest.mark.asyncio
    async def test_upload_xml_sucesso(self):
        """Upload de XML deve navegar para pasta /xml e retornar sucesso."""
        wa = WebAutomation()
        wa.logged_in = True
        wa.page = AsyncMock()

        file_input_mock = AsyncMock()
        wa.page.query_selector = AsyncMock(return_value=file_input_mock)
        wa.page.wait_for_timeout = AsyncMock()

        result = await wa.upload_file("/fake/arquivo.xml", "XML", empresa_id=1)
        assert result["status"] == "sucesso"
        assert "/xml" in result["caminho"]

    @pytest.mark.asyncio
    async def test_upload_nf_sucesso(self):
        """Upload de NF deve navegar para pasta /nf."""
        wa = WebAutomation()
        wa.logged_in = True
        wa.page = AsyncMock()

        file_input_mock = AsyncMock()
        wa.page.query_selector = AsyncMock(return_value=file_input_mock)
        wa.page.wait_for_timeout = AsyncMock()

        result = await wa.upload_file("/fake/nota.pdf", "NF", empresa_id=1)
        assert result["status"] == "sucesso"
        assert "/nf" in result["caminho"]

    @pytest.mark.asyncio
    async def test_upload_extrato_sucesso(self):
        """Upload de EXTRATO deve navegar para pasta /extratos."""
        wa = WebAutomation()
        wa.logged_in = True
        wa.page = AsyncMock()

        file_input_mock = AsyncMock()
        wa.page.query_selector = AsyncMock(return_value=file_input_mock)
        wa.page.wait_for_timeout = AsyncMock()

        result = await wa.upload_file("/fake/extrato.ofx", "EXTRATO", empresa_id=1)
        assert result["status"] == "sucesso"
        assert "/extratos" in result["caminho"]

    @pytest.mark.asyncio
    async def test_upload_sem_campo_file_retorna_erro(self):
        """Se input[type=file] não existir na página, deve retornar erro."""
        wa = WebAutomation()
        wa.logged_in = True
        wa.page = AsyncMock()
        wa.page.query_selector = AsyncMock(return_value=None)

        result = await wa.upload_file("/fake/arquivo.xml", "XML")
        assert result["status"] == "erro"
        assert "upload não encontrado" in result["mensagem"]

    @pytest.mark.asyncio
    async def test_upload_faz_login_automatico_se_nao_logado(self):
        """Se não estiver logado, upload deve tentar fazer login primeiro."""
        wa = WebAutomation()
        wa.logged_in = False
        wa.page = AsyncMock()

        # Mock do login que funciona
        wa.login = AsyncMock(return_value={"status": "sucesso"})
        wa.page.query_selector = AsyncMock(return_value=AsyncMock())
        wa.page.wait_for_timeout = AsyncMock()

        result = await wa.upload_file("/fake/arquivo.xml", "XML")
        wa.login.assert_called_once()
        assert result["status"] == "sucesso"

    @pytest.mark.asyncio
    async def test_upload_falha_se_login_falhar(self):
        """Se o login falhar durante upload, deve retornar erro do login."""
        wa = WebAutomation()
        wa.logged_in = False
        wa.page = AsyncMock()

        wa.login = AsyncMock(return_value={"status": "erro", "mensagem": "Login falhou"})

        result = await wa.upload_file("/fake/arquivo.xml", "XML")
        assert result["status"] == "erro"
        assert result["mensagem"] == "Login falhou"


# TESTES – MAPEAMENTO DE PASTA

class TestWebAutomationPastaMapping:
    """Testes do mapeamento tipo → pasta no sistema destino."""

    @pytest.mark.asyncio
    async def test_tipo_xml_mapeia_para_xml(self):
        """Tipo 'XML' deve navegar para rota /xml."""
        wa = WebAutomation()
        wa.logged_in = True
        wa.page = AsyncMock()
        wa.page.query_selector = AsyncMock(return_value=AsyncMock())
        wa.page.wait_for_timeout = AsyncMock()

        await wa.upload_file("/f.xml", "XML", empresa_id=1)
        call_args = wa.page.goto.call_args[0][0]
        assert "/xml" in call_args

    @pytest.mark.asyncio
    async def test_tipo_nf_mapeia_para_nf(self):
        """Tipo 'NF' deve navegar para rota /nf."""
        wa = WebAutomation()
        wa.logged_in = True
        wa.page = AsyncMock()
        wa.page.query_selector = AsyncMock(return_value=AsyncMock())
        wa.page.wait_for_timeout = AsyncMock()

        await wa.upload_file("/f.pdf", "NF", empresa_id=1)
        call_args = wa.page.goto.call_args[0][0]
        assert "/nf" in call_args

    @pytest.mark.asyncio
    async def test_tipo_extrato_mapeia_para_extratos(self):
        """Tipo 'EXTRATO' deve navegar para rota /extratos."""
        wa = WebAutomation()
        wa.logged_in = True
        wa.page = AsyncMock()
        wa.page.query_selector = AsyncMock(return_value=AsyncMock())
        wa.page.wait_for_timeout = AsyncMock()

        await wa.upload_file("/f.ofx", "EXTRATO", empresa_id=1)
        call_args = wa.page.goto.call_args[0][0]
        assert "/extratos" in call_args


# TESTES – CLOSE

class TestWebAutomationClose:
    """Testes do encerramento do navegador."""

    @pytest.mark.asyncio
    async def test_close_limpa_estado(self):
        """close() deve fechar browser e resetar logged_in."""
        wa = WebAutomation()
        wa.browser = AsyncMock()
        wa.playwright = AsyncMock()
        wa.logged_in = True

        await wa.close()
        assert wa.logged_in is False
        wa.browser.close.assert_called_once()

    @pytest.mark.asyncio
    async def test_close_sem_browser(self):
        """close() sem browser não deve lançar erro."""
        wa = WebAutomation()
        wa.browser = None
        await wa.close()
        assert wa.logged_in is False

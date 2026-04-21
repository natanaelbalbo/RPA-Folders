"""
Automação web com Playwright para upload no sistema destino.
"""
import asyncio
from pathlib import Path
from typing import Optional
from config import SISTEMA_WEB_URL, SISTEMA_LOGIN_USER, SISTEMA_LOGIN_PASS


class WebAutomation:
    """Controla o navegador para login e upload no sistema web."""

    def __init__(self):
        self.browser = None
        self.page = None
        self.logged_in = False

    async def start(self, headless: bool = True):
        """Inicia o navegador Playwright."""
        from playwright.async_api import async_playwright
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=headless)
        self.page = await self.browser.new_page()

    async def login(self) -> dict:
        """Faz login no sistema web destino."""
        try:
            await self.page.goto(f"{SISTEMA_WEB_URL}/sistema/login")
            await self.page.wait_for_load_state("networkidle")

            await self.page.fill('input[name="usuario"]', SISTEMA_LOGIN_USER)
            await self.page.fill('input[name="senha"]', SISTEMA_LOGIN_PASS)
            await self.page.click('button[type="submit"]')

            await self.page.wait_for_url(f"{SISTEMA_WEB_URL}/sistema/empresa/**", timeout=10000)
            self.logged_in = True
            return {"status": "sucesso", "mensagem": "Login realizado com sucesso"}
        except Exception as e:
            self.logged_in = False
            return {"status": "erro", "mensagem": f"Falha no login: {str(e)}"}

    async def upload_file(self, file_path: str | Path, tipo: str, empresa_id: int = 1) -> dict:
        """
        Navega até a pasta correta e faz upload do arquivo.
        tipo: XML, NF ou EXTRATO
        """
        try:
            if not self.logged_in:
                login_result = await self.login()
                if login_result["status"] == "erro":
                    return login_result

            pasta_map = {"XML": "xml", "NF": "nf", "EXTRATO": "extratos"}
            pasta = pasta_map.get(tipo, "xml")

            await self.page.goto(f"{SISTEMA_WEB_URL}/sistema/empresa/{empresa_id}/{pasta}")
            await self.page.wait_for_load_state("networkidle")

            file_input = await self.page.query_selector('input[type="file"]')
            if file_input:
                await file_input.set_input_files(str(file_path))
                await self.page.click('button[data-action="upload"]')
                await self.page.wait_for_timeout(2000)
                return {
                    "status": "sucesso",
                    "mensagem": f"Arquivo enviado para /{pasta}",
                    "caminho": f"/empresa/{empresa_id}/{pasta}",
                }
            else:
                return {"status": "erro", "mensagem": "Campo de upload não encontrado na página"}
        except Exception as e:
            return {"status": "erro", "mensagem": f"Falha no upload: {str(e)}"}

    async def close(self):
        """Fecha o navegador."""
        if self.browser:
            await self.browser.close()
        if hasattr(self, "playwright"):
            await self.playwright.stop()
        self.logged_in = False

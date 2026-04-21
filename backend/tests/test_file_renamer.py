"""
Testes para o serviço de renomeação de arquivos (Fase 2).
Verifica o padrão DATA_EMPRESA_TIPO.extensão e tratamento de duplicatas.
"""
import os
import sys
import tempfile
from datetime import datetime
from pathlib import Path

import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.file_renamer import FileRenamer
from services.file_identifier import FileIdentificationResult


@pytest.fixture
def renamer():
    return FileRenamer()


@pytest.fixture
def tmp_dir():
    with tempfile.TemporaryDirectory() as d:
        yield Path(d)


def _make_result(tipo="XML", cnpj="12.345.678/0001-90", nome="Tech Solutions Ltda", data="2026-04-20"):
    """Helper para criar FileIdentificationResult com valores padrão."""
    r = FileIdentificationResult()
    r.tipo = tipo
    r.empresa_cnpj = cnpj
    r.empresa_nome = nome
    r.data = data
    return r


# TESTES – GERAÇÃO DE NOME

class TestGenerateName:
    """Testes da lógica de geração de nome."""

    def test_formato_padrao_completo(self):
        """Nome deve seguir padrão DATA_EMPRESA_TIPO.extensão."""
        result = _make_result()
        name = FileRenamer.generate_name(result, ".xml")
        assert name == "20260420_TECH_SOLUTIONS_LTDA_NFE.xml"

    def test_tipo_nf_servico(self):
        """Tipo NF deve gerar sufixo NF_SERVICO."""
        result = _make_result(tipo="NF")
        name = FileRenamer.generate_name(result, ".pdf")
        assert "NF_SERVICO" in name
        assert name.endswith(".pdf")

    def test_tipo_extrato(self):
        """Tipo EXTRATO deve gerar sufixo EXTRATO."""
        result = _make_result(tipo="EXTRATO")
        name = FileRenamer.generate_name(result, ".ofx")
        assert "EXTRATO" in name
        assert name.endswith(".ofx")

    def test_tipo_desconhecido(self):
        """Tipo não mapeado deve gerar sufixo DOCUMENTO."""
        result = _make_result(tipo="OUTRO")
        name = FileRenamer.generate_name(result, ".pdf")
        assert "DOCUMENTO" in name

    def test_sem_nome_empresa_usa_cnpj(self):
        """Sem nome de empresa, deve usar os dígitos do CNPJ."""
        result = _make_result(nome=None)
        name = FileRenamer.generate_name(result, ".xml")
        assert "12345678000190" in name

    def test_sem_nome_e_sem_cnpj(self):
        """Sem nome e sem CNPJ deve usar 'DESCONHECIDA'."""
        result = _make_result(nome=None, cnpj=None)
        name = FileRenamer.generate_name(result, ".xml")
        assert "DESCONHECIDA" in name

    def test_sem_data_usa_data_atual(self):
        """Sem data no resultado, deve usar data atual."""
        result = _make_result(data=None)
        name = FileRenamer.generate_name(result, ".xml")
        today = datetime.now().strftime("%Y%m%d")
        assert name.startswith(today)

    def test_sem_data_com_fallback(self):
        """Sem data no resultado com fallback, deve usar o fallback."""
        result = _make_result(data=None)
        name = FileRenamer.generate_name(result, ".xml", fallback_date="20260101")
        assert name.startswith("20260101")

    def test_data_formato_barra(self):
        """Data no formato dd/mm/aaaa deve ser convertida para aaaammdd."""
        result = _make_result(data="20/04/2026")
        name = FileRenamer.generate_name(result, ".xml")
        assert name.startswith("20042026")

    def test_extensao_sem_ponto(self):
        """Extensão passada sem ponto deve ser normalizada."""
        result = _make_result()
        name = FileRenamer.generate_name(result, "xml")
        assert name.endswith(".xml")

    def test_extensao_maiuscula(self):
        """Extensão deve ser normalizada para minúscula."""
        result = _make_result()
        name = FileRenamer.generate_name(result, ".XML")
        assert name.endswith(".xml")


# TESTES – SANITIZAÇÃO DE NOMES

class TestSanitizeName:
    """Testes para a limpeza de nomes de empresa."""

    def test_remove_acentos(self):
        """Deve remover acentos e caracteres especiais."""
        result = FileRenamer._sanitize_name("Café & Cia Ltda")
        assert result == "CAFE_CIA_LTDA"

    def test_converte_para_maiuscula(self):
        """Resultado deve ser todo em maiúsculas."""
        result = FileRenamer._sanitize_name("empresa teste")
        assert result == "EMPRESA_TESTE"

    def test_substitui_espacos_por_underscore(self):
        """Espaços devem virar underscores."""
        result = FileRenamer._sanitize_name("Minha Empresa")
        assert "_" in result
        assert " " not in result

    def test_limita_50_caracteres(self):
        """Nome com mais de 50 caracteres deve ser truncado."""
        nome_longo = "A" * 100
        result = FileRenamer._sanitize_name(nome_longo)
        assert len(result) <= 50

    def test_remove_caracteres_especiais(self):
        """Caracteres como @, #, $ devem ser removidos."""
        result = FileRenamer._sanitize_name("Empresa@#$%")
        assert "@" not in result
        assert "#" not in result
        assert "$" not in result


# TESTES – RENOMEAÇÃO DE ARQUIVO NO DISCO

class TestRenameFile:
    """Testes de renomeação física do arquivo."""

    def test_renomeia_arquivo_no_disco(self, tmp_dir):
        """Deve renomear o arquivo e retornar novo Path."""
        original = tmp_dir / "original.xml"
        original.write_text("conteúdo fake", encoding="utf-8")

        result = _make_result()
        new_path = FileRenamer.rename_file(original, result, tmp_dir)

        assert new_path.exists()
        assert not original.exists()
        assert "TECH_SOLUTIONS" in new_path.name
        assert "NFE" in new_path.name

    def test_renomeia_para_diretorio_destino(self, tmp_dir):
        """Deve mover o arquivo para o diretório de destino."""
        src_dir = tmp_dir / "src"
        src_dir.mkdir()
        dest_dir = tmp_dir / "dest"
        dest_dir.mkdir()

        original = src_dir / "teste.pdf"
        original.write_text("conteúdo", encoding="utf-8")

        result = _make_result(tipo="NF")
        new_path = FileRenamer.rename_file(original, result, dest_dir)

        assert new_path.parent == dest_dir
        assert new_path.exists()

    def test_evita_colisao_de_nomes(self, tmp_dir):
        """Se já existir arquivo com mesmo nome, deve adicionar sufixo _1."""
        result = _make_result()
        name = FileRenamer.generate_name(result, ".xml")

        # Cria arquivo já existente no destino
        existing = tmp_dir / name
        existing.write_text("já existe", encoding="utf-8")

        # Cria o original para renomear
        original = tmp_dir / "novo.xml"
        original.write_text("novo conteúdo", encoding="utf-8")

        new_path = FileRenamer.rename_file(original, result, tmp_dir)
        assert new_path.exists()
        assert "_1" in new_path.stem
        assert existing.exists()  # O arquivo original não foi sobrescrito

    def test_multiplas_colisoes(self, tmp_dir):
        """Deve incrementar sufixo (_1, _2...) até achar nome livre."""
        result = _make_result()
        name = FileRenamer.generate_name(result, ".xml")
        stem = Path(name).stem

        # Cria dois arquivos existentes
        (tmp_dir / name).write_text("v1", encoding="utf-8")
        (tmp_dir / f"{stem}_1.xml").write_text("v2", encoding="utf-8")

        original = tmp_dir / "novo.xml"
        original.write_text("v3", encoding="utf-8")

        new_path = FileRenamer.rename_file(original, result, tmp_dir)
        assert "_2" in new_path.stem

    def test_renomeia_sem_diretorio_destino(self, tmp_dir):
        """Sem dest_dir, o arquivo deve ser renomeado no mesmo diretório."""
        original = tmp_dir / "local.ofx"
        original.write_text("ofx fake", encoding="utf-8")

        result = _make_result(tipo="EXTRATO")
        new_path = FileRenamer.rename_file(original, result)

        assert new_path.parent == tmp_dir
        assert new_path.exists()
        assert "EXTRATO" in new_path.name

"""
Testes para o motor de identificação de arquivos (Fase 2).
Cobre: XML NF-e, PDF (NF de Serviço / Extrato), OFX e cenários de erro.
"""
import os
import sys
import tempfile
from pathlib import Path

import pytest

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.file_identifier import FileIdentifier, FileIdentificationResult, CNPJ_REGEX


# FIXTURES

SAMPLE_DIR = Path(__file__).resolve().parent.parent / "sample_files"


@pytest.fixture
def identifier():
    return FileIdentifier()


@pytest.fixture
def sample_xml():
    return SAMPLE_DIR / "nfe_sample.xml"


@pytest.fixture
def sample_nf_pdf():
    return SAMPLE_DIR / "nota_servico.pdf"


@pytest.fixture
def sample_extrato_pdf():
    return SAMPLE_DIR / "extrato_bancario.pdf"


@pytest.fixture
def sample_ofx():
    return SAMPLE_DIR / "extrato_bancario.ofx"


@pytest.fixture
def tmp_dir():
    with tempfile.TemporaryDirectory() as d:
        yield Path(d)


# TESTES – IDENTIFICAÇÃO DE XML (NF-e)

class TestIdentifyXML:
    """Testes de identificação de arquivos XML NF-e."""

    def test_identifica_tipo_xml(self, identifier, sample_xml):
        """O motor deve identificar um XML como tipo 'XML'."""
        result = identifier.identify(sample_xml)
        assert result.tipo == "XML"

    def test_extrai_cnpj_do_emitente(self, identifier, sample_xml):
        """Deve extrair o CNPJ do emitente (12.345.678/0001-90)."""
        result = identifier.identify(sample_xml)
        assert result.empresa_cnpj is not None
        cnpj_digits = result.empresa_cnpj.replace(".", "").replace("/", "").replace("-", "")
        assert cnpj_digits == "12345678000190"

    def test_extrai_nome_do_emitente(self, identifier, sample_xml):
        """Deve extrair o nome do emitente 'Tech Solutions Ltda'."""
        result = identifier.identify(sample_xml)
        assert result.empresa_nome == "Tech Solutions Ltda"

    def test_extrai_data_emissao(self, identifier, sample_xml):
        """Deve extrair a data de emissão do XML."""
        result = identifier.identify(sample_xml)
        assert result.data is not None
        assert result.data.startswith("2026-04-20")

    def test_confianca_alta_com_cnpj(self, identifier, sample_xml):
        """Quando CNPJ é encontrado, confiança deve ser >= 0.9."""
        result = identifier.identify(sample_xml)
        assert result.confianca >= 0.9

    def test_xml_invalido_retorna_erro(self, identifier, tmp_dir):
        """XML malformado deve retornar erro nos detalhes."""
        xml_ruim = tmp_dir / "malformado.xml"
        xml_ruim.write_text("<nfeProc><NFe>texto sem fechar", encoding="utf-8")
        result = identifier.identify(xml_ruim)
        assert result.tipo == "XML"
        assert "erro" in result.detalhes

    def test_xml_sem_emitente(self, identifier, tmp_dir):
        """XML válido sem bloco <emit> deve ter confiança baixa."""
        xml_vazio = tmp_dir / "sem_emit.xml"
        xml_vazio.write_text('<?xml version="1.0"?><nfeProc><NFe><infNFe><ide></ide></infNFe></NFe></nfeProc>', encoding="utf-8")
        result = identifier.identify(xml_vazio)
        assert result.tipo == "XML"
        assert result.empresa_cnpj is None
        assert result.confianca < 0.5

    def test_xml_com_namespace(self, identifier, sample_xml):
        """O parser deve lidar com namespaces do Portal Fiscal."""
        result = identifier.identify(sample_xml)
        assert result.empresa_cnpj is not None
        assert result.detalhes.get("metodo") == "XML NF-e parsing"


# TESTES – IDENTIFICAÇÃO DE PDF (NF de Serviço)

class TestIdentifyNFPdf:
    """Testes de identificação de PDF - Nota de Serviço."""

    def test_identifica_tipo_nf(self, identifier, sample_nf_pdf):
        """O motor deve classificar o PDF como tipo 'NF'."""
        if not sample_nf_pdf.exists():
            pytest.skip("Arquivo sample nota_servico.pdf não disponível")
        result = identifier.identify(sample_nf_pdf)
        assert result.tipo == "NF"

    def test_extrai_cnpj_do_pdf_nf(self, identifier, sample_nf_pdf):
        """Deve extrair algum CNPJ do conteúdo do PDF NF."""
        if not sample_nf_pdf.exists():
            pytest.skip("Arquivo sample nota_servico.pdf não disponível")
        result = identifier.identify(sample_nf_pdf)
        assert result.empresa_cnpj is not None

    def test_extrai_data_do_pdf_nf(self, identifier, sample_nf_pdf):
        """Deve encontrar pelo menos uma data no PDF NF."""
        if not sample_nf_pdf.exists():
            pytest.skip("Arquivo sample nota_servico.pdf não disponível")
        result = identifier.identify(sample_nf_pdf)
        assert result.data is not None

    def test_confianca_com_cnpj_no_pdf(self, identifier, sample_nf_pdf):
        """Confiança deve ser >= 0.7 quando o CNPJ é encontrado no PDF."""
        if not sample_nf_pdf.exists():
            pytest.skip("Arquivo sample nota_servico.pdf não disponível")
        result = identifier.identify(sample_nf_pdf)
        if result.empresa_cnpj:
            assert result.confianca >= 0.7


# TESTES – IDENTIFICAÇÃO DE PDF (Extrato Bancário)

class TestIdentifyExtratoPdf:
    """Testes de identificação de PDF - Extrato Bancário."""

    def test_identifica_tipo_extrato(self, identifier, sample_extrato_pdf):
        """O motor deve classificar o PDF de extrato como tipo 'EXTRATO'."""
        if not sample_extrato_pdf.exists():
            pytest.skip("Arquivo sample extrato_bancario.pdf não disponível")
        result = identifier.identify(sample_extrato_pdf)
        assert result.tipo == "EXTRATO"

    def test_extrai_cnpj_do_extrato_pdf(self, identifier, sample_extrato_pdf):
        """Deve extrair CNPJ do extrato bancário em PDF."""
        if not sample_extrato_pdf.exists():
            pytest.skip("Arquivo sample extrato_bancario.pdf não disponível")
        result = identifier.identify(sample_extrato_pdf)
        assert result.empresa_cnpj is not None

    def test_keywords_extrato_superam_nf(self, identifier, sample_extrato_pdf):
        """Keywords de extrato devem ter score maior que NF."""
        if not sample_extrato_pdf.exists():
            pytest.skip("Arquivo sample extrato_bancario.pdf não disponível")
        result = identifier.identify(sample_extrato_pdf)
        assert "keywords_match" in result.detalhes
        assert "extrato" in result.detalhes["keywords_match"]


# TESTES – IDENTIFICAÇÃO DE OFX (Extrato Bancário)

class TestIdentifyOFX:
    """Testes de identificação de arquivos OFX."""

    def test_identifica_tipo_extrato(self, identifier, sample_ofx):
        """OFX sempre deve ser classificado como 'EXTRATO'."""
        result = identifier.identify(sample_ofx)
        assert result.tipo == "EXTRATO"

    def test_extrai_cnpj_do_ofx(self, identifier, sample_ofx):
        """Deve extrair o CNPJ do conteúdo OFX (no MEMO)."""
        result = identifier.identify(sample_ofx)
        assert result.empresa_cnpj is not None
        cnpj_digits = result.empresa_cnpj.replace(".", "").replace("/", "").replace("-", "")
        assert cnpj_digits == "12345678000190"

    def test_extrai_banco_do_ofx(self, identifier, sample_ofx):
        """Deve extrair o nome do banco (tag <ORG>)."""
        result = identifier.identify(sample_ofx)
        assert result.detalhes.get("banco") == "Banco do Brasil"

    def test_extrai_nome_do_ofx(self, identifier, sample_ofx):
        """Deve extrair o nome da empresa (tag <NAME>)."""
        result = identifier.identify(sample_ofx)
        assert result.empresa_nome is not None

    def test_extrai_data_do_ofx(self, identifier, sample_ofx):
        """Deve extrair a data de início do extrato (tag <DTSTART>)."""
        result = identifier.identify(sample_ofx)
        assert result.data is not None
        assert result.data == "2026-04-01"

    def test_confianca_alta_ofx(self, identifier, sample_ofx):
        """OFX válido deve ter confiança >= 0.8."""
        result = identifier.identify(sample_ofx)
        assert result.confianca >= 0.8

    def test_ofx_vazio(self, identifier, tmp_dir):
        """OFX sem conteúdo relevante deve ainda ser EXTRATO."""
        ofx_vazio = tmp_dir / "vazio.ofx"
        ofx_vazio.write_text("OFXHEADER:100\n<OFX></OFX>", encoding="utf-8")
        result = identifier.identify(ofx_vazio)
        assert result.tipo == "EXTRATO"

    def test_metodo_identificacao_ofx(self, identifier, sample_ofx):
        """Método de identificação deve ser 'OFX parsing'."""
        result = identifier.identify(sample_ofx)
        assert result.detalhes.get("metodo") == "OFX parsing"


# TESTES – CENÁRIOS DE ERRO E EDGE CASES

class TestIdentifyEdgeCases:
    """Testes de cenários de borda e tratamento de erros."""

    def test_arquivo_inexistente(self, identifier):
        """Deve lançar FileNotFoundError para arquivo inexistente."""
        with pytest.raises(FileNotFoundError):
            identifier.identify("/caminho/que/nao/existe/arquivo.xml")

    def test_extensao_nao_suportada(self, identifier, tmp_dir):
        """Extensão desconhecida deve retornar detalhes com erro."""
        arquivo = tmp_dir / "planilha.xlsx"
        arquivo.write_bytes(b"fake content")
        result = identifier.identify(arquivo)
        assert result.tipo is None
        assert "erro" in result.detalhes
        assert "não suportada" in result.detalhes["erro"]

    def test_extensao_txt_nao_suportada(self, identifier, tmp_dir):
        """Arquivo .txt não é suportado pelo motor."""
        arquivo = tmp_dir / "dados.txt"
        arquivo.write_text("conteúdo qualquer", encoding="utf-8")
        result = identifier.identify(arquivo)
        assert result.tipo is None

    def test_resultado_to_dict(self):
        """FileIdentificationResult.to_dict() deve retornar dict completo."""
        result = FileIdentificationResult()
        result.empresa_nome = "Empresa Teste"
        result.empresa_cnpj = "12.345.678/0001-90"
        result.tipo = "XML"
        result.data = "2026-04-20"
        result.confianca = 0.95

        d = result.to_dict()
        assert d["empresa_nome"] == "Empresa Teste"
        assert d["empresa_cnpj"] == "12.345.678/0001-90"
        assert d["tipo"] == "XML"
        assert d["data"] == "2026-04-20"
        assert d["confianca"] == 0.95
        assert isinstance(d["detalhes"], dict)


# TESTES – REGEX E FORMATAÇÃO DE CNPJ

class TestCNPJUtils:
    """Testes para regex e formatação de CNPJ."""

    def test_regex_cnpj_formatado(self):
        """Regex deve casar com CNPJ no formato XX.XXX.XXX/XXXX-XX."""
        assert CNPJ_REGEX.search("12.345.678/0001-90")

    def test_regex_cnpj_sem_formatacao(self):
        """Regex deve casar com CNPJ sem formatação (14 dígitos)."""
        assert CNPJ_REGEX.search("12345678000190")

    def test_regex_cnpj_parcial(self):
        """Regex deve casar com CNPJ parcialmente formatado."""
        assert CNPJ_REGEX.search("12345678/0001-90")

    def test_format_cnpj_14_digitos(self):
        """Formatar 14 dígitos para padrão XX.XXX.XXX/XXXX-XX."""
        result = FileIdentifier._format_cnpj("12345678000190")
        assert result == "12.345.678/0001-90"

    def test_format_cnpj_ja_formatado(self):
        """CNPJ já formatado deve permanecer formatado."""
        result = FileIdentifier._format_cnpj("12.345.678/0001-90")
        assert result == "12.345.678/0001-90"

    def test_format_cnpj_invalido(self):
        """CNPJ com menos de 14 dígitos retorna input original."""
        result = FileIdentifier._format_cnpj("12345")
        assert result == "12345"

    def test_extract_company_name_proxima_ao_cnpj(self):
        """Deve extrair nome da empresa na linha anterior ao CNPJ."""
        text = "Empresa ABC Ltda\nCNPJ: 12.345.678/0001-90\nOutra coisa"
        result = FileIdentifier._extract_company_name(text, "12.345.678/0001-90")
        assert result == "Empresa ABC Ltda"

    def test_extract_company_name_sem_cnpj_no_texto(self):
        """Quando CNPJ não está no texto, deve retornar None."""
        text = "Texto sem nenhum CNPJ aqui"
        result = FileIdentifier._extract_company_name(text, "99.999.999/9999-99")
        assert result is None

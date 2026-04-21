"""
Motor de identificação de arquivos.
Analisa o conteúdo para descobrir a empresa (CNPJ/Nome) e o tipo do documento.
"""
import re
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional

import pdfplumber


# Regex para CNPJ (com e sem formatação)
CNPJ_REGEX = re.compile(r"\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}")

# Namespaces comuns de NF-e
NFE_NAMESPACES = {
    "nfe": "http://www.portalfiscal.inf.br/nfe",
}


class FileIdentificationResult:
    """Resultado da identificação de um arquivo."""

    def __init__(self):
        self.empresa_nome: Optional[str] = None
        self.empresa_cnpj: Optional[str] = None
        self.tipo: Optional[str] = None  # XML, NF, EXTRATO
        self.data: Optional[str] = None
        self.confianca: float = 0.0
        self.detalhes: dict = {}

    def to_dict(self) -> dict:
        return {
            "empresa_nome": self.empresa_nome,
            "empresa_cnpj": self.empresa_cnpj,
            "tipo": self.tipo,
            "data": self.data,
            "confianca": self.confianca,
            "detalhes": self.detalhes,
        }


class FileIdentifier:
    """Identifica o tipo e a empresa de origem de um arquivo."""

    def identify(self, file_path: str | Path) -> FileIdentificationResult:
        """
        Ponto de entrada principal. Analisa o arquivo e retorna o resultado.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {path}")

        extension = path.suffix.lower()

        if extension == ".xml":
            return self._identify_xml(path)
        elif extension == ".pdf":
            return self._identify_pdf(path)
        elif extension == ".ofx":
            return self._identify_ofx(path)
        else:
            result = FileIdentificationResult()
            result.detalhes["erro"] = f"Extensão não suportada: {extension}"
            return result

    def _identify_xml(self, path: Path) -> FileIdentificationResult:
        """Identifica um arquivo XML (NF-e)."""
        result = FileIdentificationResult()
        result.tipo = "XML"

        try:
            tree = ET.parse(str(path))
            root = tree.getroot()

            # Remove namespace do tag para facilitar busca
            ns = ""
            if root.tag.startswith("{"):
                ns = root.tag.split("}")[0] + "}"

            # Busca dados do emitente
            emit = root.find(f".//{ns}emit")
            if emit is not None:
                cnpj_elem = emit.find(f"{ns}CNPJ")
                nome_elem = emit.find(f"{ns}xNome")
                
                if cnpj_elem is not None and cnpj_elem.text:
                    cnpj_raw = cnpj_elem.text.strip()
                    result.empresa_cnpj = self._format_cnpj(cnpj_raw)
                
                if nome_elem is not None and nome_elem.text:
                    result.empresa_nome = nome_elem.text.strip()

            # Busca data de emissão
            ide = root.find(f".//{ns}ide")
            if ide is not None:
                data_elem = ide.find(f"{ns}dhEmi") or ide.find(f"{ns}dEmi")
                if data_elem is not None and data_elem.text:
                    result.data = data_elem.text[:10]  # YYYY-MM-DD

            result.confianca = 0.95 if result.empresa_cnpj else 0.3
            result.detalhes["metodo"] = "XML NF-e parsing"

        except ET.ParseError as e:
            result.detalhes["erro"] = f"Erro ao parsear XML: {str(e)}"
            result.confianca = 0.0

        return result

    def _identify_pdf(self, path: Path) -> FileIdentificationResult:
        """Identifica um arquivo PDF (Nota de Serviço ou Extrato Bancário)."""
        result = FileIdentificationResult()

        try:
            text = ""
            with pdfplumber.open(str(path)) as pdf:
                for page in pdf.pages[:3]:  # Analisa até 3 páginas
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"

            if not text.strip():
                result.detalhes["erro"] = "PDF sem texto extraível"
                result.confianca = 0.0
                return result

            # Busca CNPJ
            cnpj_matches = CNPJ_REGEX.findall(text)
            if cnpj_matches:
                result.empresa_cnpj = self._format_cnpj(cnpj_matches[0])

            # Classificação do tipo baseada em palavras-chave
            text_lower = text.lower()
            
            extrato_keywords = [
                "extrato", "saldo", "débito", "crédito", "conta corrente",
                "banco", "agência", "movimentação", "transferência"
            ]
            nf_keywords = [
                "nota fiscal", "prestação de serviço", "nfs-e", "nota de serviço",
                "issqn", "imposto sobre serviço", "prestador", "tomador"
            ]

            extrato_score = sum(1 for kw in extrato_keywords if kw in text_lower)
            nf_score = sum(1 for kw in nf_keywords if kw in text_lower)

            if extrato_score > nf_score:
                result.tipo = "EXTRATO"
                result.detalhes["keywords_match"] = f"extrato={extrato_score}, nf={nf_score}"
            else:
                result.tipo = "NF"
                result.detalhes["keywords_match"] = f"nf={nf_score}, extrato={extrato_score}"

            # Busca nome da empresa (linha próxima ao CNPJ)
            if cnpj_matches:
                result.empresa_nome = self._extract_company_name(text, cnpj_matches[0])

            # Busca data
            date_pattern = re.compile(r"\d{2}/\d{2}/\d{4}")
            dates = date_pattern.findall(text)
            if dates:
                result.data = dates[0]

            result.confianca = 0.8 if result.empresa_cnpj else 0.4

        except Exception as e:
            result.detalhes["erro"] = f"Erro ao processar PDF: {str(e)}"
            result.confianca = 0.0

        return result

    def _identify_ofx(self, path: Path) -> FileIdentificationResult:
        """Identifica um arquivo OFX (Extrato Bancário)."""
        result = FileIdentificationResult()
        result.tipo = "EXTRATO"

        try:
            content = path.read_text(encoding="utf-8", errors="ignore")

            # Busca nome da organização financeira
            org_match = re.search(r"<ORG>(.+?)(?:\n|<)", content)
            if org_match:
                result.detalhes["banco"] = org_match.group(1).strip()

            # Busca CNPJ no conteúdo (pode estar em memo ou descrição)
            cnpj_matches = CNPJ_REGEX.findall(content)
            if cnpj_matches:
                result.empresa_cnpj = self._format_cnpj(cnpj_matches[0])

            # Busca nome em tags comuns
            name_match = re.search(r"<NAME>(.+?)(?:\n|<)", content)
            if name_match:
                result.empresa_nome = name_match.group(1).strip()

            # Busca data
            date_match = re.search(r"<DTSTART>(\d{8})", content)
            if date_match:
                d = date_match.group(1)
                result.data = f"{d[:4]}-{d[4:6]}-{d[6:8]}"

            result.confianca = 0.85
            result.detalhes["metodo"] = "OFX parsing"

        except Exception as e:
            result.detalhes["erro"] = f"Erro ao processar OFX: {str(e)}"
            result.confianca = 0.0

        return result

    @staticmethod
    def _format_cnpj(cnpj: str) -> str:
        """Formata CNPJ para o padrão XX.XXX.XXX/XXXX-XX."""
        digits = re.sub(r"\D", "", cnpj)
        if len(digits) == 14:
            return f"{digits[:2]}.{digits[2:5]}.{digits[5:8]}/{digits[8:12]}-{digits[12:]}"
        return cnpj

    @staticmethod
    def _extract_company_name(text: str, cnpj: str) -> Optional[str]:
        """Tenta extrair o nome da empresa próximo ao CNPJ no texto."""
        lines = text.split("\n")
        for i, line in enumerate(lines):
            if cnpj in line or re.sub(r"\D", "", cnpj) in re.sub(r"\D", "", line):
                # Verifica linha anterior e posterior
                if i > 0 and len(lines[i-1].strip()) > 3:
                    candidate = lines[i-1].strip()
                    # Filtra linhas que parecem nomes de empresa
                    if not re.match(r"^\d", candidate) and len(candidate) < 100:
                        return candidate
                if i < len(lines) - 1 and len(lines[i+1].strip()) > 3:
                    candidate = lines[i+1].strip()
                    if not re.match(r"^\d", candidate) and len(candidate) < 100:
                        return candidate
        return None

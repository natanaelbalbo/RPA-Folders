"""
Serviço de renomeação de arquivos conforme padrão definido.
Padrão: DATA_EMPRESA_TIPO.extensão
"""
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Optional
from services.file_identifier import FileIdentificationResult


class FileRenamer:
    """Renomeia arquivos seguindo o padrão definido."""

    @staticmethod
    def generate_name(result: FileIdentificationResult, original_extension: str, fallback_date: Optional[str] = None) -> str:
        """Gera novo nome: DATA_EMPRESA_TIPO.extensão"""
        if result.data:
            date_str = result.data.replace("-", "").replace("/", "")[:8]
        elif fallback_date:
            date_str = fallback_date
        else:
            date_str = datetime.now().strftime("%Y%m%d")

        if result.empresa_nome:
            empresa = FileRenamer._sanitize_name(result.empresa_nome)
        elif result.empresa_cnpj:
            empresa = re.sub(r"\D", "", result.empresa_cnpj)
        else:
            empresa = "DESCONHECIDA"

        tipo_map = {"XML": "NFE", "NF": "NF_SERVICO", "EXTRATO": "EXTRATO"}
        tipo = tipo_map.get(result.tipo, "DOCUMENTO")

        ext = original_extension.lower()
        if not ext.startswith("."):
            ext = f".{ext}"

        return f"{date_str}_{empresa}_{tipo}{ext}"

    @staticmethod
    def rename_file(original_path: str | Path, result: FileIdentificationResult, dest_dir: Optional[str | Path] = None) -> Path:
        """Renomeia o arquivo no disco. Retorna o novo Path."""
        original = Path(original_path)
        new_name = FileRenamer.generate_name(result, original.suffix)
        dest = Path(dest_dir) / new_name if dest_dir else original.parent / new_name

        if dest.exists():
            stem = dest.stem
            counter = 1
            while dest.exists():
                dest = dest.parent / f"{stem}_{counter}{dest.suffix}"
                counter += 1

        original.rename(dest)
        return dest

    @staticmethod
    def _sanitize_name(name: str) -> str:
        """Remove caracteres especiais e normaliza o nome."""
        normalized = unicodedata.normalize("NFKD", name)
        ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
        cleaned = re.sub(r"[^a-zA-Z0-9\s]", "", ascii_text)
        result = re.sub(r"\s+", "_", cleaned.strip()).upper()
        return result[:50] if len(result) > 50 else result

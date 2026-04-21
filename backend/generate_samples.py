"""
Script para gerar arquivos PDF fake para testes.
Gera uma Nota Fiscal de Serviço com dados fictícios.
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from pathlib import Path


def gerar_nota_servico(output_path: str = None):
    """Gera um PDF simulando uma Nota Fiscal de Serviço."""
    if output_path is None:
        output_path = str(Path(__file__).parent / "sample_files" / "nota_servico.pdf")

    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # Cabeçalho
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(width / 2, height - 2 * cm, "NOTA FISCAL DE SERVIÇO ELETRÔNICA - NFS-e")

    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, height - 2.8 * cm, "Prefeitura Municipal de São Paulo")

    # Número da nota
    c.setFont("Helvetica-Bold", 12)
    c.drawString(2 * cm, height - 4 * cm, "NFS-e Nº: 000.001.234")
    c.drawString(12 * cm, height - 4 * cm, "Data: 20/04/2026")

    # Linha separadora
    c.line(2 * cm, height - 4.5 * cm, width - 2 * cm, height - 4.5 * cm)

    # Prestador
    y = height - 5.5 * cm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2 * cm, y, "PRESTADOR DE SERVIÇOS")
    y -= 0.6 * cm
    c.setFont("Helvetica", 10)
    c.drawString(2 * cm, y, "Razão Social: Tech Solutions Ltda")
    y -= 0.5 * cm
    c.drawString(2 * cm, y, "CNPJ: 12.345.678/0001-90")
    y -= 0.5 * cm
    c.drawString(2 * cm, y, "Inscrição Municipal: 1.234.567-8")
    y -= 0.5 * cm
    c.drawString(2 * cm, y, "Endereço: Rua das Inovações, 1000 - Centro - São Paulo/SP")

    # Linha separadora
    y -= 0.8 * cm
    c.line(2 * cm, y, width - 2 * cm, y)

    # Tomador
    y -= 0.8 * cm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2 * cm, y, "TOMADOR DE SERVIÇOS")
    y -= 0.6 * cm
    c.setFont("Helvetica", 10)
    c.drawString(2 * cm, y, "Razão Social: Cliente Exemplo SA")
    y -= 0.5 * cm
    c.drawString(2 * cm, y, "CNPJ: 98.765.432/0001-21")
    y -= 0.5 * cm
    c.drawString(2 * cm, y, "Endereço: Av. Paulista, 500 - Bela Vista - São Paulo/SP")

    # Linha separadora
    y -= 0.8 * cm
    c.line(2 * cm, y, width - 2 * cm, y)

    # Descrição do serviço
    y -= 0.8 * cm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2 * cm, y, "DISCRIMINAÇÃO DOS SERVIÇOS")
    y -= 0.6 * cm
    c.setFont("Helvetica", 10)
    c.drawString(2 * cm, y, "Prestação de serviços de desenvolvimento de software customizado")
    y -= 0.5 * cm
    c.drawString(2 * cm, y, "conforme contrato nº 2026/001.")
    y -= 0.5 * cm
    c.drawString(2 * cm, y, "Período de competência: Abril/2026")

    # Valores
    y -= 1.2 * cm
    c.line(2 * cm, y, width - 2 * cm, y)
    y -= 0.8 * cm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2 * cm, y, "VALORES")
    y -= 0.6 * cm
    c.setFont("Helvetica", 10)
    c.drawString(2 * cm, y, "Valor dos Serviços: R$ 15.000,00")
    y -= 0.5 * cm
    c.drawString(2 * cm, y, "ISSQN (5%): R$ 750,00")
    y -= 0.5 * cm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2 * cm, y, "Valor Líquido: R$ 14.250,00")

    c.save()
    print(f"[OK] Nota de Servico gerada: {output_path}")
    return output_path


def gerar_extrato_pdf(output_path: str = None):
    """Gera um PDF simulando um Extrato Bancário."""
    if output_path is None:
        output_path = str(Path(__file__).parent / "sample_files" / "extrato_bancario.pdf")

    c = canvas.Canvas(output_path, pagesize=A4)
    width, height = A4

    # Cabeçalho
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(width / 2, height - 2 * cm, "EXTRATO DE CONTA CORRENTE")
    c.setFont("Helvetica", 10)
    c.drawCentredString(width / 2, height - 2.7 * cm, "Banco do Brasil S.A.")

    # Dados da conta
    y = height - 4 * cm
    c.setFont("Helvetica-Bold", 10)
    c.drawString(2 * cm, y, "Titular: Tech Solutions Ltda")
    y -= 0.5 * cm
    c.drawString(2 * cm, y, "CNPJ: 12.345.678/0001-90")
    y -= 0.5 * cm
    c.drawString(2 * cm, y, "Agência: 1234-5    Conta Corrente: 12345-6")
    y -= 0.5 * cm
    c.drawString(2 * cm, y, "Período: 01/04/2026 a 20/04/2026")

    # Linha
    y -= 0.8 * cm
    c.line(2 * cm, y, width - 2 * cm, y)

    # Cabeçalho tabela
    y -= 0.7 * cm
    c.setFont("Helvetica-Bold", 9)
    c.drawString(2 * cm, y, "Data")
    c.drawString(5 * cm, y, "Descrição")
    c.drawString(13 * cm, y, "Valor")
    c.drawString(16 * cm, y, "Saldo")

    # Movimentações
    movimentos = [
        ("01/04", "Saldo Anterior", "", "R$ 10.000,00"),
        ("05/04", "Crédito - Pagamento Cliente", "R$ 15.000,00", "R$ 25.000,00"),
        ("08/04", "Débito - Aluguel Escritório", "-R$ 3.500,00", "R$ 21.500,00"),
        ("10/04", "Débito - Folha Pagamento", "-R$ 8.000,00", "R$ 13.500,00"),
        ("12/04", "Crédito - Transferência", "R$ 5.000,00", "R$ 18.500,00"),
        ("15/04", "Débito - Impostos", "-R$ 2.500,00", "R$ 16.000,00"),
        ("18/04", "Crédito - Faturamento", "R$ 8.500,00", "R$ 24.500,00"),
        ("20/04", "Débito - Fornecedores", "-R$ 3.500,00", "R$ 21.000,00"),
    ]

    c.setFont("Helvetica", 9)
    for data, desc, valor, saldo in movimentos:
        y -= 0.5 * cm
        c.drawString(2 * cm, y, data)
        c.drawString(5 * cm, y, desc)
        c.drawString(13 * cm, y, valor)
        c.drawString(16 * cm, y, saldo)

    # Saldo final
    y -= 1 * cm
    c.line(2 * cm, y, width - 2 * cm, y)
    y -= 0.7 * cm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(2 * cm, y, "Saldo Final: R$ 21.000,00")

    c.save()
    print(f"[OK] Extrato bancario PDF gerado: {output_path}")
    return output_path


if __name__ == "__main__":
    gerar_nota_servico()
    gerar_extrato_pdf()

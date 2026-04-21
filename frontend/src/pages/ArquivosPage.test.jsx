import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArquivosPage } from './ArquivosPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import * as apiService from '@/api/apiService';

// Mock do layout
vi.mock('@/components/layout/Header', () => ({
  Header: ({ title, subtitle }) => (
    <div data-testid="mock-header">
      <h1>{title}</h1>
      <h2>{subtitle}</h2>
    </div>
  )
}));

// Mocks do lucide
vi.mock('lucide-react', () => ({
  FileText: () => <div data-testid="file-text" />,
  FileCode: () => <div data-testid="file-code" />,
  FileSpreadsheet: () => <div data-testid="file-spreadsheet" />,
  Search: () => <div data-testid="search" />,
  Filter: () => <div data-testid="filter" />,
  ExternalLink: () => <div data-testid="external-link" />,
  RotateCcw: () => <div data-testid="rotate-ccw" />,
}));

vi.mock('@/api/apiService', () => ({
  getArquivos: vi.fn(),
}));

describe('ArquivosPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiService.getArquivos.mockResolvedValue([
      { id: 1, nome_original: 'arquivo1.xml', nome_processado: '20260420_EMP_NFE.xml', status: 'SUCESSO', tipo: 'XML', empresa_nome: 'Empresa A' },
      { id: 2, nome_original: 'nota2.pdf', nome_processado: '20260420_EMP_NF.pdf', status: 'ERRO', tipo: 'NF', empresa_nome: 'Empresa B' },
      { id: 3, nome_original: 'extrato.ofx', nome_processado: '20260420_EMP_EXT.ofx', status: 'PENDENTE', tipo: 'EXTRATO', empresa_nome: 'Empresa C' }
    ]);
  });

  it('deve renderizar a página e o header', async () => {
    render(
      <BrowserRouter>
        <ArquivosPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    expect(screen.getByText('Arquivos')).toBeInTheDocument();
  });

  it('deve listar todos os arquivos', async () => {
    render(
      <BrowserRouter>
        <ArquivosPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('arquivo1.xml')).toBeInTheDocument();
      expect(screen.getByText('nota2.pdf')).toBeInTheDocument();
      expect(screen.getByText('extrato.ofx')).toBeInTheDocument();
    });
  });

  it('deve filtrar os arquivos usando o campo de busca por nome de arquivo', async () => {
    render(
      <BrowserRouter>
        <ArquivosPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('arquivo1.xml')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nome ou empresa/i);
    fireEvent.change(searchInput, { target: { value: 'nota2' } });

    await waitFor(() => {
      expect(screen.getByText('nota2.pdf')).toBeInTheDocument();
      expect(screen.queryByText('arquivo1.xml')).not.toBeInTheDocument();
      expect(screen.queryByText('extrato.ofx')).not.toBeInTheDocument();
    });
  });

  it('deve atualizar os filtros através das combos e recarregar os dados', async () => {
    render(
      <BrowserRouter>
        <ArquivosPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    // Selecionar tipo XML
    const selects = screen.getAllByRole('combobox');
    const comboTipo = selects[0]; // Primeira é de Tipos

    fireEvent.change(comboTipo, { target: { value: 'XML' } });

    // O useEffect deve ser acionado com params { tipo: 'XML' }
    await waitFor(() => {
      expect(apiService.getArquivos).toHaveBeenCalledWith(expect.objectContaining({
        tipo: 'XML'
      }));
    });
  });
});

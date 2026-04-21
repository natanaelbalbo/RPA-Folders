import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SistemaPage } from './SistemaPage';
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
  FolderOpen: () => <div data-testid="folder-open" />,
  Upload: () => <div data-testid="upload" />,
  FileText: () => <div data-testid="file-text" />,
  FileCode: () => <div data-testid="file-code" />,
  FileSpreadsheet: () => <div data-testid="file-spreadsheet" />,
  ArrowLeft: () => <div data-testid="arrow-left" />,
  Building2: () => <div data-testid="building" />,
  CheckCircle2: () => <div data-testid="check-circle" />,
  AlertCircle: () => <div data-testid="alert-circle" />,
  Folder: () => <div data-testid="folder" />,
}));

vi.mock('@/api/apiService', () => ({
  getEmpresas: vi.fn(),
  getEmpresa: vi.fn(),
  uploadArquivo: vi.fn(),
}));

describe('SistemaPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    apiService.getEmpresas.mockResolvedValue([
      { id: 1, nome: 'Empresa A', cnpj: '11.111.111/0001-11', total_arquivos: 2 }
    ]);
    
    apiService.getEmpresa.mockResolvedValue({
      id: 1, nome: 'Empresa A', cnpj: '11.111.111/0001-11',
      arquivos: {
        xml: [{ id: 10, nome_original: 'arquivo1.xml' }],
        nf: [],
        extratos: []
      }
    });
  });

  it('deve listar as empresas na tela inicial', async () => {
    render(
      <BrowserRouter>
        <SistemaPage onMenuClick={() => {}} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Empresa A')).toBeInTheDocument();
      expect(screen.getByText('11.111.111/0001-11')).toBeInTheDocument();
    });
  });

  it('deve mostrar mensagem quando não houver empresas', async () => {
    apiService.getEmpresas.mockResolvedValue([]);
    
    render(
      <BrowserRouter>
        <SistemaPage onMenuClick={() => {}} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nenhuma empresa encontrada')).toBeInTheDocument();
    });
  });

  it('deve navegar para as pastas ao clicar em uma empresa', async () => {
    render(
      <BrowserRouter>
        <SistemaPage onMenuClick={() => {}} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Empresa A')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Empresa A'));

    await waitFor(() => {
      expect(screen.getByText('XML (NF-e)')).toBeInTheDocument();
      expect(screen.getByText('Notas Fiscais')).toBeInTheDocument();
      expect(screen.getByText('Extratos')).toBeInTheDocument();
      expect(screen.getByText('Voltar')).toBeInTheDocument();
    });
  });

  it('deve navegar para o conteúdo de uma pasta e permitir upload', async () => {
    render(
      <BrowserRouter>
        <SistemaPage onMenuClick={() => {}} />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByText('Empresa A'));
    fireEvent.click(screen.getByText('Empresa A'));

    await waitFor(() => screen.getByText('XML (NF-e)'));
    fireEvent.click(screen.getByText('XML (NF-e)'));

    await waitFor(() => {
      expect(screen.getByText('Upload de arquivo')).toBeInTheDocument();
      expect(screen.getByText('arquivo1.xml')).toBeInTheDocument();
    });
  });

  it('deve simular o fluxo de upload de arquivo', async () => {
    apiService.uploadArquivo.mockResolvedValue({ status: 'sucesso' });

    render(
      <BrowserRouter>
        <SistemaPage onMenuClick={() => {}} />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByText('Empresa A'));
    fireEvent.click(screen.getByText('Empresa A'));

    await waitFor(() => screen.getByText('XML (NF-e)'));
    fireEvent.click(screen.getByText('XML (NF-e)'));

    await waitFor(() => screen.getByText('Upload de arquivo'));

    // Criando um arquivo File falso
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    
    // O input não tem aria-label ou role claro a não ser que busquemos pelo tipo
    const uploader = document.querySelector('input[type="file"]');
    
    // Simula mudança de arquivo
    fireEvent.change(uploader, { target: { files: [file] } });

    await waitFor(() => {
      expect(apiService.uploadArquivo).toHaveBeenCalledWith(1, "XML", file);
      expect(screen.getByText(/"hello.png" enviado com sucesso!/i)).toBeInTheDocument();
    });
  });
});

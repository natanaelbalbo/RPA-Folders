import { render, screen, waitFor } from '@testing-library/react';
import { DashboardPage } from './DashboardPage';
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

// Mock dos icones do lucide-react
vi.mock('lucide-react', () => ({
  TrendingUp: () => <div data-testid="trending-up" />,
  CheckCircle2: () => <div data-testid="check-circle" />,
  XCircle: () => <div data-testid="x-circle" />,
  Clock: () => <div data-testid="clock" />,
  ArrowRight: () => <div data-testid="arrow-right" />,
  ExternalLink: () => <div data-testid="external-link" />,
  RefreshCcw: () => <div data-testid="refresh" />,
  FileText: () => <div data-testid="file-text" />,
  Building2: () => <div data-testid="building" />,
}));

// Mock da API
vi.mock('@/api/apiService', () => ({
  getStatus: vi.fn(),
  getArquivos: vi.fn(),
  getEmpresas: vi.fn(),
  getHistorico: vi.fn(),
  processarDrive: vi.fn(),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock values by default
    apiService.getStatus.mockResolvedValue({
      system: { status: 'online' },
      stats: { total: 10, sucesso: 8, erro: 1, pendente: 1 }
    });
    apiService.getArquivos.mockResolvedValue([
      { id: 1, nome_original: 'arquivo1.xml', status: 'SUCESSO', tipo: 'XML', empresa_nome: 'Empresa A', created_at: '2026-04-20T10:00:00Z' }
    ]);
    apiService.getEmpresas.mockResolvedValue([
      { id: 1, nome: 'Empresa A', cnpj: '11.111.111/0001-11', total_arquivos: 5 }
    ]);
    apiService.getHistorico.mockResolvedValue([
      { id: 1, acao: 'Processamento', status: 'SUCESSO', detalhes: 'Log de teste', timestamp: '2026-04-20T10:05:00Z' }
    ]);
  });

  it('deve renderizar o header com título correto', async () => {
    render(
      <BrowserRouter>
        <DashboardPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Monitoramento em tempo real')).toBeInTheDocument();
  });

  it('deve carregar e exibir as estatísticas', async () => {
    render(
      <BrowserRouter>
        <DashboardPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    await waitFor(() => {
      // O '10' do total e '8' de sucesso, '1' erro e '1' pendente devem aparecer na tela.
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();
      // Como tem '1' de erro e '1' de pendente, podemos usar getByText mas precisa cuidado se tiver muitos '1'
      const elementosErroOuPendente = screen.getAllByText('1');
      expect(elementosErroOuPendente.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('deve listar arquivos processados na tabela', async () => {
    render(
      <BrowserRouter>
        <DashboardPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/arquivo1\.xml/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText('Empresa A').length).toBeGreaterThan(0);
    });
  });

  it('deve exibir mensagem de nenhum arquivo quando vazio', async () => {
    apiService.getArquivos.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <DashboardPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Nenhum arquivo processado no período selecionado/i)).toBeInTheDocument();
    });
  });

  it('deve exibir Sistema Online quando a API responde com sucesso', async () => {
    render(
      <BrowserRouter>
        <DashboardPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sistema Online')).toBeInTheDocument();
    });
  });

  it('deve exibir Sistema Offline quando a API falha', async () => {
    apiService.getStatus.mockRejectedValue(new Error('API error'));

    render(
      <BrowserRouter>
        <DashboardPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Sistema Offline')).toBeInTheDocument();
    });
  });
});

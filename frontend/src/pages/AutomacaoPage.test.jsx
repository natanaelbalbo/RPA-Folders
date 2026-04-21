import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AutomacaoPage } from './AutomacaoPage';
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
  Play: () => <div data-testid="play" />,
  RotateCcw: () => <div data-testid="rotate-ccw" />,
  CheckCircle2: () => <div data-testid="check-circle" />,
  XCircle: () => <div data-testid="x-circle" />,
  Clock: () => <div data-testid="clock" />,
  Loader2: () => <div data-testid="loader2" />,
  ChevronRight: () => <div data-testid="chevron" />,
  ShieldCheck: () => <div data-testid="shield" />,
  Globe: () => <div data-testid="globe" />,
  FileSearch: () => <div data-testid="file-search" />,
  ArrowRight: () => <div data-testid="arrow-right" />,
  Database: () => <div data-testid="database" />,
  ExternalLink: () => <div data-testid="external" />,
  Bot: () => <div data-testid="bot" />,
}));

vi.mock('@/api/apiService', () => ({
  processarDrive: vi.fn(),
}));

describe('AutomacaoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar a página inicial corretamente com botão iniciar', () => {
    render(
      <BrowserRouter>
        <AutomacaoPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    expect(screen.getByText('Automação')).toBeInTheDocument();
    expect(screen.getByText('Iniciar Robô')).toBeInTheDocument();
    expect(screen.getByText('Status da Operação')).toBeInTheDocument();
    expect(screen.getByText('Aguardando Comando')).toBeInTheDocument();
  });

  it('deve simular execução com sucesso ao clicar em iniciar', async () => {
    apiService.processarDrive.mockResolvedValue({
      mensagem: "Processamento concluído",
      resultados: [
        { arquivo: "teste.xml", status: "sucesso" }
      ]
    });

    render(
      <BrowserRouter>
        <AutomacaoPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    const button = screen.getByText('Iniciar Robô');
    fireEvent.click(button);

    // O status muda para executando
    expect(screen.getByText('Executando...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Execução Concluída')).toBeInTheDocument();
      expect(screen.getByText(/1 arquivos processados com sucesso/i)).toBeInTheDocument();
    }, { timeout: 6000 });
  });

  it('deve tratar erros ao processar o drive', async () => {
    apiService.processarDrive.mockRejectedValue({
      response: { data: { detail: "Erro interno da API" } }
    });

    render(
      <BrowserRouter>
        <AutomacaoPage onMenuClick={() => { }} />
      </BrowserRouter>
    );

    const button = screen.getByText('Iniciar Robô');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Falha na Automação')).toBeInTheDocument();
      expect(screen.getByText('Erro interno da API')).toBeInTheDocument();
    }, { timeout: 6000 });
  });
});

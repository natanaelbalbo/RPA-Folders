import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginPage } from './LoginPage';
import { useAuth } from '@/context/AuthContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';

// Mock do useAuth
vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock do lucide-react para evitar erros de renderização em alguns ambientes
vi.mock('lucide-react', () => ({
  Bot: () => <div data-testid="bot-icon" />,
  LogIn: () => <div data-testid="login-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eyeoff-icon" />,
  ShieldCheck: () => <div data-testid="shield-icon" />,
}));

describe('LoginPage', () => {
  const mockLogin = vi.fn();
  const mockSetError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useAuth.mockReturnValue({
      login: mockLogin,
      loading: false,
      error: '',
      setError: mockSetError,
    });
  });

  it('deve renderizar os campos de login corretamente', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Usuário/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Senha/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
  });

  it('deve chamar a função de login ao submeter o formulário', async () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const usuarioInput = screen.getByLabelText(/Usuário/i);
    const senhaInput = screen.getByLabelText(/Senha/i);
    const submitButton = screen.getByRole('button', { name: /Entrar/i });

    fireEvent.change(usuarioInput, { target: { value: 'admin' } });
    fireEvent.change(senhaInput, { target: { value: 'admin123' } });
    fireEvent.click(submitButton);

    expect(mockLogin).toHaveBeenCalledWith('admin', 'admin123');
  });

  it('deve exibir mensagem de erro quando houver erro no contexto', () => {
    useAuth.mockReturnValue({
      login: mockLogin,
      loading: false,
      error: 'Credenciais inválidas',
      setError: mockSetError,
    });

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Credenciais inválidas/i)).toBeInTheDocument();
  });

  it('deve alternar a visibilidade da senha ao clicar no ícone de olho', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const senhaInput = screen.getByLabelText(/Senha/i);
    const toggleButton = screen.getByRole('button', { name: '' }); // O botão do olho não tem texto, mas tem o ícone

    expect(senhaInput.type).toBe('password');
    
    fireEvent.click(toggleButton);
    expect(senhaInput.type).toBe('text');
    
    fireEvent.click(toggleButton);
    expect(senhaInput.type).toBe('password');
  });
});

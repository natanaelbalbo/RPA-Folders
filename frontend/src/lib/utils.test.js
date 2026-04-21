import { describe, it, expect } from 'vitest';
import { formatDate, formatCNPJ, getFileUrl } from './utils';

describe('utils.js', () => {
  describe('formatDate', () => {
    it('deve retornar "—" quando a data for nula ou indefinida', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
      expect(formatDate('')).toBe('—');
    });

    it('deve formatar uma string ISO de data corretamente', () => {
      // Usando data UTC para evitar problemas de fuso horário nos testes
      const dataIso = '2026-04-20T10:00:00Z';
      const d = new Date(dataIso);
      const expected = d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      expect(formatDate(dataIso)).toBe(expected);
    });
  });

  describe('formatCNPJ', () => {
    it('deve retornar "—" quando o CNPJ for nulo ou vazio', () => {
      expect(formatCNPJ(null)).toBe('—');
      expect(formatCNPJ('')).toBe('—');
    });

    it('deve formatar uma string de 14 digitos para o padrão CNPJ', () => {
      expect(formatCNPJ('12345678000190')).toBe('12.345.678/0001-90');
    });

    it('deve formatar uma string que já contenha formatação mas esteja correta', () => {
      // Se mandar formatado, ele vai limpar e reformatar
      expect(formatCNPJ('12.345.678/0001-90')).toBe('12.345.678/0001-90');
    });

    it('deve retornar a string original se não tiver 14 dígitos', () => {
      expect(formatCNPJ('12345')).toBe('12345');
      expect(formatCNPJ('123456780001901')).toBe('123456780001901');
    });
  });

  describe('getFileUrl', () => {
    it('deve retornar null se o caminho for nulo ou vazio', () => {
      expect(getFileUrl(null)).toBe(null);
      expect(getFileUrl('')).toBe(null);
    });

    it('deve retornar null se não encontrar "uploads" no caminho', () => {
      expect(getFileUrl('C:\\meu\\caminho\\arquivo.pdf')).toBe(null);
    });

    it('deve converter corretamente caminhos locais do windows', () => {
      const caminho = 'C:\\Users\\backend\\uploads\\nf\\arquivo.pdf';
      const expected = 'http://localhost:8000/uploads/nf/arquivo.pdf';
      expect(getFileUrl(caminho)).toBe(expected);
    });

    it('deve converter corretamente caminhos do linux/mac', () => {
      const caminho = '/var/www/backend/uploads/xml/nfe.xml';
      const expected = 'http://localhost:8000/uploads/xml/nfe.xml';
      expect(getFileUrl(caminho)).toBe(expected);
    });
  });
});

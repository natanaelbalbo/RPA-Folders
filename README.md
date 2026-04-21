# Projeto RPA - Sistema de Automacao e Identificacao de Arquivos

Este projeto e uma solucao completa de Automacao de Processos Roboticos (RPA) desenvolvida para resolver o desafio de captura, classificacao, processamento e monitoramento de documentos extraidos do Google Drive. O projeto esta estruturado em um backend (Python/FastAPI) responsavel pela logica de automacao e um frontend web (React/Vitest) que funciona tanto como destino para o upload quanto como painel de monitoramento.

## Requisitos do Desafio (Fases do Projeto)

O projeto foi totalmente arquitetado para cumprir as 4 fases exigidas:

### Fase 1: Entrada de Dados (Google Drive)
O robo e capaz de acessar uma pasta no Google Drive de forma programatica utilizando a API oficial (via service account).
O sistema gerencia e baixa 3 tipos de arquivos de entrada (arquivos simulados fornecidos em `backend/sample_files/`):
- XML de NF-e
- PDF de Nota de Servico
- Extrato Bancario (PDF ou OFX)

### Fase 2: Motor de Identificacao
Apos o download, o motor do robo abre cada arquivo e aplica lógicas de identificacao para descobrir:
- Quem e a empresa (lendo e formatando o CNPJ e extraindo a Razao Social do documento).
- Que tipo de arquivo e (usando regex e pesos por palavras-chave para diferenciar XML de NF-e, Notas Fiscais em PDF ou Extratos).
Em seguida, o robo renomeia o arquivo seguindo rigorosamente o padrao exigido: `DATA_EMPRESA_TIPO.extensao` (Ex: `20260420_TECHSOLUTIONS_NFE.xml`).

### Fase 3: O Sistema Destino
Foi criado um sistema web para atuacao do robo.
O sistema possui a "Empresa Exemplo" cadastrada no banco de dados com 3 pastas internas logicas: `/XML`, `/NF` e `/Extratos`.
O robo utiliza a biblioteca Playwright para abrir o navegador de forma autonoma (headless), realizar o login com as credenciais cadastradas, navegar ate a pasta correta da empresa alvo baseando-se no tipo do documento, e realizar o upload do arquivo devidamente renomeado.

### Fase 4: Dashboard de Monitoramento
O sistema web fornece uma experiencia de UI/UX sofisticada onde o usuario consegue visualizar e gerenciar o processamento atraves de um Dashboard completo. Funcionalidades incluidas:
- Lista em tempo real de arquivos processados.
- Lista interativa de empresas cadastradas e seus documentos associados.
- Filtro de busca inteligente que permite buscar por Data/Hora (Hoje, 7 dias, Ultimo Mes) e Status/Tipo.
- Painel de status em tempo real do sistema (Online).
- Historico detalhado dos processamentos (logs das acoes da automacao).
- Indicadores visuais claros de Status (Sucesso ou Erro) e navegacao para visualizar onde o arquivo foi armazenado.
- Botao de recuperacao para acionar o reprocessamento imediato de arquivos que cairem no status de Erro.

## Como Executar

### Backend (Python/FastAPI)
1. Navegue ate a pasta do backend: `cd backend`
2. Crie e ative o ambiente virtual:
   - Windows: `python -m venv venv` seguido de `.\venv\Scripts\activate`
3. Instale as dependencias: `pip install -r requirements.txt`
4. Execute o servidor: `python app.py` (A API iniciara em `http://localhost:8000`)

### Frontend (React)
1. Navegue ate a pasta do frontend: `cd frontend`
2. Instale as dependencias: `npm install`
3. Execute o ambiente de desenvolvimento: `npm run dev`

### Testes Automatizados
O projeto conta com mais de 80 testes unitarios e de integracao cobrindo ambas as camadas (frontend e backend), com pipeline de CI configurada via GitHub Actions.
- Para testar o backend: No diretorio `/backend`, com o ambiente ativado, execute `pytest -v`
- Para testar o frontend: No diretorio `/frontend`, execute `npm run test`

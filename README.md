# Projeto RPA - Sistema de Automacão e Identificação de Arquivos

Sistema de automação RPA que integra captura de arquivos do Google Drive, inteligência de identificação, interação com sistema web e dashboard de monitoramento.

## Requisitos do Desafio (Fases do Projeto)

O projeto foi totalmente arquitetado para cumprir as 4 fases exigidas:

### Fase 1: Entrada de Dados (Google Drive)
O robô é capaz de acessar uma pasta no Google Drive de forma programática utilizando a API oficial (via service account).
O sistema gerencia e baixa 3 tipos de arquivos de entrada (arquivos simulados fornecidos em `backend/sample_files/`):
- XML de NF-e
- PDF de Nota de Serviço
- Extrato Bancário (PDF ou OFX)

### Fase 2: Motor de Identificação
Após o download, o motor do robô abre cada arquivo e aplica lógicas de identificação para descobrir:
- Quem é a empresa? (Lendo o CNPJ ou Nome dentro do documento).
- Que tipo de arquivo é? (Diferenciando se é XML, NF ou Extrato utilizando extração de texto, regex e palavras-chave).

Em seguida, o arquivo é renomeado seguindo o padrão exigido: `DATA_EMPRESA_TIPO.extensão`.

### Fase 3: O Sistema Destino
Foi criado um sistema web para atuação do robô. O sistema possui a "Empresa Exemplo" cadastrada no banco de dados com 3 pastas internas lógicas: `/XML`, `/NF` e `/Extratos`.

O robô utiliza a biblioteca Playwright para abrir o navegador de forma autônoma (headless), realizar o login com as credenciais, navegar até a pasta correta de acordo com a identificação e realizar o "upload" do arquivo renomeado.

### Fase 4: Dashboard de Monitoramento
O sistema web fornece uma experiência de UI/UX completa onde o usuário consegue ver:
- Lista de arquivos processados.
- Lista interativa com as empresas.
- Filtro de busca por Data/Hora do processamento (Ontem, Hoje e há 7 dias) e por tipo/status.
- Status do Sistema em tempo real (Online ou Não).
- Histórico detalhado dos processamentos.
- Status (Sucesso ou Erro) com indicadores visuais.
- Link ou indicação de onde o arquivo foi salvo.
- Caso ocorra erro, acionamento do reprocessamento dos arquivos com um clique.

## Visão Geral do Fluxo

```
Google Drive ➔ Motor Python ➔ Sistema Web ➔ Dashboard
```

1. O robô acessa o Google Drive via API e baixa os arquivos (XML, PDF, OFX)
2. O motor de identificação analisa cada arquivo para descobrir a empresa (CNPJ/Nome) e o tipo
3. O arquivo é renomeado seguindo o padrão `DATA_EMPRESA_TIPO.extensão`
4. Via Playwright, o robô faz login no sistema web e faz upload na pasta correta
5. O dashboard exibe o status de tudo em tempo real

## Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Backend API | Python + FastAPI |
| Automação Web | Playwright |
| Google Drive | google-api-python-client |
| Banco de Dados | SQLite + SQLAlchemy |
| Frontend | React (Vite) + Tailwind CSS + shadcn/ui |
| Testes Automatizados | Pytest (Backend) + Vitest (Frontend) |
| Leitura de PDF | pdfplumber |
| Leitura de XML | xml.etree.ElementTree |

## Como Executar

### Pré-requisitos
- Python 3.10+
- Node.js 18+
- npm

### 1. Backend (Python/FastAPI)

```bash
cd backend

# Criar e ativar ambiente virtual
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Instalar dependências
pip install -r requirements.txt

# Instalar Playwright browsers
playwright install chromium

# Gerar arquivos de exemplo (PDFs)
python generate_samples.py

# Iniciar o servidor
python app.py
# ou: uvicorn app:app --reload --port 8000
```
O backend estará disponível em `http://localhost:8000`.

### 2. Frontend (React)

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar dev server
npm run dev
```
O frontend estará disponível em `http://localhost:5173`.

### 3. Automação de Testes

O projeto conta com testes unitários e de integração (frontend e backend), com pipeline de CI configurada via GitHub Actions no arquivo `.github/workflows/ci.yml`.
- Para testar o backend: No diretório `/backend`, com o ambiente ativado, execute `pytest -v`
- Para testar o frontend: No diretório `/frontend`, execute `npm run test`

### 4. Configuração do Google Drive

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto (ou use um existente)
3. Ative a **Google Drive API**
4. Crie uma **Service Account** em "Credenciais"
5. Baixe o JSON da Service Account
6. Coloque o arquivo em `backend/credentials/service_account.json`
7. No Google Drive, compartilhe a pasta desejada com o e-mail da Service Account
8. Defina a variável de ambiente:
   ```bash
   set GOOGLE_DRIVE_FOLDER_ID=seu_folder_id_aqui
   ```

## Estrutura do Projeto

```
RPA Teste/
├── backend/
│   ├── app.py                    # API FastAPI principal e orquestrador
│   ├── config.py                 # Configurações globais
│   ├── database.py               # Modelos de banco SQLite
│   ├── generate_samples.py       # Gerador de PDFs falsos para teste
│   ├── requirements.txt          # Dependências Python
│   ├── credentials/              # Credenciais Google (gitignored)
│   ├── sample_files/             # Arquivos de exemplo (XML, OFX, PDFs)
│   ├── services/
│   │   ├── google_drive.py       # Integração com Google Drive API
│   │   ├── file_identifier.py    # Motor inteligente de identificação
│   │   ├── file_renamer.py       # Lógica de renomeação de arquivos
│   │   └── web_automation.py     # Automação de UI usando Playwright
│   ├── tests/                    # Suíte de testes em Pytest
│   └── uploads/                  # Arquivos processados no upload simulado
│
├── frontend/
│   ├── src/
│   │   ├── api/apiService.js     # Chamadas à API do backend
│   │   ├── components/           # Componentes UI reutilizáveis
│   │   ├── lib/utils.js          # Utilitários (formatações)
│   │   └── pages/                # Páginas da aplicação React
│   │       ├── DashboardPage.jsx # Monitoramento e Status
│   │       ├── SistemaPage.jsx   # Gestão de Empresas e Uploads
│   │       ├── ArquivosPage.jsx  # Tabela com filtros
│   │       └── AutomacaoPage.jsx # Visualização da ação do robô
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml                # Integração Contínua (Testes automatizados)
│
├── .gitignore
└── README.md
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/status` | Traz status do sistema e contadores globais |
| GET | `/api/empresas` | Listar todas as empresas cadastradas |
| GET | `/api/empresas/{id}` | Detalhes de uma empresa específica |
| GET | `/api/arquivos` | Listar arquivos (suporta filtros na URL) |
| POST | `/api/processar` | Iniciar ciclo de processamento do Drive |
| POST | `/api/reprocessar/{id}` | Reprocessar arquivo que está com erro |
| POST | `/api/auth/login` | Login global no sistema |
| POST | `/api/upload/{empresa_id}/{tipo}` | Realiza upload de arquivo destino |
| GET | `/api/historico` | Histórico global de log do processamento |

**Filtros disponíveis em `/api/arquivos`:**
- `?status=SUCESSO\|ERRO\|PENDENTE\|PROCESSANDO`
- `?tipo=XML\|NF\|EXTRATO`
- `?periodo=hoje\|ontem\|7dias`

## Motor de Identificação

O motor analisa cada arquivo baixado e realiza a classificação inteligente:

| Tipo | Método de Identificação |
|------|------------------------|
| **XML (NF-e)** | Parse de XML estruturado, buscando tags `<emit><CNPJ>` e `<emit><xNome>` |
| **PDF (NF Serviço)** | Extração de texto usando `pdfplumber`, regex de CNPJ e ponderação matemática por palavras-chave |
| **OFX (Extrato)** | Parse do formato bancário OFX, extraindo do cabeçalho tags como `<ORG>`, `<NAME>` e memso `<CNPJ>` |

## Credenciais Padrão (Sistema Web)

- **Usuário:** `admin`
- **Senha:** `admin123`

## Tratamento de Erros e Resiliência

O sistema foi preparado para ser resiliente a falhas comuns de RPA:
- **Login falhou:** O robô registra a falha com segurança no banco e a projeta no dashboard para o usuário entender o motivo.
- **Download falhou ou Arquivo Inacessível:** O arquivo é marcado localmente com status de `ERRO` contendo o stack trace.
- **Identificação não detectada:** Se o arquivo for impossível de ler, o tipo assume `DESCONHECIDO` e evita a quebra do robô.
- **Recuperação e Reprocessamento:** Existe um fallback e botões diretos no dashboard onde arquivos com o estado de erro podem ser ativamente reprocessados de forma síncrona.



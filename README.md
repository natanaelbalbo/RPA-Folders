# 🤖 RPA Automation MVP

Sistema de automação RPA que integra captura de arquivos do Google Drive, inteligência de identificação, interação com sistema web e dashboard de monitoramento.

## 📋 Visão Geral

```
Google Drive ➔ Motor Python ➔ Sistema Web ➔ Dashboard
```

**Fluxo completo:**
1. O robô acessa o Google Drive via API e baixa os arquivos (XML, PDF, OFX)
2. O motor de identificação analisa cada arquivo para descobrir a empresa (CNPJ/Nome) e o tipo
3. O arquivo é renomeado seguindo o padrão `DATA_EMPRESA_TIPO.extensão`
4. Via Playwright, o robô faz login no sistema web e faz upload na pasta correta
5. O dashboard exibe o status de tudo em tempo real

## 🛠 Stack Tecnológica

| Camada | Tecnologia |
|--------|-----------|
| Backend API | Python + FastAPI |
| Automação Web | Playwright |
| Google Drive | google-api-python-client |
| Banco de Dados | SQLite + SQLAlchemy |
| Frontend | React (Vite) + Tailwind CSS + shadcn/ui |
| Leitura de PDF | pdfplumber |
| Leitura de XML | xml.etree.ElementTree |

## 🚀 Como Rodar

### Pré-requisitos

- Python 3.10+
- Node.js 18+
- npm

### 1. Backend

```bash
cd backend

# Criar ambiente virtual
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

### 2. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Iniciar dev server
npm run dev
```

O frontend estará disponível em `http://localhost:5173`.

### 3. Configuração do Google Drive

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

## 📁 Estrutura do Projeto

```
RPA Teste/
├── backend/
│   ├── app.py                    # API FastAPI
│   ├── config.py                 # Configurações
│   ├── database.py               # Modelos SQLite
│   ├── generate_samples.py       # Gerador de PDFs fake
│   ├── requirements.txt          # Dependências Python
│   ├── credentials/              # Credenciais Google (gitignored)
│   ├── sample_files/             # Arquivos de exemplo
│   │   ├── nfe_sample.xml
│   │   ├── extrato_bancario.ofx
│   │   └── (PDFs gerados pelo script)
│   ├── services/
│   │   ├── google_drive.py       # Integração Google Drive API
│   │   ├── file_identifier.py    # Motor de identificação
│   │   ├── file_renamer.py       # Renomeação de arquivos
│   │   └── web_automation.py     # Automação Playwright
│   └── uploads/                  # Arquivos processados
│
├── frontend/
│   ├── src/
│   │   ├── api/apiService.js     # Chamadas à API
│   │   ├── components/           # Componentes reutilizáveis
│   │   ├── lib/utils.js          # Utilitários
│   │   └── pages/                # Páginas da aplicação
│   │       ├── DashboardPage.jsx
│   │       ├── SistemaPage.jsx
│   │       ├── ArquivosPage.jsx
│   │       └── AutomacaoPage.jsx
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

| Método | Endpoint | Descrição |
|--------|---------|-----------|
| GET | `/api/status` | Status do sistema |
| GET | `/api/empresas` | Listar empresas |
| GET | `/api/empresas/{id}` | Detalhes da empresa |
| GET | `/api/arquivos` | Listar arquivos (com filtros) |
| POST | `/api/processar` | Iniciar processamento do Drive |
| POST | `/api/reprocessar/{id}` | Reprocessar arquivo com erro |
| POST | `/api/auth/login` | Login no sistema |
| POST | `/api/upload/{empresa_id}/{tipo}` | Upload de arquivo |
| GET | `/api/historico` | Histórico de processamento |

**Filtros disponíveis em `/api/arquivos`:**
- `?status=SUCESSO|ERRO|PENDENTE|PROCESSANDO`
- `?tipo=XML|NF|EXTRATO`
- `?periodo=hoje|ontem|7dias`

## 🧠 Motor de Identificação

O motor analisa cada arquivo para descobrir:

| Tipo | Método de Identificação |
|------|------------------------|
| **XML (NF-e)** | Parse XML, busca tags `<emit><CNPJ>` e `<emit><xNome>` |
| **PDF (NF Serviço)** | Extrai texto com pdfplumber, busca padrões de CNPJ via regex, classifica por palavras-chave |
| **OFX (Extrato)** | Parse do formato OFX, extrai `<ORG>`, `<NAME>` e `<CNPJ>` |

**Padrão de renomeação:** `DATA_EMPRESA_TIPO.extensão`
- Exemplo: `20260420_TECH_SOLUTIONS_LTDA_NFE.xml`

## 🔐 Credenciais Padrão (Sistema Web)

- **Usuário:** `admin`
- **Senha:** `admin123`

## 📊 Dashboard

O painel de monitoramento exibe:
- ✅ Status do sistema (Online/Offline)
- 📁 Lista de arquivos processados
- 🏢 Lista de empresas
- 🔍 Filtro por data (Hoje, Ontem, 7 dias)
- 📜 Histórico de processamentos
- 🔄 Botão de reprocessamento para arquivos com erro
- 📍 Indicação de onde cada arquivo foi salvo

## ⚠️ Tratamento de Erros

- **Login falhou:** O robô registra o erro no banco e exibe no dashboard
- **Download falhou:** Arquivo é marcado como ERRO com mensagem detalhada
- **Identificação falhou:** Arquivo é processado com tipo "DESCONHECIDO"
- **Reprocessamento:** Arquivos com erro podem ser reprocessados pelo dashboard

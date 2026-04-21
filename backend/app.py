"""
API principal do sistema RPA com FastAPI.
"""
import asyncio
import shutil
import sys
import os
import platform
from datetime import datetime, timedelta
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

if sys.platform == "win32":
    _real_uname = platform.uname
    def _fast_uname():
        from collections import namedtuple
        UnameResult = namedtuple("uname_result", ["system", "node", "release", "version", "machine"])
        return UnameResult(
            system="Windows",
            node=os.environ.get("COMPUTERNAME", "Windows"),
            release=str(sys.getwindowsversion().major),
            version=str(sys.getwindowsversion().build),
            machine=os.environ.get("PROCESSOR_ARCHITECTURE", "AMD64")
        )
    platform.uname = _fast_uname

load_dotenv()  

from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from config import UPLOADS_DIR, PROCESSED_DIRS, API_HOST, API_PORT, get_now_br
from database import get_db, init_db, Empresa, Arquivo, ProcessingLog

app = FastAPI(
    title="RPA Automation API",
    description="API do sistema de automação RPA para processamento de documentos",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Servir arquivos estáticos de uploads
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Estado global do sistema
system_state = {
    "status": "online",
    "started_at": get_now_br().isoformat(),
    "processing": False,
}


# ═══════════════════════════════════════════════
# ENDPOINTS DE STATUS
# ═══════════════════════════════════════════════

@app.get("/api/status")
def get_status(db: Session = Depends(get_db)):
    """Retorna o status atual do sistema."""
    total = db.query(Arquivo).count()
    sucesso = db.query(Arquivo).filter(Arquivo.status == "SUCESSO").count()
    erro = db.query(Arquivo).filter(Arquivo.status == "ERRO").count()
    pendente = db.query(Arquivo).filter(Arquivo.status == "PENDENTE").count()
    processando = db.query(Arquivo).filter(Arquivo.status == "PROCESSANDO").count()

    return {
        "system": system_state,
        "stats": {
            "total": total,
            "sucesso": sucesso,
            "erro": erro,
            "pendente": pendente,
            "processando": processando,
        }
    }


# ═══════════════════════════════════════════════
# ENDPOINTS DE EMPRESAS
# ═══════════════════════════════════════════════

@app.get("/api/empresas")
def list_empresas(db: Session = Depends(get_db)):
    """Lista todas as empresas cadastradas."""
    empresas = db.query(Empresa).all()
    result = []
    for emp in empresas:
        arquivo_count = db.query(Arquivo).filter(Arquivo.empresa_id == emp.id).count()
        result.append({**emp.to_dict(), "total_arquivos": arquivo_count})
    return result


@app.get("/api/empresas/{empresa_id}")
def get_empresa(empresa_id: int, db: Session = Depends(get_db)):
    """Retorna detalhes de uma empresa."""
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    
    arquivos = db.query(Arquivo).filter(Arquivo.empresa_id == empresa_id).all()
    return {
        **empresa.to_dict(),
        "arquivos": {
            "xml": [a.to_dict() for a in arquivos if a.tipo == "XML"],
            "nf": [a.to_dict() for a in arquivos if a.tipo == "NF"],
            "extratos": [a.to_dict() for a in arquivos if a.tipo == "EXTRATO"],
        }
    }


# ═══════════════════════════════════════════════
# ENDPOINTS DE ARQUIVOS
# ═══════════════════════════════════════════════

@app.get("/api/arquivos")
def list_arquivos(
    status: Optional[str] = None,
    tipo: Optional[str] = None,
    periodo: Optional[str] = Query(None, description="Todos, Hoje, Ontem, 7 Dias"),
    db: Session = Depends(get_db),
):
    """Lista arquivos processados com filtros opcionais."""
    query = db.query(Arquivo)

    if status:
        query = query.filter(Arquivo.status == status.upper())
    if tipo:
        query = query.filter(Arquivo.tipo == tipo.upper())
    if periodo:
        # Convertemos para naive para evitar conflitos com SQLite que não armazena TZ
        now = get_now_br().replace(tzinfo=None)
        if periodo == "Hoje":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif periodo == "Ontem":
            start = (now - timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            end = now.replace(hour=0, minute=0, second=0, microsecond=0)
            query = query.filter(Arquivo.created_at < end)
        elif periodo == "7 Dias":
            start = now - timedelta(days=7)
        else:
            start = None
        
        if start:
            query = query.filter(Arquivo.created_at >= start)

    arquivos = query.order_by(Arquivo.created_at.desc()).all()
    return [a.to_dict() for a in arquivos]


# ═══════════════════════════════════════════════
# ENDPOINTS DE PROCESSAMENTO
# ═══════════════════════════════════════════════

@app.post("/api/processar")
async def processar_drive(db: Session = Depends(get_db)):
    """Inicia o processamento de arquivos do Google Drive."""
    if system_state["processing"]:
        raise HTTPException(status_code=409, detail="Processamento já em andamento")

    system_state["processing"] = True
    results = []

    try:
        # Importar serviços
        from services.google_drive import GoogleDriveService
        from services.file_identifier import FileIdentifier
        from services.file_renamer import FileRenamer

        drive = GoogleDriveService()
        identifier = FileIdentifier()
        renamer = FileRenamer()

        # Log de início
        log = ProcessingLog(acao="Início do processamento", status="INFO", detalhes="Conectando ao Google Drive...")
        db.add(log)
        db.commit()

        # Autenticar e baixar arquivos
        try:
            drive.authenticate()
        except Exception as e:
            log = ProcessingLog(acao="Autenticação Google Drive", status="ERRO", detalhes=str(e))
            db.add(log)
            db.commit()
            raise HTTPException(status_code=500, detail=f"Falha na autenticação: {str(e)}")

        files = drive.download_all_from_folder()

        for file_info in files:
            arquivo = Arquivo(
                nome_original=file_info["name"],
                drive_file_id=file_info["id"],
                status="PROCESSANDO",
            )
            db.add(arquivo)
            db.commit()
            db.refresh(arquivo)

            try:
                if file_info["status"] == "error":
                    raise Exception(f"Falha no download: {file_info.get('error', 'Desconhecido')}")

                local_path = Path(file_info["local_path"])

                # Identificar arquivo
                result = identifier.identify(local_path)
                arquivo.tipo = result.tipo
                
                # Buscar empresa no banco
                empresa = None
                if result.empresa_cnpj:
                    cnpj_clean = result.empresa_cnpj.replace(".", "").replace("/", "").replace("-", "")
                    empresas = db.query(Empresa).all()
                    for emp in empresas:
                        emp_cnpj_clean = emp.cnpj.replace(".", "").replace("/", "").replace("-", "")
                        if emp_cnpj_clean == cnpj_clean:
                            empresa = emp
                            break

                if empresa:
                    arquivo.empresa_id = empresa.id
                
                # Renomear arquivo
                dest_dir = PROCESSED_DIRS.get(result.tipo, UPLOADS_DIR)
                new_path = renamer.rename_file(local_path, result, dest_dir)
                
                arquivo.nome_processado = new_path.name
                arquivo.caminho_destino = str(new_path)
                arquivo.status = "SUCESSO"
                arquivo.processed_at = get_now_br()

                log = ProcessingLog(
                    arquivo_id=arquivo.id,
                    acao="Processamento completo",
                    status="SUCESSO",
                    detalhes=f"Tipo: {result.tipo}, Empresa: {result.empresa_nome or 'N/A'}"
                )
                db.add(log)
                results.append({"arquivo": arquivo.nome_original, "status": "sucesso"})

            except Exception as e:
                arquivo.status = "ERRO"
                arquivo.error_message = str(e)
                arquivo.processed_at = get_now_br()
                
                log = ProcessingLog(
                    arquivo_id=arquivo.id,
                    acao="Erro no processamento",
                    status="ERRO",
                    detalhes=str(e)
                )
                db.add(log)
                results.append({"arquivo": arquivo.nome_original, "status": "erro", "erro": str(e)})

            db.commit()

    except HTTPException:
        raise
    except Exception as e:
        log = ProcessingLog(acao="Erro geral", status="ERRO", detalhes=str(e))
        db.add(log)
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        system_state["processing"] = False

    return {"mensagem": "Processamento concluído", "resultados": results}


@app.post("/api/reprocessar/{arquivo_id}")
async def reprocessar_arquivo(arquivo_id: int, db: Session = Depends(get_db)):
    """Reprocessa um arquivo que teve erro."""
    arquivo = db.query(Arquivo).filter(Arquivo.id == arquivo_id).first()
    if not arquivo:
        raise HTTPException(status_code=404, detail="Arquivo não encontrado")
    if arquivo.status != "ERRO":
        raise HTTPException(status_code=400, detail="Apenas arquivos com erro podem ser reprocessados")

    from services.file_identifier import FileIdentifier
    from services.file_renamer import FileRenamer

    identifier = FileIdentifier()
    renamer = FileRenamer()

    arquivo.status = "PROCESSANDO"
    arquivo.error_message = None
    db.commit()

    try:
        # Tenta reprocessar o arquivo se existir localmente
        local_path = UPLOADS_DIR / arquivo.nome_original
        if not local_path.exists() and arquivo.drive_file_id:
            from services.google_drive import GoogleDriveService
            drive = GoogleDriveService()
            drive.authenticate()
            local_path = drive.download_file(arquivo.drive_file_id, arquivo.nome_original)

        if not local_path.exists():
            raise FileNotFoundError(f"Arquivo não encontrado: {local_path}")

        result = identifier.identify(local_path)
        arquivo.tipo = result.tipo

        empresa = None
        if result.empresa_cnpj:
            cnpj_clean = result.empresa_cnpj.replace(".", "").replace("/", "").replace("-", "")
            empresas = db.query(Empresa).all()
            for emp in empresas:
                if emp.cnpj.replace(".", "").replace("/", "").replace("-", "") == cnpj_clean:
                    empresa = emp
                    break

        if empresa:
            arquivo.empresa_id = empresa.id

        dest_dir = PROCESSED_DIRS.get(result.tipo, UPLOADS_DIR)
        new_path = renamer.rename_file(local_path, result, dest_dir)

        arquivo.nome_processado = new_path.name
        arquivo.caminho_destino = str(new_path)
        arquivo.status = "SUCESSO"
        arquivo.processed_at = get_now_br()

        log = ProcessingLog(
            arquivo_id=arquivo.id,
            acao="Reprocessamento",
            status="SUCESSO",
            detalhes=f"Reprocessado com sucesso. Tipo: {result.tipo}"
        )
        db.add(log)
        db.commit()

        return {"mensagem": "Arquivo reprocessado com sucesso", "arquivo": arquivo.to_dict()}

    except Exception as e:
        arquivo.status = "ERRO"
        arquivo.error_message = str(e)
        arquivo.processed_at = get_now_br()

        log = ProcessingLog(
            arquivo_id=arquivo.id,
            acao="Erro no reprocessamento",
            status="ERRO",
            detalhes=str(e)
        )
        db.add(log)
        db.commit()

        raise HTTPException(status_code=500, detail=str(e))


# ═══════════════════════════════════════════════
# ENDPOINTS DO SISTEMA DESTINO (Login + Upload)
# ═══════════════════════════════════════════════

@app.post("/api/auth/login")
def login(credentials: dict):
    """Simula login no sistema destino."""
    user = credentials.get("usuario", "")
    password = credentials.get("senha", "")
    
    if user == "admin" and password == "admin123":
        return {
            "success": True,
            "token": "fake-jwt-token-rpa-2026",
            "user": {"nome": "Administrador", "email": "admin@techsolutions.com"},
        }
    raise HTTPException(status_code=401, detail="Credenciais inválidas")


@app.post("/api/upload/{empresa_id}/{tipo}")
async def upload_file(
    empresa_id: int,
    tipo: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Faz upload de arquivo para pasta da empresa."""
    empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
    if not empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")

    tipo_upper = tipo.upper()
    if tipo_upper not in PROCESSED_DIRS:
        raise HTTPException(status_code=400, detail=f"Tipo inválido: {tipo}. Use XML, NF ou EXTRATO")

    dest_dir = PROCESSED_DIRS[tipo_upper]
    dest_path = dest_dir / file.filename
    
    with open(dest_path, "wb") as f:
        content = await file.read()
        f.write(content)

    arquivo = Arquivo(
        nome_original=file.filename,
        nome_processado=file.filename,
        tipo=tipo_upper,
        empresa_id=empresa_id,
        status="SUCESSO",
        caminho_destino=str(dest_path),
        processed_at=get_now_br(),
    )
    db.add(arquivo)

    log = ProcessingLog(
        arquivo_id=None,
        acao=f"Upload manual - {tipo_upper}",
        status="SUCESSO",
        detalhes=f"Arquivo {file.filename} enviado para {dest_dir}",
    )
    db.add(log)
    db.commit()
    db.refresh(arquivo)

    log.arquivo_id = arquivo.id
    db.commit()

    return {"mensagem": "Upload realizado com sucesso", "arquivo": arquivo.to_dict()}


# ═══════════════════════════════════════════════
# ENDPOINTS DE HISTÓRICO
# ═══════════════════════════════════════════════

@app.get("/api/historico")
def get_historico(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Retorna o histórico de processamentos."""
    logs = db.query(ProcessingLog).order_by(ProcessingLog.timestamp.desc()).limit(limit).all()
    return [l.to_dict() for l in logs]


# ═══════════════════════════════════════════════
# STARTUP
# ═══════════════════════════════════════════════

@app.on_event("startup")
def startup():
    """Inicializa o banco de dados na inicialização."""
    init_db()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host=API_HOST,
        port=API_PORT,
        reload=True,
        reload_dirs=["."],           # Monitora só o código
        reload_excludes=["venv/*"],  # Ignora a pasta venv
    )

"""
Modelos e configuração do banco de dados SQLite com SQLAlchemy.
"""
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, DateTime, 
    ForeignKey, Text, Enum as SAEnum
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from config import DATABASE_URL, get_now_br

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Empresa(Base):
    """Modelo de empresa cadastrada no sistema."""
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String(255), nullable=False)
    cnpj = Column(String(18), unique=True, nullable=False)
    created_at = Column(DateTime, default=get_now_br)

    arquivos = relationship("Arquivo", back_populates="empresa")

    def to_dict(self):
        return {
            "id": self.id,
            "nome": self.nome,
            "cnpj": self.cnpj,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Arquivo(Base):
    """Modelo de arquivo processado pelo sistema."""
    __tablename__ = "arquivos"

    id = Column(Integer, primary_key=True, index=True)
    nome_original = Column(String(500), nullable=False)
    nome_processado = Column(String(500), nullable=True)
    tipo = Column(String(50), nullable=True)  # XML, NF, EXTRATO
    empresa_id = Column(Integer, ForeignKey("empresas.id"), nullable=True)
    status = Column(String(50), default="PENDENTE")  # PENDENTE, PROCESSANDO, SUCESSO, ERRO
    error_message = Column(Text, nullable=True)
    caminho_destino = Column(String(1000), nullable=True)
    drive_file_id = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=get_now_br)
    processed_at = Column(DateTime, nullable=True)

    empresa = relationship("Empresa", back_populates="arquivos")
    logs = relationship("ProcessingLog", back_populates="arquivo", order_by="ProcessingLog.timestamp.desc()")

    def to_dict(self):
        return {
            "id": self.id,
            "nome_original": self.nome_original,
            "nome_processado": self.nome_processado,
            "tipo": self.tipo,
            "empresa_id": self.empresa_id,
            "empresa_nome": self.empresa.nome if self.empresa else None,
            "empresa_cnpj": self.empresa.cnpj if self.empresa else None,
            "status": self.status,
            "error_message": self.error_message,
            "caminho_destino": self.caminho_destino,
            "drive_file_id": self.drive_file_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "processed_at": self.processed_at.isoformat() if self.processed_at else None,
        }


class ProcessingLog(Base):
    """Log detalhado de cada etapa do processamento."""
    __tablename__ = "processing_logs"

    id = Column(Integer, primary_key=True, index=True)
    arquivo_id = Column(Integer, ForeignKey("arquivos.id"), nullable=True)
    acao = Column(String(255), nullable=False)
    status = Column(String(50), nullable=False)  # INFO, SUCESSO, ERRO
    detalhes = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=get_now_br)

    arquivo = relationship("Arquivo", back_populates="logs")

    def to_dict(self):
        return {
            "id": self.id,
            "arquivo_id": self.arquivo_id,
            "acao": self.acao,
            "status": self.status,
            "detalhes": self.detalhes,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


def get_db():
    """Dependency injection para sessões do banco."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Cria todas as tabelas e insere dados iniciais."""
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Verifica se já existe a empresa exemplo
        empresa = db.query(Empresa).filter_by(cnpj="12.345.678/0001-90").first()
        if not empresa:
            empresa = Empresa(
                nome="Tech Solutions Ltda",
                cnpj="12.345.678/0001-90"
            )
            db.add(empresa)
            db.commit()
            print("Empresa exemplo 'Tech Solutions Ltda' cadastrada com sucesso.")
        else:
            print("Empresa exemplo já existe no banco.")
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
    print("Banco de dados inicializado.")

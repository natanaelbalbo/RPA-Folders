import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import os
import sys

# Adiciona o diretório backend ao path para importar os módulos
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Define variáveis de ambiente falsas para que o config.py não quebre ao ser importado no CI/Testes
os.environ.setdefault("API_PORT", "8000")
os.environ.setdefault("API_HOST", "0.0.0.0")
os.environ.setdefault("SISTEMA_WEB_URL", "http://localhost:5173")
os.environ.setdefault("SISTEMA_LOGIN_USER", "test_user")
os.environ.setdefault("SISTEMA_LOGIN_PASS", "test_pass")

from database import Base, get_db
from app import app

# Configuração do banco de dados de teste (SQLite em memória)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Cria as tabelas
    Base.metadata.create_all(bind=engine)
    yield
    # No in-memory, o banco morre com a conexão, não precisa deletar arquivo

@pytest.fixture
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

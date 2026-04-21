from database import Empresa

def test_get_status(client):
    """Testa o endpoint de status do sistema."""
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert "system" in data
    assert "stats" in data
    assert data["system"]["status"] == "online"

def test_list_empresas_vazio(client):
    """Testa a listagem de empresas quando não há nada no banco."""
    response = client.get("/api/empresas")
    assert response.status_code == 200
    assert isinstance(response.json(), list)
    assert len(response.json()) == 0

def test_create_and_list_empresa(client, db_session):
    """Testa a criação manual no banco e listagem via API."""
    # Adiciona uma empresa diretamente no banco de teste
    nova_empresa = Empresa(nome="Empresa Teste", cnpj="00.000.000/0001-00")
    db_session.add(nova_empresa)
    db_session.commit()

    response = client.get("/api/empresas")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["nome"] == "Empresa Teste"
    assert data[0]["total_arquivos"] == 0

def test_get_empresa_detalhes(client, db_session):
    """Testa a busca de detalhes de uma empresa."""
    emp = Empresa(nome="Detalhe S.A.", cnpj="11.222.333/0001-44")
    db_session.add(emp)
    db_session.commit()
    db_session.refresh(emp)

    response = client.get(f"/api/empresas/{emp.id}")
    assert response.status_code == 200
    data = response.json()
    assert data["nome"] == "Detalhe S.A."
    assert "arquivos" in data

def test_get_empresa_nao_encontrada(client):
    """Testa erro 404 para empresa inexistente."""
    response = client.get("/api/empresas/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Empresa não encontrada"

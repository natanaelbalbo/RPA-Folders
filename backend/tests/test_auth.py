def test_login_sucesso(client):
    """Testa o login com credenciais válidas."""
    response = client.post("/api/auth/login", json={
        "usuario": "admin",
        "senha": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["nome"] == "Administrador"

def test_login_falha(client):
    """Testa o login com credenciais inválidas."""
    response = client.post("/api/auth/login", json={
        "usuario": "errado",
        "senha": "123"
    })
    assert response.status_code == 401
    assert response.json()["detail"] == "Credenciais inválidas"

def test_login_campos_faltando(client):
    """Testa o login sem enviar campos obrigatórios."""
    response = client.post("/api/auth/login", json={})
    assert response.status_code == 401

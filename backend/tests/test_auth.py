import pytest


async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


async def test_register(client):
    resp = await client.post(
        "/api/auth/register",
        json={"email": "newuser@example.com", "password": "password123"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "token" in data
    assert data["email"] == "newuser@example.com"


async def test_register_duplicate_email(client):
    payload = {"email": "dup@example.com", "password": "password123"}
    await client.post("/api/auth/register", json=payload)
    resp = await client.post("/api/auth/register", json=payload)
    assert resp.status_code == 409


async def test_login_success(client):
    await client.post("/api/auth/register", json={"email": "login@example.com", "password": "pass123"})
    resp = await client.post("/api/auth/login", json={"email": "login@example.com", "password": "pass123"})
    assert resp.status_code == 200
    assert "token" in resp.json()


async def test_login_wrong_password(client):
    await client.post("/api/auth/register", json={"email": "wrongpass@example.com", "password": "correct"})
    resp = await client.post("/api/auth/login", json={"email": "wrongpass@example.com", "password": "wrong"})
    assert resp.status_code == 401


async def test_get_me(auth_client):
    client, _ = auth_client
    resp = await client.get("/api/auth/me")
    assert resp.status_code == 200
    assert resp.json()["email"] == "testuser@example.com"


async def test_unauthenticated_papers(client):
    resp = await client.get("/api/papers")
    assert resp.status_code == 401

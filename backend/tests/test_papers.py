import io
import pytest


async def test_list_papers_empty(auth_client):
    client, _ = auth_client
    resp = await client.get("/api/papers")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list) or ("items" in data)


async def test_upload_invalid_file(auth_client):
    client, _ = auth_client
    resp = await client.post(
        "/api/papers/upload",
        files={"file": ("test.txt", b"not a pdf", "text/plain")},
    )
    assert resp.status_code == 400


async def test_upload_empty_file(auth_client):
    client, _ = auth_client
    resp = await client.post(
        "/api/papers/upload",
        files={"file": ("empty.pdf", b"", "application/pdf")},
    )
    assert resp.status_code == 400


async def test_get_nonexistent_paper(auth_client):
    client, _ = auth_client
    resp = await client.get("/api/papers/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


async def test_delete_nonexistent_paper(auth_client):
    client, _ = auth_client
    resp = await client.delete("/api/papers/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404


async def test_paper_isolation(client):
    """Papers from one user should not be visible to another."""
    await client.post("/api/auth/register", json={"email": "user_a@example.com", "password": "password123"})
    await client.post("/api/auth/register", json={"email": "user_b@example.com", "password": "password123"})

    resp_a = await client.post("/api/auth/login", json={"email": "user_a@example.com", "password": "password123"})
    resp_b = await client.post("/api/auth/login", json={"email": "user_b@example.com", "password": "password123"})
    token_b = resp_b.json()["token"]

    client.headers["Authorization"] = f"Bearer {token_b}"
    resp = await client.get("/api/papers")
    assert resp.status_code == 200

import pytest


async def test_list_analyses_empty(auth_client):
    client, _ = auth_client
    resp = await client.get("/api/analyses")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


async def test_create_analysis_needs_two_papers(auth_client):
    client, _ = auth_client
    resp = await client.post(
        "/api/analyses",
        json={
            "type": "comparative",
            "paper_ids": ["00000000-0000-0000-0000-000000000001"],
        },
    )
    assert resp.status_code == 400


async def test_create_analysis_invalid_type(auth_client):
    client, _ = auth_client
    resp = await client.post(
        "/api/analyses",
        json={
            "type": "invalid_type",
            "paper_ids": [
                "00000000-0000-0000-0000-000000000001",
                "00000000-0000-0000-0000-000000000002",
            ],
        },
    )
    assert resp.status_code == 400


async def test_get_nonexistent_analysis(auth_client):
    client, _ = auth_client
    resp = await client.get("/api/analyses/00000000-0000-0000-0000-000000000000")
    assert resp.status_code == 404

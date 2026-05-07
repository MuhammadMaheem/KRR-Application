import uuid

def test_get_library_empty(client):
    response = client.get("/api/library")
    assert response.status_code in (200, 401)


def test_upload_non_pdf(client):
    response = client.post(
        "/api/upload",
        files={"file": ("test.txt", b"not a pdf", "text/plain")},
    )
    assert response.status_code == 400
    assert "PDF" in response.json()["detail"]

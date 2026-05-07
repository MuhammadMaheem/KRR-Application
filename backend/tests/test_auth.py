from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User

def test_password_hashing():
    password = "test123"
    hashed = get_password_hash(password)
    assert verify_password(password, hashed)
    assert not verify_password("wrong", hashed)


def test_create_token():
    token = create_access_token({"sub": "test@gmail.com"})
    assert isinstance(token, str)
    assert len(token) > 20


def test_login_wrong_password(client):
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "test@gmail.com", "password": "wrong"},
    )
    assert response.status_code == 401

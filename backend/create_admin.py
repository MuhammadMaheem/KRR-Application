"""
CLI script to create the first admin user.
Usage: python -m backend.create_admin
"""
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, ".")

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.user import User
from app.db.base import Base

DATABASE_URL = settings.DATABASE_URL or "postgresql://krr_user:krr_pass@localhost:5432/krr_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    email = input("Admin email: ").strip()
    password = input("Admin password: ").strip()
    if not email or not password:
        print("Email and password required.")
        sys.exit(1)

    if db.query(User).filter(User.email == email).first():
        print(f"User {email} already exists.")
        sys.exit(1)

    user = User(
        email=email,
        hashed_password=get_password_hash(password),
        role="admin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    print(f"✅ Admin user {email} created successfully.")
finally:
    db.close()

# app/database/database.py

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# ডাটাবেসের URL (SQLite ফাইলের নাম)
SQLALCHEMY_DATABASE_URL = "sqlite:///./zenith_bot.db"

# SQLAlchemy ইঞ্জিন তৈরি
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    # এই আর্গুমেন্টটি শুধু SQLite-এর জন্য প্রয়োজন
    connect_args={"check_same_thread": False}
)

# প্রতিটি ডাটাবেস সেশনের জন্য একটি SessionLocal ক্লাস তৈরি
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# আমাদের ডাটাবেস মডেলগুলো এই Base ক্লাস থেকে উত্তরাধিকারী হবে
Base = declarative_base()
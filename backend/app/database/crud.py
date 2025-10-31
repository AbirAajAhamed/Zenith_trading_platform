# app/database/crud.py

from sqlalchemy.orm import Session
from . import models

def create_trade(db: Session, symbol: str, order_type: str, amount: float, price: float):
    # একটি নতুন ট্রেড অবজেক্ট তৈরি করা
    db_trade = models.Trade(
        symbol=symbol,
        order_type=order_type,
        amount=amount,
        price=price
    )
    db.add(db_trade) # সেশনে যোগ করা
    db.commit()      # ডাটাবেসে সেভ করা
    db.refresh(db_trade) # ডাটাবেস থেকে নতুন ডেটা দিয়ে অবজেক্ট রিফ্রেশ করা
    return db_trade

# <-- নতুন ফাংশন যোগ করা হলো -->
def get_trades(db: Session, skip: int = 0, limit: int = 100):
    """
    ডাটাবেস থেকে ট্রেডের তালিকা নিয়ে আসে (সবচেয়ে নতুনগুলো আগে)।
    """
    return db.query(models.Trade).order_by(models.Trade.id.desc()).offset(skip).limit(limit).all()
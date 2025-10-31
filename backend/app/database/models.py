# app/database/models.py

from sqlalchemy import Column, Integer, String, Float, DateTime
import datetime
from .database import Base

class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    order_type = Column(String) # 'BUY' or 'SELL'
    amount = Column(Float)
    price = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    pnl = Column(Float, default=0.0) # Profit and Loss
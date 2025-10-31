# app/services/performance_analyzer.py

from sqlalchemy.orm import Session
from ..database import crud

def calculate_performance_stats(db: Session):
    """
    ডাটাবেসের সমস্ত ট্রেড বিশ্লেষণ করে পারফরম্যান্স মেট্রিক গণনা করে।
    """
    # ডাটাবেস থেকে সব ট্রেড আনা (সবচেয়ে পুরনোটি আগে)
    trades = crud.get_trades(db, limit=10000) # একটি বড় লিমিট দেওয়া হলো
    trades.reverse() # পুরনো থেকে নতুন ক্রমে সাজানো হলো

    if not trades:
        return {
            "total_pnl": 0,
            "spot_pnl": 0,    # আপাতত স্পট এবং ফিউচার আলাদা করছি না
            "futures_pnl": 0,
            "win_rate": 0,
            "total_trades": 0
        }

    total_pnl = 0.0
    wins = 0
    losses = 0
    
    # একটি সহজ PNL গণনার লজিক (পেয়ার ট্রেডিং ধরে)
    # এটি ধরে নিচ্ছে যে প্রতিটি BUY-এর পরে একটি SELL আসে
    last_buy_price = None

    for trade in trades:
        if trade.order_type == 'BUY':
            if last_buy_price is None: # শুধুমাত্র প্রথম BUY-টি ট্র্যাক করা হচ্ছে
                last_buy_price = trade.price
        
        elif trade.order_type == 'SELL':
            if last_buy_price is not None:
                # একটি BUY-SELL জোড়া পাওয়া গেছে
                pnl = (trade.price - last_buy_price) * trade.amount
                total_pnl += pnl
                
                if pnl > 0:
                    wins += 1
                else:
                    losses += 1
                
                last_buy_price = None # পরবর্তী জোড়ার জন্য রিসেট

    total_completed_trades = wins + losses
    win_rate = (wins / total_completed_trades * 100) if total_completed_trades > 0 else 0

    return {
        "total_pnl": round(total_pnl, 2),
        "spot_pnl": round(total_pnl, 2), # সরলতার জন্য মোট PNL-কেই স্পট ধরা হচ্ছে
        "futures_pnl": 0, # ফিউচার ট্রেডিং এখনও প্রয়োগ করা হয়নি
        "win_rate": round(win_rate, 2),
        "total_trades": len(trades)
    }
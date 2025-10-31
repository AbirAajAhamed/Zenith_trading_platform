# test_engine.py

import asyncio
import datetime
import traceback

# আমাদের সার্ভিসগুলো সরাসরি ইম্পোর্ট করা
from app.services import backtesting_engine
from app.services import strategy_manager

# --- পরীক্ষার জন্য প্যারামিটার সেট করুন ---
# ফ্রন্টএন্ড থেকে আপনি ঠিক যে প্যারামিটারগুলো পাঠাচ্ছিলেন
TEST_PARAMS = {
    "exchange_name": "binance",
    "strategy_name": "Macd Crossover Strategy", # <-- আপনি এই স্ট্র্যাটেজিটি পরীক্ষা করছিলেন
    "symbol": "BTC/USDT",
    "timeframe": "1d",
    "start_date": datetime.date(2023, 1, 1),
    "end_date": datetime.date(2023, 9, 30),
}

async def main():
    """
    FastAPI ছাড়া সরাসরি backtesting_engine.run_simulation-কে কল করে।
    এটি আমাদের সম্পূর্ণ এবং আনফিল্টারড এরর মেসেজ দেখাবে।
    """
    print("--- Starting Direct Engine Test ---")
    print(f"Parameters: {TEST_PARAMS}")
    
    try:
        # সরাসরি ইঞ্জিন ফাংশনটিকে কল করা হচ্ছে
        result = await backtesting_engine.run_simulation(**TEST_PARAMS)
        
        print("\n✅✅✅ SUCCESS! ✅✅✅")
        print("Backtest completed without errors.")
        print(f"Final Results: Total Return = {result.total_return}%, Win Rate = {result.win_rate}%")
        
    except Exception as e:
        print("\n❌❌❌ TEST FAILED! ❌❌❌")
        print("An error occurred inside the backtesting engine.")
        print(f"\n--- Full Python Error Traceback ---")
        # এই অংশটি আমাদের এররের সম্পূর্ণ বিস্তারিত দেখাবে
        traceback.print_exc()

if __name__ == "__main__":
    # Async ফাংশনটি চালানো হচ্ছে
    asyncio.run(main())
# app/bot_core.py (সম্পূর্ণ আপডেট করা সংস্করণ)

import time
import pandas as pd
import traceback
from typing import Dict, Any

# আমাদের সার্ভিস এবং কনফিগারেশন মডিউল
from .services.exchange_manager import get_exchange_client
from .services.strategy_manager import load_strategy_dynamically
from . import config
from .database.database import SessionLocal
from .database import crud

# --- ডিফল্ট ট্রেডিং প্যারামিটার ---
# এই প্যারামিটারগুলো এখন শুধুমাত্র একটি ফলব্যাক হিসেবে কাজ করবে,
# কারণ ভবিষ্যতে UI থেকে এগুলো ডাইনামিকভাবে সেট করা হবে।
DEFAULT_EXCHANGE = 'binance'
DEFAULT_STRATEGY = 'Rsi Strategy'
DEFAULT_SYMBOL = 'BTC/USDT'
DEFAULT_TIMEFRAME = '1m'
DEFAULT_TRADE_AMOUNT = 0.001
DEFAULT_STRATEGY_PARAMS = {'length': 14, 'oversold': 30, 'overbought': 70}


def run_bot_cycle(bot_status_ref: dict, strategy_options: Dict[str, Any] = None):
    """
    ট্রেডিং বটের মূল চক্র। 
    এটি এখন UI থেকে পাঠানো কাস্টম অপশন গ্রহণ করতে পারে।
    """
    print("🤖 Zenith Bot engine is attempting to start...")

    # strategy_options না থাকলে ডিফল্ট ভ্যালু ব্যবহার করা
    if strategy_options is None:
        strategy_options = {}

    exchange_name = strategy_options.get('exchange', DEFAULT_EXCHANGE)
    strategy_name = strategy_options.get('strategy', DEFAULT_STRATEGY)
    symbol = strategy_options.get('symbol', DEFAULT_SYMBOL)
    timeframe = strategy_options.get('timeframe', DEFAULT_TIMEFRAME)
    trade_amount = strategy_options.get('trade_amount', DEFAULT_TRADE_AMOUNT)
    strategy_params = strategy_options.get('params', DEFAULT_STRATEGY_PARAMS)
    
    db = None

    try:
        # --- ধাপ ১: প্রাথমিক সেটআপ ---
        bot_status_ref["is_running"] = True
        
        db = SessionLocal()
        print("🔗 Database session opened.")
        
        exchange = get_exchange_client(exchange_name, config.BINANCE_API_KEY, config.BINANCE_API_SECRET)
        print(f"✅ Successfully connected to {exchange.name}.")
        
        # --- ডাইনামিক স্ট্র্যাটেজি লোডিং ---
        strategy = load_strategy_dynamically(strategy_name, strategy_params)
        print(f"📈 Strategy loaded: '{strategy_name}' with params {strategy_params}")

        # বট স্ট্যাটাস আপডেট করা
        bot_status_ref["strategy_name"] = strategy_name
        bot_status_ref["symbol"] = symbol
        
        # --- ধাপ ২: মূল ট্রেডিং লুপ ---
        print(f"\n🚀 Starting main trading loop for {symbol} on {timeframe}...")
        while bot_status_ref.get("is_running", False):
            try:
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Checking for new signal...")

                ohlcv = exchange.fetch_ohlcv(symbol, timeframe=timeframe, limit=100)
                if not ohlcv:
                    print(f"⚠️ Could not fetch OHLCV data for {symbol}. Skipping cycle.")
                    time.sleep(60)
                    continue

                df = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
                
                signal = strategy.generate_signals(df)
                print(f"💡 Signal generated: {signal}")

                if signal in ['BUY', 'SELL']:
                    current_price = exchange.fetch_ticker(symbol)['last']
                    print(f"ACTION: Placing a {signal} order for {trade_amount} {symbol} at {current_price}")
                    
                    crud.create_trade(db, symbol, signal, trade_amount, current_price)
                    print("✅ Trade successfully saved to database.")

                time.sleep(60)

            except Exception as e:
                print(f"🔥 An error occurred inside the trading loop: {e}")
                print("Bot will rest for 30 seconds and then continue.")
                time.sleep(30)

    except Exception as e:
        print("\n🔥🔥🔥 A FATAL ERROR occurred that stopped the bot engine! 🔥🔥🔥")
        print(f"Error Type: {type(e).__name__}")
        print(f"Error Details: {e}")
        traceback.print_exc()

    finally:
        print("\nInitiating bot shutdown sequence...")
        if db:
            db.close()
            print("🔗 Database session closed.")
        
        bot_status_ref["is_running"] = False
        bot_status_ref["strategy_name"] = None
        bot_status_ref["symbol"] = None
        print("🛑 Zenith Bot engine has been stopped.")
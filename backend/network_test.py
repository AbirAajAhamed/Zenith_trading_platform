# network_test.py

import ccxt
import ccxt.async_support as ccxt_async
import asyncio

def test_sync_connection():
    """সিঙ্ক্রোনাস ccxt ব্যবহার করে সংযোগ পরীক্ষা করে।"""
    print("--- Testing Synchronous (Normal) CCXT Connection ---")
    try:
        exchange = ccxt.binance()
        exchange.load_markets()
        print("✅ SUCCESS: Synchronous connection to Binance works fine.")
    except Exception as e:
        print(f"❌ FAILED: Synchronous connection failed. Error: {e}")

async def test_async_connection():
    """অ্যাসিঙ্ক্রোনাস ccxt ব্যবহার করে সংযোগ পরীক্ষা করে।"""
    print("\n--- Testing Asynchronous (Async) CCXT Connection ---")
    exchange = None
    try:
        exchange = ccxt_async.binance()
        # fetch_ohlcv ফাংশনটি exchangeInfo কল করে, যা আমাদের এরর দিচ্ছে
        await exchange.fetch_ohlcv('BTC/USDT', '1d', limit=1)
        print("✅ SUCCESS: Asynchronous connection and data fetching work fine.")
    except Exception as e:
        print(f"❌ FAILED: Asynchronous connection or data fetching failed. Error: {e}")
    finally:
        if exchange:
            await exchange.close()

if __name__ == "__main__":
    print("Starting network connection test for Zenith Bot...")
    test_sync_connection()
    asyncio.run(test_async_connection())
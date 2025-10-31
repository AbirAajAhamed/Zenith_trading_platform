# app/services/exchange_manager.py (চূড়ান্ত এবং নির্ভরযোগ্য async সংস্করণ)

import ccxt
import ccxt.async_support as ccxt_async
from fastapi import HTTPException
from typing import List

# ==============================================================================
#  সিঙ্ক্রোনাস ফাংশন (API Key পরীক্ষার জন্য)
#  - এই ফাংশনটি অপরিবর্তিত রাখা হয়েছে, কারণ এটি সঠিক এবং শক্তিশালী।
# ==============================================================================
def get_exchange_client(exchange_name: str, api_key: str, api_secret: str):
    """
    একটি নির্দিষ্ট এক্সচেঞ্জের জন্য ccxt ক্লায়েন্ট তৈরি করে এবং সংযোগ পরীক্ষা করে।
    """
    try:
        exchange_class = getattr(ccxt, exchange_name.lower())
        
        exchange = exchange_class({
            'apiKey': api_key,
            'secret': api_secret,
            'options': { 'defaultType': 'spot' },
            'timeout': 30000,
            'adjustForTimeDifference': True,
        })
        
        # সংযোগ পরীক্ষা করার জন্য fetch_balance() একটি ভালো উপায়
        exchange.fetch_balance()
        return exchange

    except ccxt.RequestTimeout as e:
        detail = f"Connection to {exchange_name.capitalize()} timed out. Check network or firewall. Details: {e}"
        raise HTTPException(status_code=504, detail=detail)

    except ccxt.AuthenticationError:
        detail = "Authentication failed. Please check your API key and secret."
        raise HTTPException(status_code=401, detail=detail)

    except ccxt.NetworkError as e:
        detail = f"Network error connecting to {exchange_name.capitalize()}. Details: {e}"
        raise HTTPException(status_code=503, detail=detail)

    except AttributeError:
        detail = f"The exchange '{exchange_name}' is not supported."
        raise HTTPException(status_code=400, detail=detail)

    except Exception as e:
        detail = f"An unexpected error occurred: {e}"
        raise HTTPException(status_code=500, detail=detail)


# ==============================================================================
#  অ্যাসিঙ্ক্রোনাস ফাংশন (মার্কেট তালিকা আনার জন্য)
#  - এই ফাংশনটি এখন সম্পূর্ণরূপে async-সম্মত এবং ত্রুটিমুক্ত।
# ==============================================================================
async def get_all_markets(exchange_name: str) -> List[str]:
    """
    অ্যাসিঙ্ক্রোনাসভাবে একটি নির্দিষ্ট এক্সচেঞ্জের সমস্ত স্পট ট্রেডিং পেয়ারের তালিকা নিয়ে আসে।
    এটি পাবলিক ডেটা ব্যবহার করে, তাই API Key-এর প্রয়োজন নেই।
    """
    exchange = None  # finally ব্লকে ব্যবহার করার জন্য বাইরে সংজ্ঞায়িত করা
    try:
        exchange_class = getattr(ccxt_async, exchange_name.lower())
        
        # aiohttp-এর জন্য ৩০ সেকেন্ডের একটি কানেকশন টাইমআউট সেট করা হচ্ছে
        exchange = exchange_class()
        
        # load_markets() একটি async ফাংশন, তাই await আবশ্যক
        await exchange.load_markets(True) # True প্যারামিটার দিয়ে রিলোড ফোর্স করা হচ্ছে
        markets_data = exchange.markets
        
        usdt_pairs = sorted([
            market['symbol'] 
            for market in markets_data.values() 
            if market.get('spot', False) and market['symbol'].endswith('/USDT')
        ])
        
        other_pairs = sorted([
            market['symbol'] 
            for market in markets_data.values() 
            if market.get('spot', False) and '/' in market['symbol'] and not market['symbol'].endswith('/USDT')
        ])
        
        return usdt_pairs + other_pairs
        
    except AttributeError:
        # যদি ব্যবহারকারী এমন কোনো এক্সচেঞ্জের নাম দেয় যা ccxt সাপোর্ট করে না
        raise ValueError(f"The exchange '{exchange_name}' is not supported.")
    except Exception as e:
        # যেকোনো নেটওয়ার্ক বা অন্য সমস্যার জন্য
        raise ValueError(f"Could not fetch markets for '{exchange_name.capitalize()}'. Network issue or exchange error. Details: {e}")
    finally:
        # নিশ্চিত করা যে এক্সচেঞ্জ সেশন সবসময় বন্ধ হয়
        if exchange:
            await exchange.close()
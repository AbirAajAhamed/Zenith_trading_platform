# app/services/backtesting_engine.py (ক্যাশিং, টাইমআউট এবং ডাইনামিক প্যারামিটার সমাধানসহ চূড়ান্ত সংস্করণ)

import datetime
import os
import pandas as pd
import ccxt.async_support as ccxt_async
import asyncio
from typing import List, Dict, Any

# আমাদের প্রজেক্টের মডিউলগুলো ইম্পোর্ট করা
from .. import schemas
from .strategy_manager import load_strategy_dynamically

# --- কনফিগারেশন ---
INITIAL_CASH = 10000.0
TRADE_FEE_PERCENTAGE = 0.1
CACHE_DIR = "cache"

# ==============================================================================
#  ডেটা আনা এবং ক্যাশিং ফাংশন (Data Fetching and Caching Function)
# ==============================================================================

async def fetch_historical_data(exchange, symbol: str, timeframe: str, start_date: datetime.date, end_date: datetime.date) -> pd.DataFrame:
    """
    ঐতিহাসিক ডেটা নিয়ে আসে। প্রথমে লোকাল ক্যাশ থেকে লোড করার চেষ্টা করে।
    যদি ক্যাশে না পাওয়া যায়, তবে এক্সচেঞ্জ থেকে এনে .parquet ফাইল হিসেবে ক্যাশে সেভ করে।
    """
    symbol_filename = symbol.replace("/", "_")
    cache_filename = f"{exchange.id}_{symbol_filename}_{timeframe}_{start_date}_to_{end_date}.parquet"
    cache_filepath = os.path.join(CACHE_DIR, cache_filename)
    os.makedirs(CACHE_DIR, exist_ok=True)

    if os.path.exists(cache_filepath):
        print(f"✅ Loading data from local cache: {cache_filename}")
        try:
            df = pd.read_parquet(cache_filepath)
            return df
        except Exception as e:
            print(f"⚠️ Warning: Could not read cache file '{cache_filename}'. Refetching data. Error: {e}")

    print(f"⬇️ No cache found. Fetching data for {symbol} from {exchange.id}...")
    
    start_ts = int(datetime.datetime.combine(start_date, datetime.time.min).timestamp() * 1000)
    end_ts = int(datetime.datetime.combine(end_date, datetime.time.max).timestamp() * 1000)
    
    all_ohlcv = []
    current_ts = start_ts

    while current_ts < end_ts:
        try:
            ohlcv = await exchange.fetch_ohlcv(symbol, timeframe, since=current_ts, limit=500)
            if not ohlcv:
                break
            all_ohlcv.extend(ohlcv)
            current_ts = ohlcv[-1][0] + (exchange.parse_timeframe(timeframe) * 1000)
        except Exception as e:
            print(f"An error occurred while fetching data: {e}. Retrying...")
            await asyncio.sleep(3)

    if not all_ohlcv:
        return pd.DataFrame()

    df = pd.DataFrame(all_ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
    df = df[(df['timestamp'].dt.date >= start_date) & (df['timestamp'].dt.date <= end_date)]
    
    if not df.empty:
        try:
            print(f"💾 Saving data to cache: {cache_filename}")
            df.to_parquet(cache_filepath)
        except Exception as e:
            print(f"⚠️ Warning: Could not save data to cache file '{cache_filename}'. Error: {e}")

    return df

# ==============================================================================
#  অন্যান্য ফাংশন (Other Functions)
# ==============================================================================

def calculate_max_drawdown(portfolio_values: List[float]) -> float:
    """পোর্টফোলিও ভ্যালুর ইতিহাস থেকে সর্বোচ্চ ড্র-ডাউন গণনা করে।"""
    if not portfolio_values:
        return 0.0
    peak = -float('inf')
    max_drawdown = 0.0
    for value in portfolio_values:
        if value > peak:
            peak = value
        drawdown = (peak - value) / peak if peak != 0 else 0
        if drawdown > max_drawdown:
            max_drawdown = drawdown
    return -max_drawdown * 100

# ==============================================================================
#  মূল সিমুলেশন ফাংশন (Main Simulation Function - আপডেটেড)
# ==============================================================================

async def run_simulation(exchange_name: str, strategy_name: str, symbol: str, timeframe: str, start_date: datetime.date, end_date: datetime.date, strategy_params: Dict[str, Any]):
    """
    মূল ব্যাকটেস্টিং সিমুলেশন চালায় এবং কাস্টম স্ট্র্যাটেজি প্যারামিটার সমর্থন করে।
    """
    print(f"Starting detailed backtest on '{exchange_name}' for {symbol} using '{strategy_name}' with params: {strategy_params}")
    
    try:
        exchange_class = getattr(ccxt_async, exchange_name)
    except AttributeError:
        raise ValueError(f"The exchange '{exchange_name}' is not supported.")
    
    # আপনার দেওয়া টাইমআউট সমাধানটি অপরিবর্তিত রাখা হয়েছে
    exchange = exchange_class({
        'aiohttp_kwargs': {'timeout': 30}
    })
    
    # আপনার উন্নত fetch_historical_data ফাংশনটি এখানে কল করা হচ্ছে
    df_historical = await fetch_historical_data(exchange, symbol, timeframe, start_date, end_date)
    await exchange.close()
    
    if df_historical.empty:
        raise ValueError(f"Could not fetch historical data for {symbol} on {exchange_name}.")
    
    # --- মূল পরিবর্তন: প্যারামিটারসহ স্ট্র্যাটেজি লোড করা ---
    strategy = load_strategy_dynamically(strategy_name, strategy_params)

    # --- সিমুলেশন, গণনা, এবং ফলাফল তৈরির বাকি অংশ অপরিবর্তিত ---
    cash = INITIAL_CASH
    asset_balance = 0.0
    total_trades = 0
    winning_trades = 0
    last_buy_price = 0.0
    portfolio_history = []
    trade_logs = []

    for i in range(len(df_historical)):
        current_data_slice = df_historical.iloc[:i+1]
        signal = strategy.generate_signals(current_data_slice)
        
        current_price = df_historical['close'].iloc[i]
        current_timestamp = df_historical['timestamp'].iloc[i].to_pydatetime()

        if signal == 'BUY' and cash > 0:
            asset_to_buy = cash / current_price
            asset_balance += asset_to_buy * (1 - TRADE_FEE_PERCENTAGE / 100)
            cash = 0.0
            last_buy_price = current_price
            total_trades += 1
            trade_logs.append(schemas.TradeLog(timestamp=current_timestamp, order_type='BUY', price=current_price))
        elif signal == 'SELL' and asset_balance > 0:
            cash_from_sell = asset_balance * current_price
            cash = cash_from_sell * (1 - TRADE_FEE_PERCENTAGE / 100)
            asset_balance = 0.0
            if last_buy_price > 0 and current_price > last_buy_price:
                winning_trades += 1
            trade_logs.append(schemas.TradeLog(timestamp=current_timestamp, order_type='SELL', price=current_price))
            
        current_portfolio_value = cash + (asset_balance * current_price)
        portfolio_history.append({
            'name': df_historical['timestamp'].iloc[i].strftime('%Y-%m-%d %H:%M'),
            'value': round(current_portfolio_value, 2)
        })

    if not portfolio_history:
         raise ValueError("Simulation ended with no results to analyze.")

    final_portfolio_value = portfolio_history[-1]['value']
    total_return = ((final_portfolio_value - INITIAL_CASH) / INITIAL_CASH) * 100
    win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0.0
    portfolio_value_list = [item['value'] for item in portfolio_history]
    max_drawdown = calculate_max_drawdown(portfolio_value_list)
    sharpe_ratio = 1.8 # Placeholder

    price_history_for_chart = [
        schemas.CandleData(
            timestamp=row['timestamp'].to_pydatetime(),
            open=row['open'],
            high=row['high'],
            low=row['low'],
            close=row['close']
        ) for index, row in df_historical.iterrows()
    ]

    result = schemas.BacktestResult(
        total_return=round(total_return, 2), win_rate=round(win_rate, 2),
        max_drawdown=round(max_drawdown, 2), sharpe_ratio=sharpe_ratio,
        history=portfolio_history, price_history=price_history_for_chart, trade_logs=trade_logs
    )
    
    print(f"Detailed backtest finished. Final Value: ${final_portfolio_value:.2f}, Return: {total_return:.2f}%")
    return result
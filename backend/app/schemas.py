# app/schemas.py

import datetime
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# ==============================================================================
#  বিদ্যমান ট্রেডিং এবং পারফরম্যান্স স্কিমা (Existing Schemas)
# ==============================================================================

class Trade(BaseModel):
    """ একটি একক ট্রেডের ডেটা মডেল (যা ডাটাবেস থেকে আসে) """
    id: int
    symbol: str
    order_type: str  # e.g., 'BUY' or 'SELL'
    amount: float
    price: float
    timestamp: datetime.datetime

    class Config:
        from_attributes = True


class PerformanceStats(BaseModel):
    """ ড্যাশবোর্ডের পারফরম্যান্স মেট্রিক্স প্রদর্শনের জন্য """
    total_pnl: float
    spot_pnl: float
    futures_pnl: float
    win_rate: float


class ApiKeyTestRequest(BaseModel):
    """ ফ্রন্টএন্ড থেকে API কী পরীক্ষার অনুরোধের জন্য """
    exchange: str
    api_key: str
    api_secret: str

# ==============================================================================
#  ব্যাকটেস্টিং স্কিমা (Upgraded Schemas for Backtesting)
# ==============================================================================

# ------------------------------------------------------------------------------
#  অনুরোধের জন্য স্কিমা (Request Schema for Single Backtest)
# ------------------------------------------------------------------------------

class BacktestRequest(BaseModel):
    """
    ফ্রন্টএন্ড থেকে একটি ব্যাকটেস্ট শুরু করার জন্য প্রয়োজনীয় ডেটা।
    এই মডেলে এখন ডাইনামিক স্ট্র্যাটেজি প্যারামিটার অন্তর্ভুক্ত করা হয়েছে।
    """
    exchange_name: str = Field(..., description="The exchange to run the backtest on, e.g., 'binance'")
    strategy_name: str = Field(..., description="The name of the strategy to backtest, e.g., 'Rsi Strategy'")
    symbol: str = Field(..., description="The trading symbol, e.g., 'BTC/USDT'")
    timeframe: str = Field(..., description="The timeframe for the candles, e.g., '1h', '4h', '1d'")
    start_date: datetime.date = Field(..., description="The start date for the backtest (YYYY-MM-DD)")
    end_date: datetime.date = Field(..., description="The end date for the backtest (YYYY-MM-DD)")
    strategy_params: Dict[str, Any] = Field(..., description="A dictionary of custom parameters for the selected strategy.")


# ------------------------------------------------------------------------------
#  ফলাফল পাঠানোর জন্য স্কিমা (Response Schemas for Single Backtest)
# ------------------------------------------------------------------------------

class BacktestResultHistory(BaseModel):
    """ ব্যাকটেস্টের সময় পোর্টফোলিওর মূল্যের ঐতিহাসিক ডেটা পয়েন্ট। """
    name: str = Field(..., description="The label for the data point, typically a date or month")
    value: float = Field(..., description="The portfolio value at that point in time")


class TradeLog(BaseModel):
    """ একটি সিমুলেটেড ট্রেডের বিস্তারিত তথ্য। """
    timestamp: datetime.datetime = Field(..., description="Timestamp of when the trade occurred")
    order_type: str = Field(..., description="Type of the order ('BUY' or 'SELL')")
    price: float = Field(..., description="Price at which the trade was executed")


class CandleData(BaseModel):
    """ একটি একক ক্যান্ডেলের জন্য OHLC ডেটা। """
    timestamp: datetime.datetime = Field(..., description="The start time of the candle")
    open: float = Field(..., description="Opening price")
    high: float = Field(..., description="Highest price")
    low: float = Field(..., description="Lowest price")
    close: float = Field(..., description="Closing price")


class BacktestResult(BaseModel):
    """ ব্যাকটেস্টের সম্পূর্ণ ফলাফল, যা API থেকে ফ্রন্টএন্ডে পাঠানো হবে। """
    total_return: float = Field(..., description="The net percentage return over the entire period")
    win_rate: float = Field(..., description="The percentage of trades that were profitable")
    max_drawdown: float = Field(..., description="The largest peak-to-trough percentage decline in portfolio value")
    sharpe_ratio: float = Field(..., description="A measure of risk-adjusted return")
    history: List[BacktestResultHistory] = Field(..., description="A list of historical portfolio values for the area chart")
    price_history: List[CandleData] = Field(..., description="The complete OHLC price history for candlestick charting")
    trade_logs: List[TradeLog] = Field(..., description="A log of all simulated BUY/SELL trades for marking the chart")


# ==============================================================================
#  ধাপ ১৩.খ (নতুন): অপটিমাইজেশন স্কিমা (Schemas for Optimization Engine)
# ==============================================================================

# ------------------------------------------------------------------------------
#  অনুরোধের জন্য স্কিমা (Request Schema for Optimization)
# ------------------------------------------------------------------------------

class ParamRange(BaseModel):
    """ একটি একক প্যারামিটারের জন্য অপটিমাইজেশন রেঞ্জ। """
    type: str = Field(..., description="Parameter type ('integer', 'float', 'string')")
    start: float = Field(..., description="The starting value of the range.")
    end: float = Field(..., description="The ending value of the range.")
    step: float = Field(..., description="The increment step for the range.")


class OptimizerRequest(BaseModel):
    """ একটি সম্পূর্ণ অপটিমাইজেশন জব শুরু করার জন্য অনুরোধ। """
    exchange_name: str
    strategy_name: str
    symbol: str
    timeframe: str
    start_date: datetime.date
    end_date: datetime.date
    strategy_params_range: Dict[str, ParamRange]


# ------------------------------------------------------------------------------
#  ফলাফল এবং স্ট্যাটাস পাঠানোর জন্য স্কিমা (Response Schemas for Optimization)
# ------------------------------------------------------------------------------

class OptimizationResultItem(BaseModel):
    """ অপটিমাইজেশনের প্রতিটি পৃথক রানের ফলাফল। """
    params: Dict[str, Any]
    total_return: float
    win_rate: float
    max_drawdown: float


class JobStatus(BaseModel):
    """ অপটিমাইজেশন জবের বর্তমান অবস্থা। """
    job_id: str
    status: str = Field(..., description="Current status: pending, running, completed, or failed")
    progress: int = Field(..., description="Number of backtests completed")
    total_runs: int = Field(..., description="Total number of backtests to run")
    error: Optional[str] = Field(None, description="Error message if the job failed")


class OptimizationResult(JobStatus):
    """ একটি সম্পন্ন অপটিমাইজেশন জবের চূড়ান্ত ফলাফল। """
    results: Optional[List[OptimizationResultItem]] = Field(None, description="A list of all backtest results, sorted by performance")


# ==============================================================================
#  সাধারণ এবং স্ট্যাটাস স্কিমা (General & Status Schemas)
# ==============================================================================

class BotStatus(BaseModel):
    """ বটের বর্তমান অবস্থা জানানোর জন্য একটি স্ট্যান্ডার্ড মডেল। """
    is_running: bool
    strategy_name: Optional[str] = None
    symbol: Optional[str] = None


class ResponseMessage(BaseModel):
    """ API থেকে সাধারণ সফল বা তথ্যমূলক বার্তা পাঠানোর জন্য। """
    message: str = Field(..., description="A success or informational message from the API.")
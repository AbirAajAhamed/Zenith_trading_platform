# app/main.py (চূড়ান্ত এবং নির্ভরযোগ্য সংস্করণ)

# --- FastAPI এবং Python-এর স্ট্যান্ডার্ড লাইব্রেরি ইম্পোর্ট ---
from fastapi import FastAPI, BackgroundTasks, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import traceback

# --- লোকাল ইম্পোর্টস ---
from .database import models, crud
from . import schemas
from .database.database import SessionLocal, engine

from . import bot_core
from .services import (
    performance_analyzer,
    exchange_manager,
    backtesting_engine,
    strategy_manager,
    optimizer_engine
)

# --- অ্যাপ ইনিশিয়ালাইজেশন এবং কনফিগারেশন ---

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Zenith Bot API",
    description="A comprehensive API for managing, backtesting, and controlling the Zenith Trading Bot.",
    version="1.5.1",
    # FastAPI দ্বারা ব্যবহৃত JSON এনকোডারকে কাস্টমাইজ করা হয়েছে, যাতে coroutine অবজেক্টের কারণে এরর না হয়
    json_encoders={
        # Your custom encoders here if any
    }
)

SUPPORTED_EXCHANGES = ["binance", "kucoin", "bybit"]
SUPPORTED_TIMEFRAMES = ["1h", "4h", "1d", "1w"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

bot_status = {"is_running": False, "strategy_name": None, "symbol": None}

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ======================================================================
# API Endpoints
# ======================================================================
@app.get("/", tags=["Default"], include_in_schema=False)
def read_root():
    return {"message": "Welcome to the Zenith Trading Bot Backend API!"}

# --- Bot Control Endpoints ---
@app.get("/api/bot/status", response_model=schemas.BotStatus, tags=["Bot Control"])
def get_bot_status():
    return bot_status

@app.post("/api/bot/start", response_model=schemas.ResponseMessage, tags=["Bot Control"])
def start_bot(background_tasks: BackgroundTasks):
    if bot_status["is_running"]:
        raise HTTPException(status_code=400, detail="Bot is already running.")
    bot_status["is_running"] = True
    background_tasks.add_task(bot_core.run_bot_cycle, bot_status)
    return {"message": "Zenith Bot has been started successfully."}

@app.post("/api/bot/stop", response_model=schemas.ResponseMessage, tags=["Bot Control"])
def stop_bot():
    if not bot_status["is_running"]:
        raise HTTPException(status_code=400, detail="Bot is not currently running.")
    bot_status["is_running"] = False
    return {"message": "Stopping signal sent. The bot will stop after its current cycle."}

# --- Informational Endpoints ---
@app.get("/api/exchanges/supported", response_model=List[str], tags=["Info"])
def get_supported_exchanges():
    return SUPPORTED_EXCHANGES

@app.get("/api/exchange/markets", response_model=List[str], tags=["Info"])
async def get_available_markets(exchange_name: str): # <-- মূল পরিবর্তন: def -> async def
    """একটি নির্দিষ্ট এক্সচেঞ্জের সমস্ত উপলব্ধ ট্রেডিং পেয়ারের তালিকা প্রদান করে।"""
    try:
        # exchange_manager-কে কল করার সময় await যোগ করা হয়েছে
        markets = await exchange_manager.get_all_markets(exchange_name)
        return markets
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.get("/api/timeframes/supported", response_model=List[str], tags=["Info"])
def get_supported_timeframes():
    return SUPPORTED_TIMEFRAMES

# --- Strategy Management Endpoints ---
@app.get("/api/strategies/list", response_model=List[str], tags=["Strategies"])
def get_strategies():
    """সমস্ত উপলব্ধ ডিফল্ট এবং আপলোড করা স্ট্র্যাটেজির একটি তালিকা প্রদান করে।"""
    try:
        return strategy_manager.get_available_strategies()
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error fetching strategies")

@app.get("/api/strategies/params/{strategy_name}", response_model=List[Dict[str, Any]], tags=["Strategies"])
def get_params_for_strategy(strategy_name: str):
    try:
        return strategy_manager.get_strategy_params(strategy_name)
    except ImportError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {e}")

@app.post("/api/strategies/upload", response_model=schemas.ResponseMessage, tags=["Strategies"])
async def upload_strategy(file: UploadFile = File(...)):
    try:
        message = strategy_manager.save_strategy_file(file)
        return {"message": message}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {e}")

# --- Data and Backtesting Endpoints ---
@app.get("/api/trades", response_model=List[schemas.Trade], tags=["Data"])
def read_trades(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_trades(db, skip=skip, limit=limit)

@app.get("/api/performance-stats", response_model=schemas.PerformanceStats, tags=["Data"])
def get_performance_stats(db: Session = Depends(get_db)):
    # This is a placeholder, you might want to implement a real calculation
    return schemas.PerformanceStats(total_pnl=0.0, spot_pnl=0.0, futures_pnl=0.0, win_rate=0.0)

@app.post("/api/backtest/run", response_model=schemas.BacktestResult, tags=["Backtesting"])
async def run_backtest(request: schemas.BacktestRequest):
    try:
        result_data = await backtesting_engine.run_simulation(
            exchange_name=request.exchange_name,
            strategy_name=request.strategy_name,
            symbol=request.symbol,
            timeframe=request.timeframe,
            start_date=request.start_date,
            end_date=request.end_date,
            strategy_params=request.strategy_params
        )
        return result_data
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An internal server error occurred during backtest: {e}")

# --- Optimization Endpoints ---
@app.post("/api/optimizer/start", response_model=Dict[str, str], tags=["Optimizer"])
def start_optimization(request: schemas.OptimizerRequest, background_tasks: BackgroundTasks):
    try:
        job_id = optimizer_engine.start_optimization_job(background_tasks, request.dict())
        return {"job_id": job_id}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to start optimization job: {e}")

@app.get("/api/optimizer/status/{job_id}", response_model=schemas.JobStatus, tags=["Optimizer"])
def get_optimization_status(job_id: str):
    job = optimizer_engine.JOBS_DB.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    # job is a dict, so we must add job_id to it for it to match the schema
    response_data = job.copy()
    response_data['job_id'] = job_id
    return response_data
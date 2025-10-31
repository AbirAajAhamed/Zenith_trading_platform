# app/services/optimizer_engine.py

import uuid
import itertools
from typing import Dict, Any, List
from fastapi import BackgroundTasks
import numpy as np

from . import backtesting_engine
from . import strategy_manager

# --- ইন-মেমরি জব স্টোরেজ (প্রোডাকশনের জন্য Redis বা ডাটাবেস ভালো বিকল্প) ---
# এটি একটি সাধারণ ডিকশনারি যা প্রতিটি অপটিমাইজেশন জবের অবস্থা ট্র্যাক করবে।
JOBS_DB: Dict[str, Dict[str, Any]] = {}

def _generate_param_combinations(params_range: Dict[str, Dict[str, Any]]) -> List[Dict[str, Any]]:
    """প্যারামিটারের রেঞ্জ থেকে সমস্ত সম্ভাব্য কম্বিনেশন তৈরি করে।"""
    
    keys = params_range.keys()
    value_ranges = []
    
    for key, values in params_range.items():
        start = values['start']
        end = values['end']
        step = values['step']
        param_type = values['type']
        
        # int বা float-এর জন্য রেঞ্জ তৈরি
        if param_type in ['integer', 'float']:
            if step == 0: # একটিমাত্র ভ্যালু
                value_ranges.append([start])
            else:
                # np.arange ফ্লোট স্টেপের জন্য দারুণ কাজ করে
                value_ranges.append(np.arange(start, end + step, step))
        else: # string-এর জন্য, আপাতত শুধুমাত্র start ভ্যালুটিই ব্যবহার করা হবে
             value_ranges.append([start])

    # itertools.product ব্যবহার করে সবগুলোর কার্টেসিয়ান প্রোডাক্ট তৈরি করা
    combinations = list(itertools.product(*value_ranges))
    
    # প্রতিটি কম্বিনেশনকে একটি সুন্দর ডিকশনারিতে পরিণত করা
    param_dicts = [dict(zip(keys, combo)) for combo in combinations]
    
    return param_dicts


async def run_optimization_worker(job_id: str, request_data: Dict[str, Any]):
    """
    এটি হলো আসল কর্মী, যা ব্যাকগ্রাউন্ডে চলবে এবং এক এক করে ব্যাকটেস্ট চালাবে।
    """
    print(f"Starting optimization worker for job_id: {job_id}")
    JOBS_DB[job_id]['status'] = 'running'
    
    try:
        # প্যারামিটার কম্বিনেশন তৈরি করা
        param_combinations = _generate_param_combinations(request_data['strategy_params_range'])
        total_runs = len(param_combinations)
        JOBS_DB[job_id]['total_runs'] = total_runs
        results = []

        for i, params in enumerate(param_combinations):
            print(f"Running backtest {i+1}/{total_runs} with params: {params}")
            JOBS_DB[job_id]['progress'] = i + 1
            
            try:
                # ব্যাকটেস্টিং ইঞ্জিনকে প্রতিটি কম্বিনেশনের জন্য কল করা
                result = await backtesting_engine.run_simulation(
                    exchange_name=request_data['exchange_name'],
                    strategy_name=request_data['strategy_name'],
                    symbol=request_data['symbol'],
                    timeframe=request_data['timeframe'],
                    start_date=request_data['start_date'],
                    end_date=request_data['end_date'],
                    strategy_params=params
                )
                
                # শুধুমাত্র মূল মেট্রিক্সগুলো সংরক্ষণ করা
                results.append({
                    "params": params,
                    "total_return": result.total_return,
                    "win_rate": result.win_rate,
                    "max_drawdown": result.max_drawdown
                })
            except Exception as e:
                print(f"Backtest failed for params {params}: {e}")
                # একটি রান ব্যর্থ হলে অপটিমাইজেশন বন্ধ হবে না, পরেরটি চলবে

        # ফলাফলকে Total Return অনুযায়ী সাজানো (সেরা থেকে খারাপ)
        sorted_results = sorted(results, key=lambda x: x['total_return'], reverse=True)
        
        JOBS_DB[job_id]['results'] = sorted_results
        JOBS_DB[job_id]['status'] = 'completed'
        print(f"Optimization job {job_id} completed successfully.")

    except Exception as e:
        JOBS_DB[job_id]['status'] = 'failed'
        JOBS_DB[job_id]['error'] = str(e)
        print(f"Optimization job {job_id} failed: {e}")


def start_optimization_job(background_tasks: BackgroundTasks, request_data: Dict[str, Any]) -> str:
    """একটি নতুন অপটিমাইজেশন জব শুরু করে এবং জব আইডি প্রদান করে।"""
    job_id = str(uuid.uuid4())
    
    # জব ডাটাবেসে প্রাথমিক অবস্থা সেট করা
    JOBS_DB[job_id] = {
        "status": "pending",
        "progress": 0,
        "total_runs": 0,
        "results": None,
        "error": None
    }
    
    # FastAPI-এর BackgroundTasks ব্যবহার করে worker-কে ব্যাকগ্রাউন্ডে চালানো
    background_tasks.add_task(run_optimization_worker, job_id, request_data)
    
    print(f"Job {job_id} has been queued.")
    return job_id
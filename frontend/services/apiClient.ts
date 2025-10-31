// frontend/services/apiClient.ts (সম্পূর্ণ এবং অপটিমাইজেশন-সহ আপডেট করা)

// --- ডেটা টাইপ ইম্পোর্ট করা ---
import { BacktestResult, BotStatus, Trade, PerformanceStats } from '../types';

// আমাদের FastAPI সার্ভারের ঠিকানা
const API_BASE_URL = 'http://localhost:8000/api'; 

// ==============================================================================
//  টাইপ এবং ইন্টারফেস (Types and Interfaces)
// ==============================================================================

export interface StrategyParamDef {
    name: string;
    type: 'integer' | 'float' | 'string';
    default: number | string;
    label: string;
}

export interface BacktestParams {
  exchange_name: string;
  strategy_name: string;
  symbol: string;
  timeframe: string;
  start_date: string;
  end_date: string;
  strategy_params: { [key: string]: any }; 
}

// --- অপটিমাইজেশনের জন্য নতুন টাইপ এবং ইন্টারফেস ---
export interface ParamRange {
    type: string;
    start: number;
    end: number;
    step: number;
}

export interface OptimizerRequest {
    exchange_name: string;
    strategy_name: string;
    symbol: string;
    timeframe: string;
    start_date: string;
    end_date: string;
    strategy_params_range: { [key: string]: ParamRange };
}

export interface JobStatus {
    job_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    total_runs: number;
    error?: string;
}

export interface OptimizationResult extends JobStatus {
    results?: any[]; // ফলাফল নির্দিষ্ট টাইপের হতে পারে
}


// ==============================================================================
//  UI-এর জন্য তথ্য আনা (Informational API Functions for UI)
// ==============================================================================

export const getSupportedExchanges = async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/exchanges/supported`);
    if (!response.ok) throw new Error('Failed to fetch supported exchanges');
    return await response.json();
};

export const getAvailableMarkets = async (exchangeName: string): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/exchange/markets?exchange_name=${exchangeName}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch markets for ${exchangeName}`);
    }
    return await response.json();
};

export const getSupportedTimeframes = async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/timeframes/supported`);
    if (!response.ok) throw new Error('Failed to fetch supported timeframes');
    return await response.json();
};

// ==============================================================================
//  স্ট্র্যাটেজি ম্যানেজমেন্ট API ফাংশন (Strategy Management API Functions)
// ==============================================================================

export const getAvailableStrategies = async (): Promise<string[]> => {
    const response = await fetch(`${API_BASE_URL}/strategies/list`);
    if (!response.ok) throw new Error('Failed to fetch available strategies');
    return await response.json();
};

export const uploadStrategy = async (file: File): Promise<{ status: string, message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE_URL}/strategies/upload`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'File upload failed');
    }
    return await response.json();
};

export const getStrategyParams = async (strategyName: string): Promise<StrategyParamDef[]> => {
    const encodedStrategyName = encodeURIComponent(strategyName);
    const response = await fetch(`${API_BASE_URL}/strategies/params/${encodedStrategyName}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to fetch parameters for ${strategyName}`);
    }
    return await response.json();
};

// ==============================================================================
//  বিদ্যমান API ফাংশন (Existing API Functions - Corrected)
// ==============================================================================

export const getBotStatus = async (): Promise<BotStatus> => {
    const response = await fetch(`${API_BASE_URL}/bot/status`);
    if (!response.ok) throw new Error('Failed to fetch bot status');
    return await response.json();
};

export const startBot = async (): Promise<{ status: string; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/bot/start`, { method: 'POST' });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start the bot');
    }
    return await response.json();
};

export const stopBot = async (): Promise<{ status:string; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/bot/stop`, { method: 'POST' });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to stop the bot');
    }
    return await response.json();
};

export const getTradeHistory = async (): Promise<Trade[]> => {
    const response = await fetch(`${API_BASE_URL}/trades`);
    if (!response.ok) throw new Error('Failed to fetch trade history');
    return await response.json();
};

export const getPerformanceStats = async (): Promise<PerformanceStats> => {
    const response = await fetch(`${API_BASE_URL}/performance-stats`);
    if (!response.ok) throw new Error('Failed to fetch performance stats');
    return await response.json();
};

// ==============================================================================
//  আপডেট করা runBacktest ফাংশন (Updated runBacktest Function)
// ==============================================================================

export const runBacktest = async (params: BacktestParams): Promise<BacktestResult> => {
  const response = await fetch(`${API_BASE_URL}/backtest/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'An unknown error occurred while running the backtest.');
  }
  return await response.json();
};

// ==============================================================================
//  অপটিমাইজেশন ইঞ্জিন API ফাংশন (Optimization Engine API Functions)
// ==============================================================================

/**
 * একটি নতুন প্যারামিটার অপটিমাইজেশন জব শুরু করে।
 * @param params অপটিমাইজেশন অনুরোধের জন্য ডেটা।
 * @returns একটি প্রমিস যা জব আইডি সহ একটি অবজেক্টে রিজলভ হয়।
 */
export const startOptimization = async (params: OptimizerRequest): Promise<{ job_id: string }> => {
    const response = await fetch(`${API_BASE_URL}/optimizer/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start optimization job');
    }
    return await response.json();
};

/**
 * একটি নির্দিষ্ট অপটিমাইজেশন জবের বর্তমান অবস্থা নিয়ে আসে।
 * @param jobId জবের আইডি।
 * @returns একটি প্রমিস যা জবের স্ট্যাটাসে রিজলভ হয়।
 */
export const getOptimizationStatus = async (jobId: string): Promise<JobStatus> => {
    const response = await fetch(`${API_BASE_URL}/optimizer/status/${jobId}`);
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch job status');
    }
    return await response.json();
};

/**
 * একটি সম্পন্ন হওয়া অপটিমাইজেশন জবের চূড়ান্ত ফলাফল নিয়ে আসে।
 * @param jobId জবের আইডি।
 * @returns একটি প্রমিস যা চূড়ান্ত ফলাফলে রিজলভ হয়।
 */
export const getOptimizationResults = async (jobId: string): Promise<OptimizationResult> => {
    const response = await fetch(`${API_BASE_URL}/optimizer/results/${jobId}`);
    if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.detail || 'Failed to fetch job results');
    }
    return await response.json();
};
// frontend/types.ts (সম্পূর্ণ এবং সঠিক সংস্করণ)

// --- কোর বট এবং ডেটা টাইপ ---

export interface BotStatus {
  is_running: boolean;
  strategy_name?: string;
  symbol?: string;
}

export interface Trade {
    id: number;
    symbol: string;
    order_type: string;
    amount: number;
    price: number;
    timestamp: string;
}

export interface PerformanceStats {
    total_pnl: number;
    win_rate: number;
    // Add other stats if needed
}

// --- ব্যাকটেস্টিং এবং ভিজ্যুয়ালাইজেশন টাইপ ---

export interface CandleData {
  timestamp: string; // বা Date
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface TradeLog {
  timestamp: string; // বা Date
  order_type: 'BUY' | 'SELL';
  price: number;
}

export interface BacktestResultHistory {
    name: string;
    value: number;
}

export interface BacktestResult {
    total_return: number;
    win_rate: number;
    max_drawdown: number;
    sharpe_ratio: number;
    history: BacktestResultHistory[];
    price_history: CandleData[];
    trade_logs: TradeLog[];
}


// --- স্ট্র্যাটেজি, প্যারামিটার এবং অপটিমাইজেশন টাইপ ---

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
    results?: any[];
}
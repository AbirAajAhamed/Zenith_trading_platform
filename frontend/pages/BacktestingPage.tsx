// frontend/pages/BacktestingPage.tsx (চূড়ান্ত, সম্পূর্ণ এবং কার্যকরী সংস্করণ)

import React, { useState, useEffect, useCallback, useRef } from 'react';

// UI and Chart Components
import Card from '../components/ui/Card';
import PnLCard from '../components/Dashboard/PnLCard';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import SearchableDropdown from '../components/ui/SearchableDropdown';
import PriceChart from '../components/Dashboard/PriceChart';
import StrategyUpload from '../components/Dashboard/StrategyUpload';
import OptimizationResultsTable from '../components/Dashboard/OptimizationResultsTable';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// API Client Functions and Types
import { 
    getSupportedExchanges, getAvailableMarkets, getSupportedTimeframes, getAvailableStrategies,
    getStrategyParams, runBacktest, startOptimization, getOptimizationStatus, getOptimizationResults
} from '../services/apiClient';
import type { 
    BacktestResult, StrategyParamDef, OptimizerRequest, JobStatus, OptimizationResult, BacktestParams 
} from '../types';

const BacktestingPage: React.FC = () => {
    // --- STATE MANAGEMENT ---
    const [mode, setMode]                   = useState<'single' | 'optimize'>('single');
    const [exchanges, setExchanges]         = useState<string[]>([]);
    const [markets, setMarkets]             = useState<string[]>([]);
    const [timeframes, setTimeframes]       = useState<string[]>([]);
    const [strategies, setStrategies]       = useState<string[]>([]);
    const [selectedExchange, setSelectedExchange] = useState<string>('');
    const [selectedMarket, setSelectedMarket] = useState<string>('');
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>('');
    const [selectedStrategy, setSelectedStrategy] = useState<string>('');
    const [startDate, setStartDate] = useState('2023-01-01');
    const [endDate, setEndDate]     = useState(new Date().toISOString().split('T')[0]); // আজকের তারিখ পর্যন্ত ডিফল্ট
    const [strategyParams, setStrategyParams] = useState<StrategyParamDef[]>([]);
    const [paramValues, setParamValues]   = useState<{ [key: string]: any }>({});
    const [paramRanges, setParamRanges]   = useState<{ [key: string]: { start: any; end: any; step: any } }>({});
    const [result, setResult]             = useState<BacktestResult | null>(null);
    const [error, setError]               = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isJobRunning, setIsJobRunning] = useState(false);
    const [isMarketLoading, setIsMarketLoading] = useState(false);
    const [isParamsLoading, setIsParamsLoading] = useState(false);
    const [jobId, setJobId]               = useState<string | null>(null);
    const [jobStatus, setJobStatus]       = useState<JobStatus | null>(null);
    const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
    const jobStatusInterval               = useRef<NodeJS.Timeout | null>(null);

    // --- DATA FETCHING & STATE CHANGES ---
    const fetchStrategies = useCallback(async (shouldSelectFirst = false) => {
        try {
            const fetchedStrategies = await getAvailableStrategies();
            setStrategies(fetchedStrategies);
            if (shouldSelectFirst && fetchedStrategies.length > 0) {
                setSelectedStrategy(fetchedStrategies[0]);
            }
        } catch (err) { setError("Failed to load strategies."); }
    }, []);

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsInitialLoading(true);
            setError(null);
            try {
                const [excs, tfs, strats] = await Promise.all([ getSupportedExchanges(), getSupportedTimeframes(), getAvailableStrategies() ]);
                setExchanges(excs); if (excs.length > 0) setSelectedExchange(excs[0]);
                setTimeframes(tfs); if (tfs.length > 0) { const defaultTf = tfs.includes('1d') ? '1d' : tfs[0]; setSelectedTimeframe(defaultTf); }
                setStrategies(strats); if (strats.length > 0) setSelectedStrategy(strats[0]);
            } catch(err: any) { setError(`Failed to load page data: ${err.message}. Please ensure the backend is running.`); } 
            finally { setIsInitialLoading(false); }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedExchange) return;
        const fetchMarkets = async () => {
            setIsMarketLoading(true); setMarkets([]); setSelectedMarket('');
            try {
                const fetchedMarkets = await getAvailableMarkets(selectedExchange);
                setMarkets(fetchedMarkets);
                const defaultMarket = fetchedMarkets.find(m => m === 'BTC/USDT') || fetchedMarkets[0];
                setSelectedMarket(defaultMarket || '');
            } catch (err: any) { setError(`Failed to load markets: ${err.message}`); } 
            finally { setIsMarketLoading(false); }
        };
        fetchMarkets();
    }, [selectedExchange]);

    useEffect(() => {
        if (!selectedStrategy) return;
        const fetchParams = async () => {
            setIsParamsLoading(true); setStrategyParams([]); setParamValues({}); setParamRanges({});
            try {
                const params = await getStrategyParams(selectedStrategy);
                setStrategyParams(params);
                const defaults = params.reduce((acc, p) => ({ ...acc, [p.name]: p.default }), {} as any);
                setParamValues(defaults);
                const defaultRanges = params.reduce((acc, p) => ({ ...acc, [p.name]: { start: p.default, end: p.default, step: 0 } }), {} as any);
                setParamRanges(defaultRanges);
            } catch (err: any) { setError(`Failed to load params: ${err.message}`); } 
            finally { setIsParamsLoading(false); }
        };
        fetchParams();
    }, [selectedStrategy]);

    useEffect(() => {
        const pollStatus = async () => {
            if (!jobId) return;
            try {
                const status = await getOptimizationStatus(jobId);
                setJobStatus(status);
                if (status.status === 'completed' || status.status === 'failed') {
                    if (jobStatusInterval.current) clearInterval(jobStatusInterval.current);
                    setIsJobRunning(false);
                    if (status.status === 'completed') {
                        const finalResults = await getOptimizationResults(jobId);
                        setOptimizationResult(finalResults);
                    }
                }
            } catch (error) { 
                setError("Failed to get job status.");
                if (jobStatusInterval.current) clearInterval(jobStatusInterval.current);
                setIsJobRunning(false);
            }
        };
        if (jobId && ['pending', 'running'].includes(jobStatus?.status || '')) {
            jobStatusInterval.current = setInterval(pollStatus, 3000);
        }
        return () => { if (jobStatusInterval.current) clearInterval(jobStatusInterval.current); };
    }, [jobId, jobStatus?.status]);

    const handleParamChange = (name: string, type: string, value: string) => {
        let pVal: any = value;
        if (type === 'integer') pVal = parseInt(value, 10);
        else if (type === 'float') pVal = parseFloat(value);
        if(isNaN(pVal)) pVal = 0;
        setParamValues(prev => ({ ...prev, [name]: pVal }));
    };

    const handleRangeChange = (name: string, field: 'start'|'end'|'step', value: string) => {
        const pVal = parseFloat(value);
        setParamRanges(prev => ({...prev, [name]: { ...(prev[name] || {}), [field]: isNaN(pVal) ? 0 : pVal }}));
    };
    
    const handleFormSubmit = () => {
        setError(null); setResult(null); setJobId(null); setJobStatus(null); setOptimizationResult(null);
        if (mode === 'single') handleRunBacktest(); else handleRunOptimization();
    };

    const handleRunBacktest = async () => {
        setIsJobRunning(true);
        const params: BacktestParams = {
            exchange_name: selectedExchange, strategy_name: selectedStrategy,
            symbol: selectedMarket, timeframe: selectedTimeframe,
            start_date: startDate, end_date: endDate, strategy_params: paramValues,
        };
        try { const res = await runBacktest(params); setResult(res); } 
        catch (err: any) { setError(err.message || 'Backtest failed.'); } 
        finally { setIsJobRunning(false); }
    };

    const handleRunOptimization = async () => {
        setIsJobRunning(true);
        const strategyParamsRange = Object.keys(paramRanges).reduce((acc, key) => {
            const pDef = strategyParams.find(p => p.name === key);
            acc[key] = { ...paramRanges[key], type: pDef?.type || 'float' }; return acc;
        }, {} as OptimizerRequest['strategy_params_range']);
        const params: OptimizerRequest = {
            exchange_name: selectedExchange, strategy_name: selectedStrategy,
            symbol: selectedMarket, timeframe: selectedTimeframe,
            start_date: startDate, end_date: endDate, strategy_params_range: strategyParamsRange,
        };
        try {
            const { job_id } = await startOptimization(params);
            setJobId(job_id); setJobStatus({ job_id, status: 'pending', progress: 0, total_runs: 0 });
        } catch (err: any) { setError(err.message || 'Failed to start optimization.'); setIsJobRunning(false); }
    };
    
    const handleUploadSuccess = () => fetchStrategies(true);

    // --- JSX RENDERING ---
    const defaultInputClass = "block w-full text-sm mt-1 pl-3 pr-2 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500";
    
    if (isInitialLoading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading Backtesting Engine...</div>;
    
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Backtesting Engine</h1>
            <Card title="Configuration">
                 <div className="space-y-6">
                    <div className="flex items-center justify-center space-x-4">
                        <span className={`font-medium ${mode === 'single' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-500'}`}>Single Backtest</span>
                        <ToggleSwitch enabled={mode === 'optimize'} onChange={val => setMode(val ? 'optimize' : 'single')} />
                        <span className={`font-medium ${mode === 'optimize' ? 'text-indigo-500 dark:text-indigo-400' : 'text-gray-500'}`}>Optimization</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end border-t border-gray-200 dark:border-gray-700 pt-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Strategy</label>
                            <select value={selectedStrategy} onChange={e => setSelectedStrategy(e.target.value)} className={defaultInputClass} disabled={isJobRunning}>{strategies.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Exchange</label>
                            <select value={selectedExchange} onChange={e => setSelectedExchange(e.target.value)} className={defaultInputClass} disabled={isJobRunning}>{exchanges.map(ex => <option key={ex} value={ex}>{ex.charAt(0).toUpperCase() + ex.slice(1)}</option>)}</select>
                        </div>
                        <div className="lg:col-span-2">
                             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Asset</label>
                             <SearchableDropdown options={markets} value={selectedMarket} onChange={setSelectedMarket} placeholder={isMarketLoading ? "Loading..." : "Search asset"} disabled={isMarketLoading || isJobRunning} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Timeframe</label>
                            <select value={selectedTimeframe} onChange={e => setSelectedTimeframe(e.target.value)} className={defaultInputClass} disabled={isJobRunning}>{timeframes.map(tf => <option key={tf} value={tf}>{tf}</option>)}</select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={defaultInputClass} disabled={isJobRunning} />
                        </div>
                         <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={defaultInputClass} disabled={isJobRunning} />
                        </div>
                    </div>
                     {(isParamsLoading || strategyParams.length > 0) && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-2">Strategy Parameters ({selectedStrategy})</h4>
                            {isParamsLoading ? <p className="text-gray-500">Loading parameters...</p> : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {strategyParams.map(param => (
                                        <div key={param.name}>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{param.label}</label>
                                            {mode === 'single' ? (
                                                <input type={param.type === 'string' ? 'text' : 'number'} step={param.type === 'float' ? '0.01' : '1'} value={paramValues[param.name] ?? ''} onChange={(e) => handleParamChange(param.name, param.type, e.target.value)} className={defaultInputClass} disabled={isJobRunning} />
                                            ) : (
                                                <div className="grid grid-cols-3 gap-2 mt-1">
                                                     {['start', 'end', 'step'].map(field => (<input key={field} type="number" placeholder={field.charAt(0).toUpperCase() + field.slice(1)} step={param.type === 'float' ? '0.01' : '1'} value={paramRanges[param.name]?.[field] ?? ''} onChange={e => handleRangeChange(param.name, field as any, e.target.value)} className={`${defaultInputClass} text-center p-2`} disabled={isJobRunning} />))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                    <StrategyUpload onUploadSuccess={handleUploadSuccess} />
                    <div className="text-right mt-4">
                         <button onClick={handleFormSubmit} disabled={isJobRunning || !selectedMarket || !selectedStrategy} className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 dark:disabled:bg-gray-600">
                             {isJobRunning ? (mode === 'single' ? 'Running...' : `Optimizing... (${jobStatus?.progress || 0}/${jobStatus?.total_runs || '?'})`) : (mode === 'single' ? 'Run Backtest' : 'Run Optimization')}
                         </button>
                    </div>
                </div>
            </Card>
            
            <div className="space-y-6 mt-6">
                {error && <Card title="An Error Occurred"><p className="text-red-500 text-center py-4">{error}</p></Card>}
                
                {mode === 'single' && isJobRunning && !result && <Card><div className="text-center p-8 text-gray-400">Running Single Backtest... Please wait.</div></Card>}
                {mode === 'single' && result && (
                    <div className="space-y-6">
                        <Card title="Backtest Results"><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                            <PnLCard title="Total Return" value={`${result.total_return.toFixed(2)}%`} change={result.total_return} description="Net return over the period" />
                            <PnLCard title="Win Rate" value={`${result.win_rate.toFixed(2)}%`} change={result.win_rate} description="Percentage of profitable trades" />
                            <PnLCard title="Max Drawdown" value={`${result.max_drawdown.toFixed(2)}%`} change={result.max_drawdown} description="Largest peak-to-trough decline" />
                            <PnLCard title="Sharpe Ratio" value={result.sharpe_ratio.toFixed(2)} change={result.sharpe_ratio} description="Risk-adjusted return" />
                        </div></Card>
                        <PriceChart price_history={result.price_history} trade_logs={result.trade_logs} />
                        <Card title="Portfolio Performance"><div className="h-80 w-full"><ResponsiveContainer>
                            <AreaChart data={result.history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}><defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/><stop offset="95%" stopColor="#8884d8" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" /><XAxis dataKey="name" stroke="rgb(156 163 175)" tick={{ fontSize: 12 }} /><YAxis stroke="rgb(156 163 175)" domain={['auto', 'auto']} tickFormatter={(v) => `$${Number(v).toLocaleString()}`} /><Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', borderColor: '#4f46e5' }} labelStyle={{ color: '#d1d5db' }} formatter={(v: number) => `$${v.toLocaleString()}`} /><Area type="monotone" dataKey="value" stroke="#8884d8" fillOpacity={1} fill="url(#colorValue)" /></AreaChart>
                        </ResponsiveContainer></div></Card>
                    </div>
                )}

                {mode === 'optimize' && (jobStatus || optimizationResult) && (
                    <div className="space-y-6">
                        {isJobRunning && <Card title="Optimization in Progress..."><div className="text-center p-8 space-y-2"><p>Status: {jobStatus?.status}</p>{jobStatus?.status === 'running' && <p>Progress: {jobStatus.progress} / {jobStatus.total_runs}</p>}</div></Card>}
                        {optimizationResult && <OptimizationResultsTable results={optimizationResult.results || []} />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BacktestingPage;
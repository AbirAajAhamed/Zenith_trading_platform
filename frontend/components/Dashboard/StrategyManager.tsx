
import React, { useState, useRef } from 'react';
import { Strategy, AssetClass } from '../../types';
import Card from '../ui/Card';
import ToggleSwitch from '../ui/ToggleSwitch';

const initialStrategies: Strategy[] = [
    { id: 's1', name: 'RSI Momentum', description: 'RSI overbought/oversold strategy for volatile pairs.', assetClass: AssetClass.CRYPTO, parameters: { length: 14, overbought: 70, oversold: 30 }, isActive: true },
    { id: 's2', name: 'MACD Crossover', description: 'Trades on MACD line and signal line crossovers.', assetClass: AssetClass.STOCKS, parameters: { fast: 12, slow: 26, signal: 9 }, isActive: false },
    { id: 's3', name: 'Bollinger Bands Squeeze', description: 'Identifies low volatility for breakout trades.', assetClass: AssetClass.FOREX, parameters: { length: 20, stdDev: 2 }, isActive: true },
    { id: 's4', name: 'Gold Momentum', description: 'Trend-following strategy for Gold futures.', assetClass: AssetClass.COMMODITIES, parameters: { ma_short: 50, ma_long: 200 }, isActive: true },
];

interface StrategyManagerProps {
    selectedAsset: AssetClass;
}

const StrategyManager: React.FC<StrategyManagerProps> = ({ selectedAsset }) => {
    const [strategies, setStrategies] = useState<Strategy[]>(initialStrategies);
    const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
    const [editedParams, setEditedParams] = useState<{ [key: string]: string | number }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleToggle = (id: string) => {
        setStrategies(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
    };
    
    const handleEditClick = (strategy: Strategy) => {
        setEditingStrategyId(strategy.id);
        setEditedParams(strategy.parameters);
    };

    const handleCancelEdit = () => {
        setEditingStrategyId(null);
        setEditedParams({});
    };

    const handleSaveEdit = (id: string) => {
        setStrategies(prev => prev.map(s => s.id === id ? { ...s, parameters: editedParams } : s));
        handleCancelEdit(); // Reset state
    };

    const handleParamChange = (key: string, value: string) => {
        const numValue = Number(value);
        setEditedParams(prev => ({
            ...prev,
            [key]: isNaN(numValue) || value.trim() === '' ? value : numValue
        }));
    };
    
    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.name.endsWith('.py')) {
              console.log('Selected file:', file.name);
              // Here you would typically handle the file upload to the backend
              alert(`Simulating upload for: ${file.name}`);
            } else {
              alert('Invalid file type. Please upload a .py file.');
            }
        }
         // Reset file input to allow re-uploading the same file
        if (event.target) {
            event.target.value = '';
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this strategy? This action is permanent.')) {
            setStrategies(prev => prev.filter(s => s.id !== id));
        }
    };

    const filteredStrategies = strategies.filter(s => s.assetClass === selectedAsset);

    return (
        <Card title="Strategy Management">
            <div className="space-y-4">
                {filteredStrategies.map(strategy => (
                    <div key={strategy.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600">
                       {editingStrategyId === strategy.id ? (
                            // Edit Form
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">{strategy.name}</h4>
                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {Object.keys(editedParams).map(key => (
                                        <div key={key}>
                                            <label htmlFor={`${strategy.id}-${key}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1')}
                                            </label>
                                            <input
                                                type="text"
                                                id={`${strategy.id}-${key}`}
                                                value={editedParams[key]}
                                                onChange={(e) => handleParamChange(key, e.target.value)}
                                                className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-white"
                                            />
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-end space-x-2">
                                    <button onClick={handleCancelEdit} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                                        Cancel
                                    </button>
                                    <button onClick={() => handleSaveEdit(strategy.id)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition">
                                        Save
                                    </button>
                                </div>
                            </div>
                       ) : (
                            // Display View
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                                <div className="flex-grow">
                                    <div className="flex items-center">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{strategy.name}</h4>
                                        <span className="ml-2 px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">{strategy.assetClass}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{strategy.description}</p>
                                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                                        {Object.entries(strategy.parameters).map(([key, value]) => (
                                            <div key={key} className="text-xs text-gray-600 dark:text-gray-400">
                                                <span className="font-semibold capitalize text-gray-700 dark:text-gray-300">{key.replace(/([A-Z])/g, ' $1')}: </span>
                                                <span>{value.toString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-4 sm:mt-0 sm:ml-6 flex items-center space-x-4 flex-shrink-0">
                                    <ToggleSwitch enabled={strategy.isActive} onChange={() => handleToggle(strategy.id)} />
                                    <button onClick={() => handleEditClick(strategy)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 text-sm font-medium">Edit</button>
                                    <button onClick={() => handleDelete(strategy.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 text-sm font-medium">Delete</button>
                                </div>
                            </div>
                       )}
                    </div>
                ))}
                 <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".py" className="hidden" />
                 <button onClick={handleUploadClick} className="mt-4 w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload New Strategy
                </button>
            </div>
        </Card>
    );
};

export default StrategyManager;
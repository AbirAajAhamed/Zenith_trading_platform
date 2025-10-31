// frontend/components/Dashboard/TradeHistoryTable.tsx

import React, { useState, useEffect } from 'react';
import { getTradeHistory } from '../../services/apiClient';

interface Trade {
    id: number;
    symbol: string;
    order_type: string; // 'BUY' or 'SELL'
    amount: number;
    price: number;
    timestamp: string;
}

const TradeHistoryTable = () => {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchTrades = async () => {
            try {
                const data = await getTradeHistory();
                setTrades(data);
            } catch (error) {
                console.error("Error fetching trade history:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrades();
        // তুমি চাইলে এখানেও একটি ইন্টারভাল সেট করতে পারো যাতে ট্রেড টেবিল রিফ্রেশ হয়
        const interval = setInterval(fetchTrades, 15000); // প্রতি 15 সেকেন্ড
        return () => clearInterval(interval);

    }, []);

    if (isLoading) {
        return <div className="text-center p-4">Loading Trade History...</div>;
    }

    return (
        <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">Trade History</h3>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-gray-400 border-b border-gray-700">
                            <th className="p-3">Symbol</th>
                            <th className="p-3">Type</th>
                            <th className="p-3">Side</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Price</th>
                            <th className="p-3">Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trades.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center p-4 text-gray-500">
                                    No trades found. Start the bot to record trades.
                                </td>
                            </tr>
                        ) : (
                            trades.map((trade) => (
                                <tr key={trade.id} className="border-b border-gray-800 hover:bg-gray-700/50">
                                    <td className="p-3">{trade.symbol}</td>
                                    <td className="p-3">Market</td>
                                    <td className={`p-3 font-semibold ${trade.order_type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                                        {trade.order_type}
                                    </td>
                                    <td className="p-3">{trade.amount.toFixed(6)}</td>
                                    <td className="p-3">${trade.price.toLocaleString()}</td>
                                    <td className="p-3 text-sm text-gray-400">{new Date(trade.timestamp).toLocaleString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TradeHistoryTable;
// frontend/components/Dashboard/CryptoMarketOverview.tsx

import React, { useState, useEffect } from 'react';
import { getPerformanceStats } from '../../services/apiClient';

interface Stats {
    total_pnl: number;
    spot_pnl: number;
    futures_pnl: number;
    win_rate: number;
}

const StatCard = ({ title, value, isCurrency = true }) => {
    return (
        <div className="bg-gray-800/50 p-6 rounded-lg shadow-md">
            <h4 className="text-gray-400 text-sm font-medium">{title}</h4>
            <p className="text-3xl font-bold mt-2">
                {isCurrency ? `$${value.toLocaleString()}` : `${value}%`}
            </p>
        </div>
    );
};

const CryptoMarketOverview = () => {
    const [stats, setStats] = useState<Stats | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getPerformanceStats();
                setStats(data);
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };

        fetchStats();
        const interval = setInterval(fetchStats, 10000); // প্রতি 10 সেকেন্ডে রিফ্রেশ
        return () => clearInterval(interval);
    }, []);

    if (!stats) {
        return <div className="text-center p-4">Loading Performance Stats...</div>;
    }

    return (
        <div>
            <h3 className="text-xl font-bold mb-4">Crypto Market Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total P&L" value={stats.total_pnl} />
                <StatCard title="Spot P&L" value={stats.spot_pnl} />
                <StatCard title="Futures P&L" value={stats.futures_pnl} />
                <StatCard title="Win Rate" value={stats.win_rate} isCurrency={false} />
            </div>
        </div>
    );
};

export default CryptoMarketOverview;
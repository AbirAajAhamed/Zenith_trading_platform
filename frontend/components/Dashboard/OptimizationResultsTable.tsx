// frontend/components/Dashboard/OptimizationResultsTable.tsx

import React from 'react';
import Card from '../ui/Card'; // Card কম্পোনেন্ট ইম্পোর্ট করুন

interface OptimizationResultsTableProps {
    results: any[];
}

const OptimizationResultsTable: React.FC<OptimizationResultsTableProps> = ({ results }) => {
    if (!results || results.length === 0) return null;

    return (
        <Card title={`Optimization Results (Top ${results.slice(0, 10).length} shown)`}>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Parameters</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Return</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Win Rate</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Max Drawdown</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {results.slice(0, 10).map((res, index) => (
                            <tr key={index} className={index === 0 ? "bg-green-50 dark:bg-green-900/30" : ""}>
                                <td className="px-4 py-2 font-semibold text-gray-900 dark:text-white">{index + 1}</td>
                                <td className="px-4 py-2 font-mono text-xs text-gray-700 dark:text-gray-300">{JSON.stringify(res.params)}</td>
                                <td className={`px-4 py-2 text-right font-semibold ${res.total_return > 0 ? 'text-green-600' : 'text-red-500'}`}>{res.total_return.toFixed(2)}%</td>
                                <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{res.win_rate.toFixed(2)}%</td>
                                <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{res.max_drawdown.toFixed(2)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default OptimizationResultsTable;
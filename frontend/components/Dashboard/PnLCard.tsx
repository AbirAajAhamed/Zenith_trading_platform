
import React from 'react';
import Card from '../ui/Card';

interface PnLCardProps {
    title: string;
    value: string;
    change: number;
    description: string;
}

const PnLCard: React.FC<PnLCardProps> = ({ title, value, change, description }) => {
    const isPositive = change >= 0;
    const changeColor = isPositive ? 'text-green-500' : 'text-red-500';

    return (
        <Card>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
                 <div className={`flex items-center text-xs font-semibold ${changeColor}`}>
                     {isPositive ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                     ) : (
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                         </svg>
                     )}
                     <span>{Math.abs(change).toFixed(2)}%</span>
                 </div>
            </div>
            <div className="mt-1">
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
            </div>
        </Card>
    );
};

export default PnLCard;

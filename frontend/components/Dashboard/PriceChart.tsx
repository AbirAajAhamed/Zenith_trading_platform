// frontend/components/Dashboard/PriceChart.tsx (চূড়ান্ত সঠিক এবং একত্রিত সংস্করণ)

import React from 'react';
import Chart from 'react-apexcharts'; // <-- Suspense এবং React.lazy ছাড়া সরাসরি ইম্পোর্ট করা হচ্ছে
import { CandleData, TradeLog } from '../../types';

interface PriceChartProps {
    price_history: CandleData[];
    trade_logs: TradeLog[];
}

const PriceChart: React.FC<PriceChartProps> = ({ price_history, trade_logs }) => {
    
    // ApexCharts-এর জন্য ডেটা ফরম্যাট করার লজিক (অপরিবর্তিত)
    const series = [{
        name: 'Price',
        data: price_history.map(candle => ({
            x: new Date(candle.timestamp),
            y: [candle.open, candle.high, candle.low, candle.close]
        }))
    }];
    
    // ApexCharts-এর অপশন কনফিগার করার লজিক (উন্নত এবং একত্রিত)
    const options = {
        chart: {
            type: 'candlestick',
            height: 400,
            background: 'transparent',
            toolbar: { show: true },
            foreColor: '#ccc'
        },
        theme: {
            mode: 'dark'
        },
        title: {
            text: 'Asset Price with Buy/Sell Signals',
            align: 'left',
            style: {
                color: '#fff',
                fontSize: '16px'
            }
        },
        xaxis: {
            type: 'datetime',
            labels: { style: { colors: '#888' } }
        },
        yaxis: {
            tooltip: { enabled: true },
            labels: {
                style: { colors: '#888' },
                formatter: (val: number) => `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            }
        },
        annotations: {
            points: trade_logs.map(trade => ({
                x: new Date(trade.timestamp).getTime(),
                y: trade.price,
                marker: {
                    size: 6,
                    fillColor: trade.order_type === 'BUY' ? '#22c55e' : '#ef4444',
                    strokeColor: '#FFF',
                    strokeWidth: 2,
                    // --- আপনার পুরোনো কোডের সেরা অংশটি এখানে রাখা হয়েছে ---
                    shape: trade.order_type === 'BUY' ? 'circle' : 'square', 
                    radius: 2,
                },
                label: {
                    borderColor: 'transparent',
                    // --- উন্নত লেবেল পজিশনিং ---
                    offsetY: trade.order_type === 'BUY' ? 20 : -20, // BUY লেবেল নিচে, SELL লেবেল উপরে
                    style: {
                        color: '#fff',
                        background: trade.order_type === 'BUY' ? '#22c55e' : '#ef4444',
                        fontSize: '10px',
                        padding: { left: 5, right: 5, top: 2, bottom: 2 }
                    },
                    text: trade.order_type,
                }
            }))
        },
        tooltip: {
            theme: 'dark'
        }
    };
    
    // @ts-ignore ApexCharts-এর টাইপ সামঞ্জস্য করার জন্য
    return <Chart options={options} series={series} type="candlestick" height={400} />;
};

export default PriceChart;
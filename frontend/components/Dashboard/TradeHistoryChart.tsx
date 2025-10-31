
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../ui/Card';

interface TradeHistoryChartProps {
  data: { name: string; pnl: number }[];
}

const TradeHistoryChart: React.FC<TradeHistoryChartProps> = ({ data }) => {
  return (
    <Card title="Trade History Chart">
      <div className="h-80 w-full">
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
            <XAxis dataKey="name" stroke="rgb(156 163 175)" />
            <YAxis stroke="rgb(156 163 175)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(31, 41, 55, 0.8)',
                borderColor: '#4f46e5'
              }}
              labelStyle={{ color: '#d1d5db' }}
            />
            <Area type="monotone" dataKey="pnl" stroke="#8884d8" fillOpacity={1} fill="url(#colorPnl)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default TradeHistoryChart;
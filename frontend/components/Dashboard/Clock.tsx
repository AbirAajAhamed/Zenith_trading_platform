import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timerId);
    }, []);

    const seconds = time.getSeconds();
    const minutes = time.getMinutes();
    const hours = time.getHours();

    const secondDeg = (seconds / 60) * 360;
    const minuteDeg = ((minutes * 60 + seconds) / 3600) * 360;
    const hourDeg = ((hours * 3600 + minutes * 60 + seconds) / 43200) * 360;

    return (
        <div className="flex items-center space-x-4">
            <div className="relative w-10 h-10">
                <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500">
                    <div
                        className="absolute bottom-1/2 left-1/2 w-0.5 h-3 bg-gray-800 dark:bg-gray-200 origin-bottom"
                        style={{ transform: `translateX(-50%) rotate(${hourDeg}deg)` }}
                    />
                    <div
                        className="absolute bottom-1/2 left-1/2 w-0.5 h-4 bg-gray-800 dark:bg-gray-200 origin-bottom"
                        style={{ transform: `translateX(-50%) rotate(${minuteDeg}deg)` }}
                    />
                    <div
                        className="absolute bottom-1/2 left-1/2 w-px h-5 bg-red-500 origin-bottom"
                        style={{ transform: `translateX(-50%) rotate(${secondDeg}deg)` }}
                    />
                    <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-gray-800 dark:bg-gray-200 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                </div>
            </div>
            <div className="text-lg font-mono text-gray-800 dark:text-gray-200">
                {`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`}
            </div>
        </div>
    );
};

export default Clock;
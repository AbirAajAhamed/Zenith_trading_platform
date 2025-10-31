// frontend/components/Dashboard/BotControlPanel.tsx

import React, { useState, useEffect } from 'react';
import { getBotStatus, startBot, stopBot } from '../../services/apiClient';

// একটি টাইপ 정의 করা যাক, যা বটের স্ট্যাটাসের মতো দেখতে হবে
interface BotStatus {
    is_running: boolean;
    strategy_name: string | null;
    symbol: string | null;
}

const BotControlPanel = () => {
    const [status, setStatus] = useState<BotStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false); // বাটন ক্লিকের সময় লোডিং অবস্থা

    // স্ট্যাটাস রিফ্রেশ করার জন্য একটি ফাংশন
    const fetchStatus = async () => {
        try {
            const data = await getBotStatus();
            setStatus(data);
        } catch (error) {
            console.error("Error fetching status:", error);
            // একটি ফলব্যাক স্ট্যাটাস সেট করি, যদি API বন্ধ থাকে
            setStatus({ is_running: false, strategy_name: null, symbol: null });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStatus(); // কম্পোনেন্ট লোড হলে প্রথমবার স্ট্যাটাস আনবে
        const interval = setInterval(fetchStatus, 5000); // প্রতি ৫ সেকেন্ড পর পর স্ট্যাটাস রিফ্রেশ করবে
        return () => clearInterval(interval); // কম্পোনেন্ট আনমাউন্ট হলে ইন্টারভাল পরিষ্কার করবে
    }, []);

    const handleStart = async () => {
        if (window.confirm("Are you sure you want to start the bot?")) {
            setIsActionLoading(true);
            try {
                const result = await startBot();
                console.log(result.message);
                await fetchStatus(); // স্ট্যাটাস तुरंत রিফ্রেশ করবে
            } catch (error) {
                console.error("Error starting bot:", error);
                alert("Could not start the bot! Check console for errors.");
            } finally {
                setIsActionLoading(false);
            }
        }
    };
    
    const handleStop = async () => {
        if (window.confirm("Are you sure you want to stop the bot?")) {
            setIsActionLoading(true);
            try {
                const result = await stopBot();
                console.log(result.message);
                await fetchStatus(); // স্ট্যাটাস तुरंत রিফ্রেশ করবে
            } catch (error) {
                console.error("Error stopping bot:", error);
                alert("Could not stop the bot! Check console for errors.");
            } finally {
                setIsActionLoading(false);
            }
        }
    };
    

    if (isLoading) {
        return (
            <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg text-center">
                <h3 className="text-xl font-bold mb-4">Bot Control Panel</h3>
                <p>Loading Bot Status...</p>
            </div>
        );
    }

    const isRunning = status?.is_running ?? false;

    return (
        <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">Bot Control Panel</h3>
            <div className="flex items-center space-x-4">
                <span className="font-medium">Status:</span>
                <span 
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        isRunning ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                    }`}
                >
                    {isActionLoading ? 'Processing...' : (isRunning ? 'Running' : 'Stopped')}
                </span>
                <div className="flex-grow"></div>
                <button 
                    onClick={handleStart} 
                    disabled={isRunning || isActionLoading} 
                    className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    Start
                </button>
                <button 
                    onClick={handleStop} 
                    disabled={!isRunning || isActionLoading} 
                    className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                    Stop
                </button>
                <button 
                    disabled // Restart functionality pore add kora hobe
                    className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
                >
                    Restart
                </button>
            </div>
            {isRunning && status && (
                <div className="mt-4 text-sm text-gray-400">
                    <p>
                        <strong>Active Strategy:</strong> {status.strategy_name} | 
                        <strong> Trading Pair:</strong> {status.symbol}
                    </p>
                </div>
            )}
        </div>
    );
};

export default BotControlPanel;
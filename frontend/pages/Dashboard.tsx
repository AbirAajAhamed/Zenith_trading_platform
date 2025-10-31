// frontend/pages/DashboardPage.tsx

import React from 'react';

// আমাদের বানানো নতুন এবং পুরনো কম্পোনেন্টগুলো ইম্পোর্ট করা হচ্ছে
import CryptoMarketOverview from '../components/Dashboard/CryptoMarketOverview';
import BotControlPanel from '../components/Dashboard/BotControlPanel';
import TradeHistoryTable from '../components/Dashboard/TradeHistoryTable';

// তোমার ড্যাশবোর্ডের মূল পেজের ডিজাইন অনুযায়ী অন্যান্য কম্পোনেন্টও এখানে থাকতে পারে,
// যেমন সাইডবার বা হেডার, কিন্তু মূল কন্টেন্ট নিচের অংশে থাকবে।

const DashboardPage = () => {
    return (
        // একটি মূল div যা কম্পোনেন্টগুলোর মধ্যে একটি সুন্দর ব্যবধান (space) তৈরি করবে
        <div className="space-y-8 p-4 md:p-6">
            
            {/* ধাপ ১১-তে বানানো পারফরম্যান্স ওভারভিউ কম্পোনেন্ট */}
            <CryptoMarketOverview />
            
            {/* ধাপ ৮-এ বানানো বট কন্ট্রোল প্যানেল */}
            <BotControlPanel />

            {/* তোমার ডিজাইন অনুযায়ী ট্রেড হিস্ট্রি এবং স্ট্র্যাটেজি ম্যানেজমেন্ট পাশাপাশি থাকতে পারে,
            সরলতার জন্য আমরা এগুলোকে নিচে নিচে সাজাচ্ছি। */}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ধাপ ১০-এ বানানো ট্রেড হিস্ট্রি টেবিল */}
                {/* এটিকে বেশি জায়গা দেওয়া হলো, কারণ এতে বেশি তথ্য থাকে */}
                <div className="lg:col-span-3"> {/* অথবা lg:col-span-2 যদি পাশে কিছু থাকে */}
                    <TradeHistoryTable />
                </div>

                {/* ভবিষ্যতে স্ট্র্যাটেজি ম্যানেজমেন্ট প্যানেলটি এখানে যোগ করা যেতে পারে */}
                {/* 
                <div>
                     <StrategyManagementPanel /> 
                </div>
                */}
            </div>

        </div>
    );
};

export default DashboardPage;
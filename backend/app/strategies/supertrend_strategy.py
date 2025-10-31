# app/strategies/supertrend_strategy.py

import pandas as pd
import pandas_ta as ta
from app.strategies.base_strategy import BaseStrategy

class SupertrendStrategy(BaseStrategy):
    """Supertrend ইন্ডিকেটরের ট্রেন্ড পরিবর্তনের উপর ভিত্তি করে সিগন্যাল দেয়।"""
    
    def __init__(self, params: dict):
        """
        __init__ মেথডটি এখন robust type casting সহ প্যারামিটার গ্রহণ করে।
        """
        self.period = int(params.get('period', 7))
        self.multiplier = float(params.get('multiplier', 3.0))

    # --- নতুন যুক্ত করা অংশ ---
    @staticmethod
    def get_params_definition():
        """
        UI-তে ডাইনামিক ফর্ম তৈরির জন্য এই স্ট্র্যাটেজির প্যারামিটারগুলোকে সংজ্ঞায়িত করে।
        """
        return [
            {"name": "period", "type": "integer", "default": 7, "label": "ATR Period"},
            {"name": "multiplier", "type": "float", "default": 3.0, "label": "Multiplier"}
        ]
        
    def generate_signals(self, df: pd.DataFrame) -> str:
        
        # ডাইনামিক কলামের নাম তৈরি করা (pandas_ta অনুযায়ী)
        # যেমন: SUPERTd_7_3.0
        direction_col = f'SUPERTd_{self.period}_{self.multiplier}'

        # pandas_ta ব্যবহার করে Supertrend ইন্ডিকেটর গণনা করা
        df.ta.supertrend(length=self.period, multiplier=self.multiplier, append=True)
        
        # যথেষ্ট ডেটা আছে কিনা তা নিশ্চিত করা
        if len(df) < 2 or direction_col not in df.columns or pd.isna(df[direction_col].iloc[-2]):
            return "HOLD"
            
        latest = df.iloc[-1]
        previous = df.iloc[-2]

        # SUPERTd কলামটি ট্রেন্ড নির্দেশ করে (1 for uptrend, -1 for downtrend)
        # আপট্রেন্ড শুরু হলে (BUY) - অর্থাৎ, ট্রেন্ড -1 থেকে 1-এ পরিবর্তিত হলে
        if previous[direction_col] == -1 and latest[direction_col] == 1:
            return "BUY"

        # ডাউনট্রেন্ড শুরু হলে (SELL) - অর্থাৎ, ট্রেন্ড 1 থেকে -1-এ পরিবর্তিত হলে
        if previous[direction_col] == 1 and latest[direction_col] == -1:
            return "SELL"
            
        return "HOLD"
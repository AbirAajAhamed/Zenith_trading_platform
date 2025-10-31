# app/strategies/ema_crossover_strategy.py

import pandas as pd
import pandas_ta as ta
from app.strategies.base_strategy import BaseStrategy

class EmaCrossoverStrategy(BaseStrategy):
    """স্বল্প-মেয়াদী এবং দীর্ঘ-মেয়াদী EMA-এর ক্রওসওভারের উপর ভিত্তি করে সিগন্যাল দেয়।"""

    def __init__(self, params: dict):
        # params থেকে short_window এবং long_window নেওয়া, না থাকলে ডিফল্ট ভ্যালু ব্যবহার করা
        self.short_window = int(params.get('short_window', 50))
        self.long_window = int(params.get('long_window', 200))

    # --- নতুন: প্যারামিটার সংজ্ঞা ---
    # এই মেথডটি UI-কে বলে দেবে যে এই স্ট্র্যাটেজির জন্য কোন কোন প্যারামিটার প্রয়োজন
    @staticmethod
    def get_params_definition():
        """UI-তে ডাইনামিক ফর্ম তৈরির জন্য এই স্ট্র্যাটেজির প্যারামিটারগুলো সংজ্ঞায়িত করে।"""
        return [
            {
                "name": "short_window",
                "type": "integer",
                "default": 50,
                "label": "Short EMA Period"
            },
            {
                "name": "long_window",
                "type": "integer",
                "default": 200,
                "label": "Long EMA Period"
            }
        ]

    def generate_signals(self, df: pd.DataFrame) -> str:
        # __init__ থেকে পাওয়া ভ্যালু ব্যবহার করে ডাইনামিকভাবে EMA গণনা করা
        short_ema_col = f'EMA_{self.short_window}'
        long_ema_col = f'EMA_{self.long_window}'
        
        # দুটি EMA গণনা করা
        # নিশ্চিত করা যে কলামের নামগুলো অনন্য থাকে
        df.ta.ema(length=self.short_window, append=True, col_names=(short_ema_col,))
        df.ta.ema(length=self.long_window, append=True, col_names=(long_ema_col,))
        
        # ডেটা পর্যাপ্ত কিনা এবং কলামগুলো তৈরি হয়েছে কিনা তা পরীক্ষা করা
        if len(df) < self.long_window or short_ema_col not in df.columns or long_ema_col not in df.columns:
            return "HOLD"
        
        # NaN ভ্যালু আছে কিনা তা পরীক্ষা করা, যা গণনার শুরুতে হতে পারে
        if pd.isna(df[short_ema_col].iloc[-1]) or pd.isna(df[long_ema_col].iloc[-1]):
            return "HOLD"

        latest = df.iloc[-1]
        previous = df.iloc[-2]

        # গোল্ডেন ক্রস (BUY)
        # short ema crosses above long ema
        if previous[short_ema_col] < previous[long_ema_col] and latest[short_ema_col] > latest[long_ema_col]:
            return "BUY"

        # ডেথ ক্রস (SELL)
        # short ema crosses below long ema
        if previous[short_ema_col] > previous[long_ema_col] and latest[short_ema_col] < latest[long_ema_col]:
            return "SELL"
            
        return "HOLD"
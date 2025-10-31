# app/strategies/macd_crossover_strategy.py

import pandas as pd
import pandas_ta as ta
from app.strategies.base_strategy import BaseStrategy

class MacdCrossoverStrategy(BaseStrategy):
    """MACD এবং Signal Line-এর ক্রওসওভারের উপর ভিত্তি করে সিগন্যাল তৈরি করে।"""

    def __init__(self, params: dict):
        # প্যারামিটারগুলো গ্রহণ করা হচ্ছে এবং integer-এ রূপান্তরিত করা হচ্ছে
        self.fast = int(params.get('fast_period', 12))
        self.slow = int(params.get('slow_period', 26))
        self.signal = int(params.get('signal_period', 9))

    # --- নতুন: প্যারামিটার সংজ্ঞা ---
    # এই মেথডটি UI-কে বলে দেবে যে এই স্ট্র্যাটেজির জন্য কোন কোন প্যারামিটার প্রয়োজন
    @staticmethod
    def get_params_definition():
        """UI-তে ডাইনামিক ফর্ম তৈরির জন্য এই স্ট্র্যাটেজির প্যারামিটারগুলো সংজ্ঞায়িত করে।"""
        return [
            {
                "name": "fast_period",
                "type": "integer",
                "default": 12,
                "label": "Fast Period (EMA)"
            },
            {
                "name": "slow_period",
                "type": "integer",
                "default": 26,
                "label": "Slow Period (EMA)"
            },
            {
                "name": "signal_period",
                "type": "integer",
                "default": 9,
                "label": "Signal Period (EMA of MACD)"
            }
        ]

    def generate_signals(self, df: pd.DataFrame) -> str:
        # MACD ইন্ডিকেটর গণনা করা
        df.ta.macd(fast=self.fast, slow=self.slow, signal=self.signal, append=True)
        
        # pandas_ta দ্বারা তৈরি কলামের নামগুলো সঠিকভাবে ধরা
        macd_line = f'MACD_{self.fast}_{self.slow}_{self.signal}'
        signal_line = f'MACDs_{self.fast}_{self.slow}_{self.signal}'

        # যথেষ্ট ডেটা আছে কিনা তা নিশ্চিত করার জন্য একটি উন্নত পরীক্ষা
        # MACD হিসাব করতে কমপক্ষে (slow_period + signal_period) ডেটা লাগে
        if len(df) < (self.slow + self.signal) or macd_line not in df.columns or signal_line not in df.columns:
            return "HOLD"
        
        # NaN ভ্যালু আছে কিনা তা পরীক্ষা করা, যা গণনার শুরুতে হতে পারে
        if pd.isna(df[macd_line].iloc[-1]) or pd.isna(df[signal_line].iloc[-1]):
            return "HOLD"
            
        latest = df.iloc[-1]
        previous = df.iloc[-2]

        # বুলিশ ক্রওসওভার (BUY): MACD লাইন সিগন্যাল লাইনকে নিচ থেকে ক্রস করে উপরে উঠলে
        if previous[macd_line] < previous[signal_line] and latest[macd_line] > latest[signal_line]:
            return "BUY"

        # বেয়ারিশ ক্রওসওভার (SELL): MACD লাইন সিগন্যাল লাইনকে উপর থেকে ক্রস করে নিচে নামলে
        if previous[macd_line] > previous[signal_line] and latest[macd_line] < latest[signal_line]:
            return "SELL"
            
        return "HOLD"
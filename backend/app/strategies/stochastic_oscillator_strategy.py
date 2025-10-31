# app/strategies/stochastic_oscillator_strategy.py

import pandas as pd
import pandas_ta as ta
from app.strategies.base_strategy import BaseStrategy

class StochasticOscillatorStrategy(BaseStrategy):
    """Stochastic Oscillator-এর overbought/oversold লেভেল ক্রসিং-এর উপর সিগন্যাল দেয়।"""

    def __init__(self, params: dict):
        # UI থেকে আসা স্ট্রিং ভ্যালুগুলোকে int-এ রূপান্তর করা হচ্ছে
        self.k_period = int(params.get('k_period', 14))
        self.d_period = int(params.get('d_period', 3))
        self.smoothing = int(params.get('smoothing', 3))
        self.oversold = int(params.get('oversold', 20))
        self.overbought = int(params.get('overbought', 80))
        
    @staticmethod
    def get_params_definition():
        """UI-তে ডাইনামিক ফর্ম তৈরির জন্য এই স্ট্র্যাটেজির প্যারামিটারগুলো সংজ্ঞায়িত করে।"""
        return [
            {"name": "k_period", "type": "integer", "default": 14, "label": "K Period"},
            {"name": "d_period", "type": "integer", "default": 3, "label": "D Period"},
            {"name": "smoothing", "type": "integer", "default": 3, "label": "Smoothing"},
            {"name": "oversold", "type": "integer", "default": 20, "label": "Oversold Level"},
            {"name": "overbought", "type": "integer", "default": 80, "label": "Overbought Level"}
        ]
        
    def generate_signals(self, df: pd.DataFrame) -> str:
        
        # ডাইনামিক কলামের নাম তৈরি করা
        stoch_k_col = f'STOCHk_{self.k_period}_{self.d_period}_{self.smoothing}'
        stoch_d_col = f'STOCHd_{self.k_period}_{self.d_period}_{self.smoothing}'

        # pandas_ta ব্যবহার করে Stochastic Oscillator গণনা করা
        df.ta.stoch(k=self.k_period, d=self.d_period, smooth_k=self.smoothing, append=True)
        
        # যথেষ্ট ডেটা আছে এবং কলাম তৈরি হয়েছে কিনা তা নিশ্চিত করা
        if len(df) < 2 or stoch_k_col not in df.columns:
            return "HOLD"
            
        latest = df.iloc[-1]
        previous = df.iloc[-2]

        # Oversold লেভেল থেকে উপরে উঠলে (BUY)
        # %K লাইনটি oversold লেভেলকে নিচ থেকে ক্রস করে উপরে উঠছে
        if previous[stoch_k_col] < self.oversold and latest[stoch_k_col] > self.oversold:
            return "BUY"

        # Overbought লেভেল থেকে নিচে নামলে (SELL)
        # %K লাইনটি overbought লেভেলকে উপর থেকে ক্রস করে নিচে নামছে
        if previous[stoch_k_col] > self.overbought and latest[stoch_k_col] < self.overbought:
            return "SELL"
            
        return "HOLD"
# app/strategies/bollinger_bands_strategy.py

import pandas as pd
import pandas_ta as ta
from app.strategies.base_strategy import BaseStrategy

class BollingerBandsStrategy(BaseStrategy):
    """প্রাইস যখন Bollinger Bands-এর সীমানা স্পর্শ করে, তখন Mean Reversion সিগন্যাল দেয়।"""
    
    def __init__(self, params: dict):
        # params থেকে length এবং std_dev নেওয়া, না থাকলে ডিফল্ট ভ্যালু ব্যবহার করা
        self.length = int(params.get('length', 20))
        self.std_dev = float(params.get('std_dev', 2.0))
        print(f"Bollinger Bands Strategy Initialized with: Length={self.length}, StdDev={self.std_dev}")

    # <-- মূল পরিবর্তন: UI-এর জন্য প্যারামিটার সংজ্ঞা যোগ করা হলো -->
    @staticmethod
    def get_params_definition():
        """
        এই স্ট্র্যাটেজির জন্য UI-তে ডাইনামিক ফর্ম তৈরির জন্য প্রয়োজনীয় 
        প্যারামিটারগুলো সংজ্ঞায়িত করে।
        """
        return [
            {"name": "length", "type": "integer", "default": 20, "label": "BB Period Length"},
            {"name": "std_dev", "type": "float", "default": 2.0, "label": "Standard Deviation"}
        ]

    def generate_signals(self, df: pd.DataFrame) -> str:
        # __init__ থেকে পাওয়া ভ্যালু ব্যবহার করে কলামের নাম তৈরি করা
        bbl_col = f'BBL_{self.length}_{self.std_dev}'
        bbu_col = f'BBU_{self.length}_{self.std_dev}'
        
        # pandas_ta কে সঠিক প্যারামিটার পাস করা
        df.ta.bbands(length=self.length, std=self.std_dev, append=True)
        
        if len(df) < self.length or bbl_col not in df.columns or bbu_col not in df.columns:
            return "HOLD"
            
        latest_price = df['close'].iloc[-1]
        lower_band = df[bbl_col].iloc[-1]
        upper_band = df[bbu_col].iloc[-1]

        if pd.isna(lower_band) or pd.isna(upper_band):
            return "HOLD"

        # প্রাইস লোয়ার ব্যান্ডের নিচে গেলে (BUY)
        if latest_price < lower_band:
            return "BUY"

        # প্রাইস আপার ব্যান্ডের উপরে গেলে (SELL)
        if latest_price > upper_band:
            return "SELL"
            
        return "HOLD"
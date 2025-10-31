# app/strategies/rsi_strategy.py

import pandas as pd
import talib
from app.strategies.base_strategy import BaseStrategy

class RsiStrategy(BaseStrategy):
    """
    RSI (Relative Strength Index) ইন্ডিকেটরের উপর ভিত্তি করে ট্রেডিং স্ট্র্যাটেজি।
    এই সংস্করণটি ডাইনামিক প্যারামিটার সমর্থন করে।
    """

    def __init__(self, params: dict):
        """
        স্ট্র্যাটেজি ক্লাসটিকে প্রদত্ত প্যারামিটার দিয়ে ইনিশিয়ালাইজ করে।
        """
        # params ডিকশনারি থেকে ভ্যালুগুলো নেওয়া হচ্ছে। না থাকলে ডিফল্ট ভ্যালু ব্যবহার করা হবে।
        # int() ব্যবহার করে নিশ্চিত করা হচ্ছে যে ভ্যালুগুলো সঠিক টাইপের।
        self.length = int(params.get('length', 14))
        self.oversold = int(params.get('oversold', 30))
        self.overbought = int(params.get('overbought', 70))
        
        # ডিবাগিং-এর জন্য কোন প্যারামিটার দিয়ে ক্লাসটি তৈরি হলো তা প্রিন্ট করা
        print(f"RSI Strategy Initialized with: Length={self.length}, Oversold={self.oversold}, Overbought={self.overbought}")

    @staticmethod
    def get_params_definition():
        """
        এই স্ট্র্যাটেজির জন্য UI-তে প্রয়োজনীয় প্যারামিটারগুলো সংজ্ঞায়িত করে।
        এই মেথডটি API-এর মাধ্যমে ফ্রন্টএন্ডকে জানায় কী ধরনের ফর্ম তৈরি করতে হবে।
        """
        return [
            {"name": "length", "type": "integer", "default": 14, "label": "RSI Length"},
            {"name": "oversold", "type": "integer", "default": 30, "label": "Oversold Threshold"},
            {"name": "overbought", "type": "integer", "default": 70, "label": "Overbought Threshold"}
        ]

    def generate_signals(self, df: pd.DataFrame) -> str:
        """
        RSI মান পরীক্ষা করে 'BUY', 'SELL' বা 'HOLD' সিগন্যাল তৈরি করে।
        """
        # RSI গণনা করার জন্য যথেষ্ট ডেটা আছে কিনা তা পরীক্ষা করা
        if len(df) < self.length:
            return 'HOLD'

        # __init__-এ সেট করাインスタンス ভ্যারিয়েবল ব্যবহার করা হচ্ছে
        rsi_values = talib.RSI(df['close'], timeperiod=self.length)

        # সর্বশেষ RSI মান
        latest_rsi = rsi_values.iloc[-1]

        # যদি সর্বশেষ মান NaN হয় (যেমন, ডেটার শুরুতে), তাহলে কোনো সিগন্যাল না দেওয়া
        if pd.isna(latest_rsi):
            return 'HOLD'
            
        # সিগন্যাল তৈরির মূল যুক্তি
        if latest_rsi < self.oversold:
            return 'BUY'
        elif latest_rsi > self.overbought:
            return 'SELL'
        else:
            return 'HOLD'
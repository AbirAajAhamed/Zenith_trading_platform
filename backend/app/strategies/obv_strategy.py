# app/strategies/obv_strategy.py

import pandas as pd
import pandas_ta as ta
from app.strategies.base_strategy import BaseStrategy

class ObvStrategy(BaseStrategy):
    """On-Balance Volume (OBV) এবং তার মুভিং এভারেজের উপর ভিত্তি করে সিগন্যাল দেয়।"""

    def __init__(self, params: dict):
        # __init__ মেথডটি এখন int() ব্যবহার করে টাইপ নিশ্চিত করছে
        self.ema_length = int(params.get('ema_length', 20))
    
    # --- নতুন কোড শুরু ---
    @staticmethod
    def get_params_definition():
        """
        UI-তে ডাইনামিক ফর্ম তৈরির জন্য এই স্ট্র্যাটেজির প্যারামিটারগুলো সংজ্ঞায়িত করে।
        """
        return [
            {
                "name": "ema_length", 
                "type": "integer", 
                "default": 20, 
                "label": "OBV EMA Length"
            }
        ]
    # --- নতুন কোড শেষ ---
    
    def generate_signals(self, df: pd.DataFrame) -> str:
        # On-Balance Volume গণনা
        df.ta.obv(append=True)

        # OBV-এর একটি EMA গণনা করা হচ্ছে ট্রেন্ড বোঝার জন্য
        obv_ema_col = f'OBVe_{self.ema_length}' # pandas_ta ডিফল্ট নাম ব্যবহার করে, আমরাও তাই করব
        df.ta.ema(close=df['OBV'], length=self.ema_length, append=True) # pandas_ta স্বয়ংক্রিয়ভাবে সঠিক নাম দেবে
        
        # যথেষ্ট ডেটা আছে কিনা তা নিশ্চিত করা এবং কলামের অস্তিত্ব পরীক্ষা করা
        if 'OBV' not in df.columns or obv_ema_col not in df.columns or len(df) < 2:
            return "HOLD"
            
        latest = df.iloc[-1]
        previous = df.iloc[-2]

        # NaN ভ্যালু আছে কিনা তা পরীক্ষা করা, যা গণনার শুরুতে হতে পারে
        if pd.isna(latest[obv_ema_col]) or pd.isna(previous[obv_ema_col]):
            return "HOLD"

        # OBV যখন তার EMA-কে নিচ থেকে উপরে ক্রস করে (BUY)
        if previous['OBV'] < previous[obv_ema_col] and latest['OBV'] > latest[obv_ema_col]:
            return "BUY"

        # OBV যখন তার EMA-কে উপর থেকে নিচে ক্রস করে (SELL)
        if previous['OBV'] > previous[obv_ema_col] and latest['OBV'] < latest[obv_ema_col]:
            return "SELL"
            
        return "HOLD"
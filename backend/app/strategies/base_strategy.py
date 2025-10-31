# app/strategies/base_strategy.py

from abc import ABC, abstractmethod
import pandas as pd

class BaseStrategy(ABC):
    """
    একটি অ্যাবস্ট্রাক্ট বেস ক্লাস যা সব ট্রেডিং স্ট্র্যাটেজিকে মেনে চলতে হবে।
    এটি নিশ্চিত করে যে প্রতিটি স্ট্র্যাটেজিতে একটি 'generate_signals' মেথড আছে।
    """
    def __init__(self, strategy_params: dict):
        self.params = strategy_params

    @abstractmethod
    def generate_signals(self, historical_data: pd.DataFrame) -> str:
        """
        ঐতিহাসিক ক্যান্ডেলস্টিক ডেটা বিশ্লেষণ করে একটি ট্রেডিং সিগন্যাল তৈরি করে।

        :param historical_data: Pandas DataFrame যাতে 'open', 'high', 'low', 'close', 'volume' কলাম আছে।
        :return: 'BUY', 'SELL', বা 'HOLD' স্ট্রিং।
        """
        pass
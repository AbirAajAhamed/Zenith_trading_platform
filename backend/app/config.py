# app/config.py

import os
from dotenv import load_dotenv

# .env ফাইল থেকে পরিবেশের ভেরিয়েবল লোড করে
load_dotenv()

# এখন আমরা os.getenv() ব্যবহার করে key গুলো পেতে পারি
BINANCE_API_KEY = os.getenv("BINANCE_API_KEY")
BINANCE_API_SECRET = os.getenv("BINANCE_API_SECRET")
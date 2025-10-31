# app/services/strategy_manager.py (ডিবাগিং প্রিন্ট স্টেটমেন্ট সহ সম্পূর্ণ সংস্করণ)

import os
import shutil
import importlib.util
from fastapi import UploadFile
from typing import List, Dict, Any, Type
from pathlib import Path

from ..strategies.base_strategy import BaseStrategy

# --- পাথগুলোকে pathlib ব্যবহার করে আরও নির্ভরযোগ্য করা হলো ---
try:
    SERVICE_DIR = Path(__file__).parent.resolve()
    APP_DIR = SERVICE_DIR.parent
    BASE_STRATEGIES_PATH = APP_DIR / "strategies"
    USER_STRATEGIES_PATH = BASE_STRATEGIES_PATH / "user_uploaded"
except NameError:
    # ইন্টারেক্টিভ সেশনের জন্য একটি ফলব্যাক
    BASE_STRATEGIES_PATH = Path("app/strategies")
    USER_STRATEGIES_PATH = BASE_STRATEGIES_PATH / "user_uploaded"


IGNORE_FILES = {"__init__.py", "base_strategy.py"}

def _get_strategy_module(strategy_name: str):
    filename_str = strategy_name.replace(" ", "_").lower() + ".py"
    
    user_strategy_path = USER_STRATEGIES_PATH / filename_str
    base_strategy_path = BASE_STRATEGIES_PATH / filename_str
    
    module_path = None
    if user_strategy_path.exists():
        module_path = user_strategy_path
    elif base_strategy_path.exists():
        module_path = base_strategy_path
    else:
         raise ImportError(f"Strategy file '{filename_str}' not found.")
        
    spec = importlib.util.spec_from_file_location(strategy_name, str(module_path))
    if not spec or not spec.loader:
        raise ImportError(f"Could not create module spec from {module_path}")

    strategy_module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(strategy_module)
    return strategy_module

def _find_strategy_class_in_module(strategy_module) -> Type[BaseStrategy]:
    for attr_name in dir(strategy_module):
        attr = getattr(strategy_module, attr_name)
        if isinstance(attr, type) and issubclass(attr, BaseStrategy) and attr is not BaseStrategy:
            return attr
    raise TypeError(f"No valid strategy class found in module {strategy_module.__name__}")

def save_strategy_file(file: UploadFile) -> str:
    if not file.filename or not file.filename.endswith(".py"):
        raise ValueError("Invalid file type. Only .py files are allowed.")
    
    safe_filename = Path(file.filename).name
    USER_STRATEGIES_PATH.mkdir(parents=True, exist_ok=True)
    file_path = USER_STRATEGIES_PATH / safe_filename
    
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return f"Successfully uploaded {safe_filename}"

def get_strategy_display_name(filename: str) -> str:
    return Path(filename).stem.replace("_", " ").title()

# ==========================================================
#                  পরিবর্তিত ফাংশন নিচে
# ==========================================================
def get_available_strategies() -> List[str]:
    """ডিফল্ট এবং ব্যবহারকারীর আপলোড করা সমস্ত স্ট্র্যাটেজির একটি তালিকা তৈরি করে।"""
    print("    --> DEBUG: Inside get_available_strategies function")
    found_strategies = set()
    
    print(f"    --> DEBUG: Checking base path: '{BASE_STRATEGIES_PATH}'")
    if BASE_STRATEGIES_PATH.is_dir():
        print("    --> DEBUG: Base path is a directory. Scanning...")
        for f in BASE_STRATEGIES_PATH.iterdir():
            print(f"        - Found item: {f.name}")
            if f.is_file() and f.name.endswith(".py") and f.name not in IGNORE_FILES:
                print(f"          >> It's a valid strategy file. Adding.")
                found_strategies.add(get_strategy_display_name(f.name))
    else:
        print(f"    --> DEBUG: WARNING! Base path '{BASE_STRATEGIES_PATH}' does not exist or is not a directory.")

    print(f"    --> DEBUG: Checking user path: '{USER_STRATEGIES_PATH}'")
    if USER_STRATEGIES_PATH.is_dir():
        print("    --> DEBUG: User path is a directory. Scanning...")
        for f in USER_STRATEGIES_PATH.iterdir():
            print(f"        - Found item: {f.name}")
            if f.is_file() and f.name.endswith(".py") and f.name not in IGNORE_FILES:
                print(f"          >> It's a valid user strategy file. Adding.")
                found_strategies.add(get_strategy_display_name(f.name))
    else:
        # এটি একটি সাধারণ অবস্থা, এরর নয়, তাই Warning নয়
        print(f"    --> DEBUG: User path '{USER_STRATEGIES_PATH}' does not exist (this is normal if no files uploaded).")
                
    sorted_list = sorted(list(found_strategies))
    print(f"    --> DEBUG: Final sorted list being returned: {sorted_list}")
    return sorted_list

def get_strategy_params(strategy_name: str) -> List[Dict[str, Any]]:
    try:
        module = _get_strategy_module(strategy_name)
        strategy_class = _find_strategy_class_in_module(module)
        if hasattr(strategy_class, 'get_params_definition'):
            return strategy_class.get_params_definition()
        return []
    except (ImportError, TypeError) as e:
        print(f"Error getting params for '{strategy_name}': {e}")
        raise e

def load_strategy_dynamically(strategy_name: str, params: Dict[str, Any]) -> BaseStrategy:
    print(f"Attempting to load strategy '{strategy_name}' with params: {params}")
    module = _get_strategy_module(strategy_name)
    strategy_class = _find_strategy_class_in_module(module)
    return strategy_class(params)
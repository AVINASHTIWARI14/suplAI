from slowapi import Limiter
from slowapi.util import get_remote_address

# Shared limiter instance so both main.py and routers reference the same object
# without a circular import.
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

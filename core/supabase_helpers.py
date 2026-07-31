def response_data(result):
    if result is None:
        return None
    if getattr(result, "error", None):
        return None
    return getattr(result, "data", None)

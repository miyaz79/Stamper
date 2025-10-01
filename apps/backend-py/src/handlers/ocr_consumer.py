def lambda_handler(event, context):
    # Post-PoC placeholder
    return {"ok": True, "message": "OCR consumer placeholder", "records": len(event.get("Records", []))}

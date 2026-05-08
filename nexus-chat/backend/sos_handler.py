"""
SOS Handler — Emergency broadcast system
Works over internet AND Bluetooth (simulated via BLE Web API)
"""
import json
from datetime import datetime

class SOSHandler:
    def __init__(self):
        self.active_alerts = []

    def create_alert(self, sender_id: str, sender_name: str,
                     message: str, location: dict = None) -> dict:
        alert = {
            "id": f"sos_{datetime.utcnow().timestamp()}",
            "type": "sos_alert",
            "sender_id": sender_id,
            "sender_name": sender_name,
            "message": message,
            "location": location,
            "timestamp": datetime.utcnow().isoformat(),
            "priority": "EMERGENCY"
        }
        self.active_alerts.append(alert)
        return alert

    def get_active_alerts(self):
        return self.active_alerts[-10:]  # last 10 alerts

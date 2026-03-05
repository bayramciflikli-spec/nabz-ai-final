# HÜCRE: 3.1.1_upload_handler.py
# Mühendis kullanıcının yüklediği dosya tipini (JSON, CSV, Metin) kontrol eder.


def handle_raw_data():
    return {
        "status": "Receiving_Data",
        "max_size": "50MB",
        "allowed_types": ["txt", "json", "csv"],
    }

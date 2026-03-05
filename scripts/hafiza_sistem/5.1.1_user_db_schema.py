# HÜCRE: 5.1.1_user_db_schema.py
# Mühendis kullanıcı verilerinin hangi formatta tutulacağını belirler.
# Master-Lock uyarısı: Gerçek kullanıcı adları ve şifreler burada 'xxx' olarak maskelenir.


def user_record_structure():
    return {
        "fields": ["user_id", "subscription_status", "last_login"],
        "encryption": "Active",
    }

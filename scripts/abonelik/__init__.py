# Bölüm 2: ABONELİK & KAYIT — Identity, giriş ve oturum
import importlib.util
import os

_dir = os.path.dirname(os.path.abspath(__file__))

_spec_l = importlib.util.spec_from_file_location("login_logic", os.path.join(_dir, "2.1.1_login_logic.py"))
_spec_s = importlib.util.spec_from_file_location("session_manager", os.path.join(_dir, "2.1.2_session_manager.py"))
_spec_t = importlib.util.spec_from_file_location("tiers", os.path.join(_dir, "2.2.1_tiers.py"))
_spec_p = importlib.util.spec_from_file_location("payment_gateway", os.path.join(_dir, "2.3.1_payment_gateway.py"))
_login = importlib.util.module_from_spec(_spec_l)
_session = importlib.util.module_from_spec(_spec_s)
_tiers = importlib.util.module_from_spec(_spec_t)
_payment = importlib.util.module_from_spec(_spec_p)
_spec_l.loader.exec_module(_login)
_spec_s.loader.exec_module(_session)
_spec_t.loader.exec_module(_tiers)
_spec_p.loader.exec_module(_payment)

validate_user_access = _login.validate_user_access
handle_user_session = _session.handle_user_session
SUBSCRIPTION_PLANS = _tiers.SUBSCRIPTION_PLANS
process_billing = _payment.process_billing

__all__ = ["validate_user_access", "handle_user_session", "SUBSCRIPTION_PLANS", "process_billing"]

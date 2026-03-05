# Bölüm 3: VERİ GİRİŞİ — Receivers, Sanitizer, Bridge
import importlib.util
import os

_dir = os.path.dirname(os.path.abspath(__file__))

_spec_u = importlib.util.spec_from_file_location("upload_handler", os.path.join(_dir, "3.1.1_upload_handler.py"))
_spec_b = importlib.util.spec_from_file_location("input_field_sync", os.path.join(_dir, "3.1.2_input_field_sync.py"))
_spec_c = importlib.util.spec_from_file_location("cleaner", os.path.join(_dir, "3.2.1_cleaner.py"))
_spec_f = importlib.util.spec_from_file_location("formatter", os.path.join(_dir, "3.2.2_formatter.py"))
_upload = importlib.util.module_from_spec(_spec_u)
_bridge = importlib.util.module_from_spec(_spec_b)
_cleaner = importlib.util.module_from_spec(_spec_c)
_formatter = importlib.util.module_from_spec(_spec_f)
_spec_u.loader.exec_module(_upload)
_spec_b.loader.exec_module(_bridge)
_spec_c.loader.exec_module(_cleaner)
_spec_f.loader.exec_module(_formatter)

handle_raw_data = _upload.handle_raw_data
manual_entry_bridge = _bridge.manual_entry_bridge
clear_noise = _cleaner.clear_noise
prepare_for_ai = _formatter.prepare_for_ai

__all__ = ["handle_raw_data", "manual_entry_bridge", "clear_noise", "prepare_for_ai"]

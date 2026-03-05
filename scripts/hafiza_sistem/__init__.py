# Bölüm 5: HAFIZA & SİSTEM — User-DB, Archive, Logs
import importlib.util
import os

_dir = os.path.dirname(os.path.abspath(__file__))

_spec_u = importlib.util.spec_from_file_location("user_db_schema", os.path.join(_dir, "5.1.1_user_db_schema.py"))
_spec_a = importlib.util.spec_from_file_location("analysis_archive", os.path.join(_dir, "5.1.2_analysis_archive.py"))
_spec_e = importlib.util.spec_from_file_location("error_tracker", os.path.join(_dir, "5.2.1_error_tracker.py"))
_spec_audit = importlib.util.spec_from_file_location("audit_log", os.path.join(_dir, "5.2.2_audit_log.py"))
_user_db = importlib.util.module_from_spec(_spec_u)
_archive = importlib.util.module_from_spec(_spec_a)
_error_tracker = importlib.util.module_from_spec(_spec_e)
_audit = importlib.util.module_from_spec(_spec_audit)
_spec_u.loader.exec_module(_user_db)
_spec_a.loader.exec_module(_archive)
_spec_e.loader.exec_module(_error_tracker)
_spec_audit.loader.exec_module(_audit)

user_record_structure = _user_db.user_record_structure
archive_manager = _archive.archive_manager
log_system_errors = _error_tracker.log_system_errors
security_audit = _audit.security_audit

__all__ = ["user_record_structure", "archive_manager", "log_system_errors", "security_audit"]

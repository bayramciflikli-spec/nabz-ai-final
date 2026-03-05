# Bölüm 4: ANALİZ ÇEKİRDEĞİ — Formulas, Logic, Reporter
import importlib.util
import os

_dir = os.path.dirname(os.path.abspath(__file__))

_spec_e = importlib.util.spec_from_file_location("evaluator", os.path.join(_dir, "4.1.1_evaluator.py"))
_spec_w = importlib.util.spec_from_file_location("weight_config", os.path.join(_dir, "4.1.2_weight_config.py"))
_spec_r = importlib.util.spec_from_file_location("report_builder", os.path.join(_dir, "4.2.1_report_builder.py"))
_spec_a = importlib.util.spec_from_file_location("alert_system", os.path.join(_dir, "4.2.2_alert_system.py"))
_evaluator = importlib.util.module_from_spec(_spec_e)
_weight = importlib.util.module_from_spec(_spec_w)
_report = importlib.util.module_from_spec(_spec_r)
_alert = importlib.util.module_from_spec(_spec_a)
_spec_e.loader.exec_module(_evaluator)
_spec_w.loader.exec_module(_weight)
_spec_r.loader.exec_module(_report)
_spec_a.loader.exec_module(_alert)

process_logic = _evaluator.process_logic
set_analysis_weights = _weight.set_analysis_weights
generate_summary = _report.generate_summary
trigger_alerts = _alert.trigger_alerts

__all__ = ["process_logic", "set_analysis_weights", "generate_summary", "trigger_alerts"]

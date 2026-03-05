# GÖRSEL TASARIM hücreleri — renk ve font tek noktadan
import importlib.util
import os

_dir = os.path.dirname(os.path.abspath(__file__))

_spec_c = importlib.util.spec_from_file_location("colors", os.path.join(_dir, "1.1.1_colors.py"))
_spec_f = importlib.util.spec_from_file_location("fonts", os.path.join(_dir, "1.1.2_fonts.py"))
_spec_b = importlib.util.spec_from_file_location("buttons", os.path.join(_dir, "1.2.1_buttons.py"))
_spec_i = importlib.util.spec_from_file_location("inputs", os.path.join(_dir, "1.2.2_inputs.py"))
_spec_m = importlib.util.spec_from_file_location("main_frame", os.path.join(_dir, "1.3.1_main_frame.py"))
_colors = importlib.util.module_from_spec(_spec_c)
_fonts = importlib.util.module_from_spec(_spec_f)
_buttons = importlib.util.module_from_spec(_spec_b)
_inputs = importlib.util.module_from_spec(_spec_i)
_main_frame = importlib.util.module_from_spec(_spec_m)
_spec_c.loader.exec_module(_colors)
_spec_f.loader.exec_module(_fonts)
_spec_b.loader.exec_module(_buttons)
_spec_i.loader.exec_module(_inputs)
_spec_m.loader.exec_module(_main_frame)

NABZ_THEME = _colors.NABZ_THEME
FONT_CONFIG = _fonts.FONT_CONFIG
render_main_button = _buttons.render_main_button
data_entry_field = _inputs.data_entry_field
build_dashboard = _main_frame.build_dashboard

__all__ = ["NABZ_THEME", "FONT_CONFIG", "render_main_button", "data_entry_field", "build_dashboard"]

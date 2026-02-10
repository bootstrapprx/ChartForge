import os
import importlib
import pytest

def find_python_files(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                yield os.path.join(root, file)

def get_module_name(file_path, base_dir):
    relative_path = os.path.relpath(file_path, base_dir)
    module_path = os.path.splitext(relative_path)[0]
    return module_path.replace(os.path.sep, ".")

@pytest.mark.parametrize("module_path", [
    get_module_name(py_file, "app")
    for py_file in find_python_files("app")
])
def test_import(module_path):
    """Tests that all Python modules in the app directory can be imported."""
    try:
        importlib.import_module(f"app.{module_path}")
    except ImportError as e:
        pytest.fail(f"Failed to import module {module_path}: {e}")
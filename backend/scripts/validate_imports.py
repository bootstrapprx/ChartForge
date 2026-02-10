import os
import sys
import importlib
from pathlib import Path

def main():
    """
    Walks through all Python files in the 'app' directory and attempts to import them
    to check for import errors, especially circular dependencies.
    """
    app_dir = Path(__file__).parent.parent / "app"
    sys.path.insert(0, str(app_dir.parent))

    print("Starting import validation...")
    error_count = 0

    for root, _, files in os.walk(app_dir):
        for file in files:
            if file.endswith(".py"):
                relative_path = Path(root).relative_to(app_dir.parent)
                module_name = ".".join(relative_path.parts) + "." + Path(file).stem
                
                # Skip __init__ files if they are empty or just contain __all__
                if file == "__init__.py":
                    with open(os.path.join(root, file), "r") as f:
                        content = f.read().strip()
                        if not content or content.startswith("__all__"):
                            continue
                
                try:
                    print(f"Attempting to import: {module_name}")
                    importlib.import_module(module_name)
                    print(f"  \033[92mSUCCESS\033[0m")
                except ImportError as e:
                    print(f"  \033[91mERROR: Failed to import {module_name}\033[0m")
                    print(f"    Reason: {e}")
                    error_count += 1
                except Exception as e:
                    print(f"  \033[91mUNEXPECTED ERROR in {module_name}\033[0m")
                    print(f"    Reason: {e}")
                    error_count += 1

    if error_count == 0:
        print("\n\033[92mAll modules imported successfully. No import errors found.\033[0m")
    else:
        print(f"\n\033[91mFound {error_count} import error(s).\033[0m")
        sys.exit(1)

if __name__ == "__main__":
    main()

import csv
import gzip
import base64
import os
import sys

# Path to the CSV file
CSV_PATH = "/home/actpm/Documents/workfolder/ChartForge/assets/standard_chart.csv"
OUTPUT_PATH = "/home/actpm/Documents/workfolder/ChartForge/backend/app/core/embedded_template.py"

def generate_embedded_template():
    if not os.path.exists(CSV_PATH):
        print(f"Error: CSV file not found at {CSV_PATH}")
        return

    print(f"Reading CSV from {CSV_PATH}...")
    with open(CSV_PATH, 'rb') as f:
        csv_content = f.read()

    print(f"Original size: {len(csv_content)} bytes")

    # Compress the content
    compressed = gzip.compress(csv_content)
    encoded = base64.b64encode(compressed).decode('utf-8')

    print(f"Compressed size: {len(encoded)} bytes")

    # Generate the Python file
    py_content = f'''"""
Embedded Master Chart Template
Generated automatically. Do not edit manually.
"""
import gzip
import base64
import io
import csv
from typing import List, Dict, Any

_COMPRESSED_DATA = "{encoded}"

def get_embedded_template_csv() -> str:
    """Returns the decompressed CSV content as a string."""
    compressed = base64.b64decode(_COMPRESSED_DATA)
    return gzip.decompress(compressed).decode('utf-8-sig')

def get_embedded_template_data() -> List[Dict[str, Any]]:
    """Returns the template data as a list of dictionaries."""
    content = get_embedded_template_csv()
    f = io.StringIO(content)
    reader = csv.DictReader(f)
    return list(reader)
'''

    with open(OUTPUT_PATH, 'w') as f:
        f.write(py_content)

    print(f"Successfully generated {OUTPUT_PATH}")

if __name__ == "__main__":
    generate_embedded_template()

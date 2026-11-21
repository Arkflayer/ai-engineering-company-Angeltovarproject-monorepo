"""
Safe snippet for basic pandas cleaning. Copy and adapt for your dataset.
Run: python pandas_clean.py  (ensure pandas is installed)
"""
import argparse
import sys
from pathlib import Path

import pandas as pd

# Load (adjust path and kwargs as needed)
parser = argparse.ArgumentParser(description="Limpia un archivo CSV de forma segura.")
parser.add_argument("source", nargs="?", type=Path, default=Path("data.csv"), help="CSV de entrada (por defecto: data.csv)")
args = parser.parse_args()
source = args.source
try:
    if not source.is_file():
        raise FileNotFoundError("No existe el archivo de entrada.")
    df = pd.read_csv(source)
except (OSError, UnicodeError, pd.errors.ParserError, pd.errors.EmptyDataError) as exc:
    print("No se pudo leer el CSV de entrada. Comprueba la ruta, el formato y la codificación UTF-8.", file=sys.stderr)
    raise SystemExit(1) from exc
print("df_shape", df.shape)
print("df_dtypes", df.dtypes)

# Drop fully null columns
df = df.dropna(axis=1, how="all")
print("df_shape_after_drop_all_null_cols", df.shape)

# Fill or drop nulls in key columns (customise columns)
# df = df.dropna(subset=["required_col"])
# df["optional_col"] = df["optional_col"].fillna(0)

# Normalise column names (optional)
df.columns = df.columns.str.strip().str.lower().str.replace(" ", "_")
print("df_columns", list(df.columns))

# Deduplicate (optional)
before = len(df)
df = df.drop_duplicates()
print("rows_dropped_duplicates", before - len(df))

# Do not print sample rows: they may contain personal or sensitive data.
print("Preview omitted to protect input data.")

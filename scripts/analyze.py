#!/usr/bin/env python3
"""Analiza localmente archivos CSV de incidencias sin exponer datos de clientes."""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# La interfaz de consola y la API usan la misma implementación.
REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "services" / "api"))
from app.domains.incidents.analysis import (  # noqa: E402
    CATEGORIES, COUNTRIES, RULE_LABELS, STATUSES, analyze_csv, write_results_csv,
)


def percentage(value: int, total: int) -> str:
    return f"{(100 * value / total if total else 0):.1f}%"


def display(summary: dict, source: str) -> None:
    print("=" * 60)
    print("  TRACKFLOW — ANÁLISIS DE INFORMES DE INCIDENCIAS")
    print(f"  Archivo de origen: {source}")
    print("=" * 60)
    print(f"\nTOTAL DE REGISTROS EN EL ARCHIVO .......... {summary['total_records']}")
    print(f"  ├─ Registros válidos .................... {summary['valid_records']}")
    print(f"  └─ Inválidos o incompletos ............... {summary['invalid_records']}")
    print("\nDESGLOSE DE REGISTROS INVÁLIDOS")
    for rule, label in RULE_LABELS.items():
        if rule in summary["invalid_breakdown"]:
            print(f"  ├─ {label:<34} {summary['invalid_breakdown'][rule]}")
    labels = {
        "LOST_PARCEL": "Paquete perdido",
        "DELAYED_DELIVERY": "Entrega retrasada",
        "WRONG_ADDRESS": "Dirección incorrecta",
        "RETURN_REQUEST": "Solicitud de devolución",
        "DAMAGE": "Daño en el paquete",
        "OPEN": "Abierta",
        "CLOSED": "Cerrada",
        "DISCARDED": "Descartada",
    }
    for title, collection, keys in (
        ("DESGLOSE POR CATEGORÍA (registros válidos)", summary["by_category"], CATEGORIES),
        ("DESGLOSE POR ESTADO (registros válidos)", summary["by_status"], STATUSES),
        ("DESGLOSE POR PAÍS (registros válidos)", summary["by_country"], COUNTRIES),
    ):
        print(f"\n{title}")
        for key in keys:
            count = collection[key]
            print(f"  ├─ {labels.get(key, key):<25} {count:>3}  ({percentage(count, summary['valid_records'])})")
    satisfaction = summary["satisfaction"]
    print("\nÍNDICE DE SATISFACCIÓN (incidencias cerradas)")
    print(f"  Incidencias puntuadas: {satisfaction['scored_incidents']} de {satisfaction['closed_incidents']}")
    average = satisfaction["average"]
    print(f"  Puntuación media: {'No disponible' if average is None else f'{average:.2f}'} / 5,00")
    labels = {"1": "Muy insatisfecho", "2": "Insatisfecho", "3": "Neutral", "4": "Satisfecho", "5": "Muy satisfecho"}
    for score, label in labels.items():
        print(f"  ├─ Puntuación {score} ({label}) ........ {satisfaction['by_score'][score]}")
    print("\n" + "=" * 60)


def main() -> int:
    parser = argparse.ArgumentParser(description="Valida y resume un CSV de incidencias TrackFlow.")
    parser.add_argument("csv_file", type=Path, help="Ruta al CSV UTF-8")
    args = parser.parse_args()
    try:
        with args.csv_file.open("r", encoding="utf-8-sig", newline="") as stream:
            summary = analyze_csv(stream)
        display(summary, args.csv_file.name)
        while True:
            answer = input("¿Exportar resultados a CSV? [s / n]: ").strip().lower()
            if answer in {"s", "n"}:
                break
            print("Responde s o n, por favor.")
        if answer == "s":
            output = Path("results.csv")
            with output.open("w", encoding="utf-8", newline="") as stream:
                write_results_csv(summary, stream)
            print(f"Resultados agregados exportados a {output.resolve()}")
        return 0
    except (OSError, UnicodeError, ValueError) as exc:
        print(f"Se produjo un error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

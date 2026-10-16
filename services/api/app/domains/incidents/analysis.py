"""Validación y agregación de CSV de incidencias con protección de privacidad."""
from __future__ import annotations

import csv
import re
from collections import Counter
from datetime import date
from typing import Iterable, Mapping, TextIO

REQUIRED_COLUMNS = (
    "incident_id", "date", "country", "customer_type", "tracking_number",
    "carrier", "category", "description", "status", "customer_email",
    "satisfaction_score",
)
CARRIERS = {
    "US": {"UPS", "FEDEX", "DHL_US"},
    "ES": {"MRW", "SEUR", "DHL_ES", "LOCAL_ES"},
}
CATEGORIES = ("LOST_PARCEL", "DELAYED_DELIVERY", "WRONG_ADDRESS", "RETURN_REQUEST", "DAMAGE")
STATUSES = ("OPEN", "CLOSED", "DISCARDED")
COUNTRIES = ("US", "ES")
CUSTOMER_TYPES = ("B2B", "B2C")
RULE_LABELS = {
    "incident_id": "Identificador de incidencia inválido o ausente",
    "date": "Fecha inválida o ausente",
    "country": "País inválido o ausente",
    "customer_type": "Tipo de cliente inválido o ausente",
    "tracking_number": "Número de seguimiento inválido",
    "carrier": "Transportista no válido para el país",
    "category": "Categoría inválida o ausente",
    "description": "Descripción inválida o ausente",
    "status": "Estado inválido o ausente",
    "email": "Correo electrónico inválido o ausente",
    "closed_no_score": "Incidente cerrado sin puntuación",
    "score_range": "Puntuación de satisfacción fuera del rango 1–5",
    "duplicate_id": "Identificador de incidencia duplicado",
}


class CSVFormatError(ValueError):
    """El archivo cargado no es un CSV de incidencias de TrackFlow legible."""


def _validate_row(row: Mapping[str, str], seen_ids: set[str]) -> list[str]:
    errors: list[str] = []
    incident_id = (row.get("incident_id") or "").strip()
    if not re.fullmatch(r"TRF-\d{6}", incident_id):
        errors.append("incident_id")
    elif incident_id in seen_ids:
        errors.append("duplicate_id")
    else:
        seen_ids.add(incident_id)

    raw_date = (row.get("date") or "").strip()
    try:
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", raw_date):
            raise ValueError
        date.fromisoformat(raw_date)
    except ValueError:
        errors.append("date")

    country = (row.get("country") or "").strip()
    if country not in COUNTRIES:
        errors.append("country")
    if (row.get("customer_type") or "").strip() not in CUSTOMER_TYPES:
        errors.append("customer_type")

    tracking = (row.get("tracking_number") or "").strip()
    if len(tracking) < 8:
        errors.append("tracking_number")

    carrier = (row.get("carrier") or "").strip()
    if country not in CARRIERS or carrier not in CARRIERS[country]:
        errors.append("carrier")

    if (row.get("category") or "").strip() not in CATEGORIES:
        errors.append("category")
    if len((row.get("description") or "").strip()) < 5:
        errors.append("description")

    status = (row.get("status") or "").strip()
    if status not in STATUSES:
        errors.append("status")

    # No incluir datos de entrada ni correos en errores o registros de actividad.
    email = (row.get("customer_email") or "").strip()
    if "@" not in email or email.startswith("@") or email.endswith("@"):
        errors.append("email")

    score_text = (row.get("satisfaction_score") or "").strip()
    if status == "CLOSED" and not score_text:
        errors.append("closed_no_score")
    if score_text and (not score_text.isdigit() or not 1 <= int(score_text) <= 5):
        errors.append("score_range")
    return errors


def analyze_rows(rows: Iterable[Mapping[str, str]]) -> dict:
    """Agrega filas válidas; cuenta las inválidas por regla y nunca las devuelve."""
    categories = Counter()
    statuses = Counter()
    countries = Counter()
    scores = Counter()
    rule_counts = Counter()
    total = valid_count = invalid_count = 0
    score_sum = 0
    seen_ids: set[str] = set()

    for row in rows:
        total += 1
        errors = _validate_row(row, seen_ids)
        if errors:
            invalid_count += 1
            rule_counts.update(errors)
            continue
        valid_count += 1
        categories[row["category"].strip()] += 1
        statuses[row["status"].strip()] += 1
        countries[row["country"].strip()] += 1
        score_text = (row.get("satisfaction_score") or "").strip()
        if row["status"].strip() == "CLOSED" and score_text:
            score = int(score_text)
            scores[score] += 1
            score_sum += score

    return {
        "total_records": total,
        "valid_records": valid_count,
        "invalid_records": invalid_count,
        "invalid_breakdown": {key: rule_counts[key] for key in RULE_LABELS if rule_counts[key]},
        "invalid_labels": RULE_LABELS,
        "by_category": {key: categories[key] for key in CATEGORIES},
        "by_status": {key: statuses[key] for key in STATUSES},
        "by_country": {key: countries[key] for key in COUNTRIES},
        "satisfaction": {
            "scored_incidents": sum(scores.values()),
            "closed_incidents": statuses["CLOSED"],
            "average": round(score_sum / sum(scores.values()), 2) if scores else None,
            "by_score": {str(score): scores[score] for score in range(1, 6)},
        },
    }


def analyze_csv(stream: TextIO) -> dict:
    """Analiza un flujo CSV UTF-8 sin conservar las filas de origen."""
    try:
        reader = csv.DictReader(stream, strict=True)
        if not reader.fieldnames:
            raise CSVFormatError("El CSV está vacío o no tiene encabezado.")
        headers = [header.strip() if header else "" for header in reader.fieldnames]
        if len(set(headers)) != len(headers):
            raise CSVFormatError("El CSV contiene nombres de columna duplicados.")
        missing = [column for column in REQUIRED_COLUMNS if column not in headers]
        if missing:
            raise CSVFormatError("Faltan columnas obligatorias: " + ", ".join(missing))
        reader.fieldnames = headers

        def validated_rows():
            for row in reader:
                if row is None:
                    continue
                if None in row:
                    raise CSVFormatError("El CSV contiene filas con más columnas que el encabezado.")
                yield row

        return analyze_rows(validated_rows())
    except UnicodeDecodeError as exc:
        raise CSVFormatError("El archivo debe estar codificado en UTF-8.") from exc
    except csv.Error as exc:
        raise CSVFormatError("El formato CSV no es válido.") from exc


def metric_rows(summary: Mapping) -> list[tuple[str, str, str]]:
    """Convierte el resumen en filas de métricas sin datos de origen ni personales."""
    category_names = {
        "LOST_PARCEL": "Paquete perdido",
        "DELAYED_DELIVERY": "Entrega retrasada",
        "WRONG_ADDRESS": "Dirección incorrecta",
        "RETURN_REQUEST": "Solicitud de devolución",
        "DAMAGE": "Daño en el paquete",
    }
    status_names = {"OPEN": "Abierta", "CLOSED": "Cerrada", "DISCARDED": "Descartada"}
    result = [
        ("total_registros", "todos", str(summary["total_records"])),
        ("registros_validos", "todos", str(summary["valid_records"])),
        ("registros_invalidos", "todos", str(summary["invalid_records"])),
    ]
    for rule, count in summary["invalid_breakdown"].items():
        result.append(("regla_invalida", RULE_LABELS[rule], str(count)))
    for key, count in summary["by_category"].items():
        result.append(("categoría", category_names[key], str(count)))
    for key, count in summary["by_status"].items():
        result.append(("estado", status_names[key], str(count)))
    for key, count in summary["by_country"].items():
        result.append(("país", key, str(count)))
    satisfaction = summary["satisfaction"]
    result.extend([
        ("incidencias_con_puntuacion", "cerradas", str(satisfaction["scored_incidents"])),
        ("promedio_de_satisfacción", "cerradas", "" if satisfaction["average"] is None else f'{satisfaction["average"]:.2f}'),
    ])
    for score, count in satisfaction["by_score"].items():
        result.append(("puntuación_de_satisfacción", score, str(count)))
    return result


def write_results_csv(summary: Mapping, stream: TextIO) -> None:
    writer = csv.writer(stream)
    writer.writerow(("métrica", "dimensión", "valor"))
    writer.writerows(metric_rows(summary))

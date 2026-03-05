"""Config-backed category and filter validation helpers."""

from __future__ import annotations

from functools import lru_cache
import json
from pathlib import Path

from fastapi import HTTPException


def data_root() -> Path:
    """Resolve dashboard static data root."""
    return Path(__file__).resolve().parents[2] / "web" / "public" / "data"


def load_json(path: Path) -> object:
    """Load JSON payload from file."""
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail="Missing source data file") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail="Invalid source data format") from exc


def extract_leaf_categories(items: list[dict[str, object]]) -> set[str]:
    """Extract leaf category keys from nested categories payload."""
    leaf_keys: set[str] = set()
    for item in items:
        key = item.get("key")
        children = item.get("children")
        if isinstance(children, list) and children:
            child_items = [entry for entry in children if isinstance(entry, dict)]
            leaf_keys.update(extract_leaf_categories(child_items))
            continue
        if isinstance(key, str):
            leaf_keys.add(key)
    return leaf_keys


@lru_cache(maxsize=1)
def valid_categories() -> set[str]:
    """Load and cache valid leaf category keys."""
    payload = load_json(data_root() / "categories.json")
    items = payload if isinstance(payload, list) else []
    dict_items = [entry for entry in items if isinstance(entry, dict)]
    return extract_leaf_categories(dict_items)


def normalize_contract_key(contract: str) -> str | None:
    """Normalize filter contract key to API contract month (01-12)."""
    if contract.startswith("c") and len(contract) == 3 and contract[1:].isdigit():
        return contract[1:]
    if len(contract) == 2 and contract.isdigit():
        return contract
    return None


@lru_cache(maxsize=1)
def metric_contracts() -> dict[str, set[str]]:
    """Load and cache allowed contracts per metric."""
    payload = load_json(data_root() / "filters.json")
    if not isinstance(payload, dict):
        return {}
    metrics = payload.get("metrics")
    if not isinstance(metrics, list):
        return {}

    mapping: dict[str, set[str]] = {}
    for metric in metrics:
        if not isinstance(metric, dict):
            continue
        metric_key = metric.get("key")
        contract_keys = metric.get("contractKeys")
        if not isinstance(metric_key, str) or not isinstance(contract_keys, list):
            continue
        normalized_contracts = {
            normalized
            for entry in contract_keys
            if isinstance(entry, str)
            for normalized in [normalize_contract_key(entry)]
            if normalized is not None
        }
        mapping[metric_key] = normalized_contracts
    return mapping


def validate_request(metric: str, category: str, contract: str) -> None:
    """Validate request path values against supported config."""
    mapping = metric_contracts()
    if metric not in mapping:
        raise HTTPException(status_code=404, detail="Unknown metric")
    if category not in valid_categories():
        raise HTTPException(status_code=404, detail="Unknown category")
    if contract not in mapping[metric]:
        raise HTTPException(status_code=404, detail="Unknown contract")

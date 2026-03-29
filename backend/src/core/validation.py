import re

GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$")
HSN_SAC_REGEX = re.compile(r"^[0-9]{4,8}$")


def normalize_gstin(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip().upper()
    if not normalized:
        return None

    if not GSTIN_REGEX.fullmatch(normalized):
        raise ValueError("Invalid GSTIN format. Expected 15-character GSTIN, e.g. 27ABCDE1234F1Z5")

    return normalized


def normalize_hsn_sac(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    if not normalized:
        return None

    if not HSN_SAC_REGEX.fullmatch(normalized):
        raise ValueError("HSN/SAC must be 4 to 8 digits")

    return normalized

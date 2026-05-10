"""
Filtreringslogik för hyresbevakning.

En annons GODKÄNNS bara om ALLA tre villkor uppfylls:
  KRAV 1: minst ett ord från FORSTAHAND_NYCKELORD finns i texten
  KRAV 2: minst ett ord från KOFRI_NYCKELORD finns i texten
  KRAV 3: inget ord från EXKLUDERA_NYCKELORD finns i texten

Därutöver tillämpas användarens filter (pris, storlek, område) från config.yaml.
"""

# KRAV 1 – förstahandskontrakt
FORSTAHAND_NYCKELORD = [
    "förstahandskontrakt", "1:a hand", "första hand",
    "hyresrätt", "direktkontrakt", "hyresvärd söker",
]

# KRAV 2 – köfritt
KOFRI_NYCKELORD = [
    "först till kvarn", "utan kö", "ingen kötid",
    "väljer hyresgäst", "kontakta oss direkt", "utan bostadskö",
]

# KRAV 3 – får ej förekomma
EXKLUDERA_NYCKELORD = [
    "andrahand", "2:a hand", "andra hand", "inneboende",
    "i andra hand", "korttid", "tillfälligt", "några månader",
    "köpoäng", "bostadsförmedlingen", "kötid krävs",
    "registrerad i kön",
]


def passes_text_filter(text: str) -> tuple[bool, str]:
    """Textbaserad filtrering av annonstitel och beskrivning.

    Returnerar (godkänd, anledning).
    """
    text_lower = (text or "").lower()

    # Exkluderingsord vetoar alltid – kontrollera först
    for ord_ in EXKLUDERA_NYCKELORD:
        if ord_ in text_lower:
            return False, f"Exkluderingsord hittat: '{ord_}'"

    # Måste ha minst ett förstahandsord
    if not any(ord_ in text_lower for ord_ in FORSTAHAND_NYCKELORD):
        return False, "Inget förstahandskontrakts-nyckelord hittat"

    # Måste ha minst ett köfritt-ord
    if not any(ord_ in text_lower for ord_ in KOFRI_NYCKELORD):
        return False, "Inget köfritt-nyckelord hittat"

    return True, "Godkänd av textfilter"


def passes_user_filter(listing: dict, config: dict) -> tuple[bool, str]:
    """Tillämpa användarens filter från config.yaml (pris, storlek, område)."""
    user_filters = config.get("filters", {}) or {}

    max_price = user_filters.get("max_price")
    min_size = user_filters.get("min_size")
    areas = user_filters.get("areas") or []

    price = listing.get("price")
    size = listing.get("size")
    area = listing.get("area") or ""

    if max_price and price is not None and price > max_price:
        return False, f"Pris {price} > max_price {max_price}"

    if min_size and size is not None and size < min_size:
        return False, f"Storlek {size} < min_size {min_size}"

    if areas:
        if not any(a.lower() in area.lower() for a in areas):
            return False, f"Område '{area}' matchar inte konfigurerade områden"

    return True, "Godkänd av användarfilter"


def is_relevant(listing: dict, config: dict) -> tuple[bool, str]:
    """Övergripande filtrering: textfilter + användarfilter."""
    # Slå ihop titel och beskrivning för textfiltret
    text = " ".join(
        filter(None, [listing.get("title", ""), listing.get("description", "")])
    )

    ok, reason = passes_text_filter(text)
    if not ok:
        return False, reason

    ok, reason = passes_user_filter(listing, config)
    if not ok:
        return False, reason

    return True, "Godkänd"

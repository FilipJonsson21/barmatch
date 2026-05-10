"""
Scraping-logik per källa.

Blocket är fullt implementerad. Qasa och HomeQ är stubbade och
kommer fyllas i när Blocket-flödet verifierats.

Designprinciper:
  * Slumpmässig delay 2–5 sek mellan requests
  * Roterande User-Agent
  * Try/except runt varje annons så att en trasig kort inte
    fäller hela cykeln
"""
import logging
import random
import re
import time
from typing import Iterable

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# En liten pool av riktiga User-Agents – minskar risken att blockeras
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) "
    "Gecko/20100101 Firefox/120.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) "
    "Gecko/20100101 Firefox/120.0",
]


# ---------------------------------------------------------------------------
# Hjälpfunktioner
# ---------------------------------------------------------------------------

def _random_delay(min_s: float = 2.0, max_s: float = 5.0) -> None:
    """Sov en slumpmässig stund för att undvika rate limiting."""
    time.sleep(random.uniform(min_s, max_s))


def _headers() -> dict:
    """HTTP-headers med roterande User-Agent."""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.7",
        "Cache-Control": "no-cache",
    }


def _parse_int(text: str | None) -> int | None:
    """Plocka ut första heltalet ur en text. Returnera None om inget hittas."""
    if not text:
        return None
    digits = re.sub(r"[^\d]", "", text)
    return int(digits) if digits else None


def _extract_price(text: str) -> int | None:
    """Hitta hyran i en kortext (matchar t.ex. '12 500 kr/mån')."""
    if not text:
        return None
    match = re.search(r"(\d[\d\s]{2,})\s*kr", text, re.IGNORECASE)
    return _parse_int(match.group(1)) if match else None


def _extract_size(text: str) -> int | None:
    """Hitta storleken i kvm i en kortext."""
    if not text:
        return None
    match = re.search(r"(\d{1,3})\s*(?:kvm|m²|m2|kvadratmeter)", text, re.IGNORECASE)
    return int(match.group(1)) if match else None


# ---------------------------------------------------------------------------
# Blocket
# ---------------------------------------------------------------------------

BLOCKET_URL = "https://www.blocket.se/bostad/hyra/lagenhet/stockholm"


def scrape_blocket() -> list[dict]:
    """Scrapa lägenhetsannonser i Stockholm från Blocket."""
    logger.info("Hämtar Blocket: %s", BLOCKET_URL)

    try:
        _random_delay()
        response = requests.get(BLOCKET_URL, headers=_headers(), timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        logger.error("Misslyckades hämta Blocket: %s", e)
        return []

    soup = BeautifulSoup(response.text, "html.parser")
    listings: list[dict] = []

    # Blocket använder ofta <article>-element för annonser; faller tillbaka
    # på vanliga listing-kort om markupen ändrats.
    cards = soup.find_all("article")
    if not cards:
        cards = soup.select(
            "[data-testid*='listing'], [data-cy*='listing'], div.listing-item"
        )

    for card in cards:
        try:
            link_el = card.find("a", href=True)
            if not link_el:
                continue

            href = link_el["href"]
            listing_url = (
                "https://www.blocket.se" + href if href.startswith("/") else href
            )

            # Annons-ID extraheras ur URL (Blocket använder långa numeriska id:n)
            id_match = re.search(r"/(\d{6,})", listing_url)
            if not id_match:
                continue
            listing_id = f"blocket-{id_match.group(1)}"

            # Titel (h2/h3 om det finns, annars länktext)
            title_el = card.find(["h2", "h3"]) or link_el
            title = title_el.get_text(strip=True) if title_el else ""

            # Hela kortets text används både för pris/storlek och för
            # textfiltret i filters.py
            card_text = card.get_text(separator=" ", strip=True)
            price = _extract_price(card_text)
            size = _extract_size(card_text)

            # Område – Blocket visar oftast t.ex. "Vasastan, Stockholm"
            area_match = re.search(
                r"([A-ZÅÄÖ][\wåäöÅÄÖ\- ]+?),\s*Stockholm",
                card_text,
            )
            area = area_match.group(1).strip() if area_match else "Stockholm"

            listings.append(
                {
                    "id": listing_id,
                    "url": listing_url,
                    "title": title,
                    "price": price,
                    "size": size,
                    "area": area,
                    "source": "blocket",
                    "description": card_text,
                }
            )
        except Exception as e:
            # En enskild trasig kort ska inte fälla hela scrapern
            logger.warning("Kunde inte parsa Blocket-kort: %s", e)
            continue

    logger.info("Hittade %d annonser från Blocket", len(listings))
    return listings


# ---------------------------------------------------------------------------
# Qasa (kräver Playwright pga JavaScript) – TODO
# ---------------------------------------------------------------------------

def scrape_qasa() -> list[dict]:
    """Scrapa Qasa.

    Qasa renderar listan med JavaScript så Playwright krävs.
    Implementeras efter att Blocket-flödet validerats.
    """
    logger.info("Qasa-scrapern är inte implementerad ännu – hoppar över")
    return []


# ---------------------------------------------------------------------------
# HomeQ – TODO
# ---------------------------------------------------------------------------

def scrape_homeq() -> list[dict]:
    """Scrapa HomeQ. Implementeras efter att Blocket-flödet validerats."""
    logger.info("HomeQ-scrapern är inte implementerad ännu – hoppar över")
    return []


# ---------------------------------------------------------------------------
# Aggregat
# ---------------------------------------------------------------------------

def scrape_all() -> Iterable[dict]:
    """Kör alla scrapers och returnera kombinerad lista över annonser."""
    all_listings: list[dict] = []

    for name, fn in [
        ("blocket", scrape_blocket),
        ("qasa", scrape_qasa),
        ("homeq", scrape_homeq),
    ]:
        try:
            all_listings.extend(fn())
        except Exception as e:
            logger.error("Scraper '%s' kraschade oväntat: %s", name, e)

    return all_listings

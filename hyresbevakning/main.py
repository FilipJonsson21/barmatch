"""
Huvudprogram för hyresbevakning.

Kör scraping i en loop var 60:e sekund, filtrerar nya träffar
och skickar notiser för de som klarar filtret.
"""
import logging
import sys
from pathlib import Path

import yaml
from apscheduler.schedulers.blocking import BlockingScheduler

from database import init_db, listing_exists, mark_notified, save_listing
from filters import is_relevant
from notifier import notify
from scraper import scrape_all

# config.yaml ligger bredvid main.py
CONFIG_PATH = Path(__file__).parent / "config.yaml"

# Logga till konsolen med tidsstämpel – som specat i kraven
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("hyresbevakning")


def load_config() -> dict:
    """Läs in config.yaml. Avbryt om filen saknas."""
    if not CONFIG_PATH.exists():
        logger.error("config.yaml saknas: %s", CONFIG_PATH)
        sys.exit(1)
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def run_cycle(config: dict) -> None:
    """En körning: scrapa alla källor, spara nya, filtrera, notifiera."""
    logger.info("=== Startar bevakningscykel ===")

    listings = list(scrape_all())
    logger.info("Totalt %d annonser hämtade i denna cykel", len(listings))

    nya_notiser = 0
    for listing in listings:
        listing_id = listing.get("id")
        if not listing_id:
            continue

        # Hoppa över annonser som redan setts tidigare
        if listing_exists(listing_id):
            continue

        # 1. Spara först – så att vi inte bearbetar samma annons igen
        save_listing(listing)

        # 2. Filtrera (text + användarfilter)
        ok, reason = is_relevant(listing, config)
        if not ok:
            logger.debug("Filtrerade bort %s: %s", listing_id, reason)
            continue

        # 3. Skicka notis och markera som notifierad
        logger.info(
            "Träff! %s – '%s' (%s kr, %s kvm, %s)",
            listing_id,
            listing.get("title"),
            listing.get("price"),
            listing.get("size"),
            listing.get("area"),
        )
        if notify(listing, config):
            mark_notified(listing_id)
            nya_notiser += 1

    logger.info("=== Cykel klar – %d nya notiser skickade ===", nya_notiser)


def main() -> None:
    init_db()
    config = load_config()

    logger.info("Hyresbevakning startar – kör var 60:e sekund.")

    # Kör en cykel direkt vid uppstart, utan att vänta på första intervallet
    try:
        run_cycle(config)
    except Exception as e:
        logger.error("Fel i första cykeln (fortsätter ändå): %s", e)

    # Schemalägg återkommande körningar
    scheduler = BlockingScheduler(timezone="Europe/Stockholm")
    scheduler.add_job(
        run_cycle,
        "interval",
        seconds=60,
        args=[config],
        max_instances=1,         # förhindra överlappande körningar
        coalesce=True,           # slå ihop missade körningar till en
    )

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Avstängning begärd – avslutar.")


if __name__ == "__main__":
    main()

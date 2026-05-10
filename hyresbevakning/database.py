"""
Databashantering för hyresbevakning.
Använder en lokal SQLite-databas för att hålla reda på vilka annonser
som redan har behandlats och notifierats om.
"""
import sqlite3
from datetime import datetime
from pathlib import Path

# Databasfilen ligger bredvid källkoden
DB_PATH = Path(__file__).parent / "hyresbevakning.db"


def init_db() -> None:
    """Skapa tabellen 'listings' om den inte redan finns."""
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS listings (
                id        TEXT PRIMARY KEY,   -- unikt annons-ID (t.ex. "blocket-12345678")
                url       TEXT,
                title     TEXT,
                price     INTEGER,            -- hyra kr/mån
                size      INTEGER,            -- kvm
                area      TEXT,               -- stadsdel
                source    TEXT,               -- qasa/homeq/blocket
                found_at  DATETIME,
                notified  INTEGER DEFAULT 0   -- 0 = ej notifierad, 1 = notifierad
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def listing_exists(listing_id: str) -> bool:
    """Returnera True om annonsen redan finns i databasen."""
    conn = sqlite3.connect(DB_PATH)
    try:
        cur = conn.execute("SELECT 1 FROM listings WHERE id = ?", (listing_id,))
        return cur.fetchone() is not None
    finally:
        conn.close()


def save_listing(listing: dict) -> None:
    """Spara en ny annons. Befintliga rader rörs ej (INSERT OR IGNORE)."""
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            """
            INSERT OR IGNORE INTO listings
                (id, url, title, price, size, area, source, found_at, notified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
            """,
            (
                listing["id"],
                listing.get("url"),
                listing.get("title"),
                listing.get("price"),
                listing.get("size"),
                listing.get("area"),
                listing.get("source"),
                datetime.now().isoformat(timespec="seconds"),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def mark_notified(listing_id: str) -> None:
    """Markera att en notis har skickats för annonsen."""
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute("UPDATE listings SET notified = 1 WHERE id = ?", (listing_id,))
        conn.commit()
    finally:
        conn.close()

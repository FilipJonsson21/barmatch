"""
Notifieringsmodul.

Skickar e-post via SMTP (Gmail som standard) och kan valfritt
skicka SMS via Twilio. Båda kanalerna styrs av config.yaml.
"""
import logging
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# E-post
# ---------------------------------------------------------------------------

def _format_price(price: int | None) -> str:
    """Formatera hyra som '12 500 kr/mån' med blanksteg som tusentalsavskiljare."""
    if not price:
        return "okänt"
    return f"{price:,} kr/mån".replace(",", " ")


def _build_email_html(listing: dict) -> str:
    """Bygg HTML-innehållet för en notis-e-post."""
    title = listing.get("title") or "(ingen titel)"
    price_str = _format_price(listing.get("price"))
    size = listing.get("size")
    size_str = f"{size} kvm" if size else "okänt"
    area = listing.get("area") or "Stockholm"
    url = listing.get("url") or "#"
    source = (listing.get("source") or "okänd").capitalize()

    return f"""\
<html>
  <body style="font-family: Arial, sans-serif; color: #222; max-width: 600px;">
    <h2 style="color: #2c5aa0; margin-bottom: 4px;">
      🏠 Ny förstahandslägenhet i Stockholm
    </h2>
    <h3 style="margin: 8px 0 4px 0;">{title}</h3>
    <p style="color: #666; margin-top: 0;">Källa: {source}</p>
    <table style="border-collapse: collapse; margin: 16px 0; font-size: 15px;">
      <tr><td style="padding: 4px 12px 4px 0;"><strong>Hyra:</strong></td>
          <td>{price_str}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0;"><strong>Storlek:</strong></td>
          <td>{size_str}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0;"><strong>Område:</strong></td>
          <td>{area}</td></tr>
    </table>
    <p>
      <a href="{url}"
         style="background: #2c5aa0; color: #fff; padding: 10px 18px;
                text-decoration: none; border-radius: 4px;
                display: inline-block;">
        Öppna annonsen
      </a>
    </p>
    <p style="color: #888; font-size: 12px;">
      Skickad av hyresbevakning – ett förstahandskontrakt utan kötid,
      agera snabbt!
    </p>
  </body>
</html>
"""


def send_email(listing: dict, config: dict) -> bool:
    """Skicka e-postnotis. Returnera True om det lyckades."""
    smtp_cfg = config.get("smtp", {}) or {}
    user_cfg = config.get("user", {}) or {}

    sender = smtp_cfg.get("sender")
    password = smtp_cfg.get("password")
    recipient = user_cfg.get("email")
    server = smtp_cfg.get("server", "smtp.gmail.com")
    port = smtp_cfg.get("port", 587)

    if not (sender and password and recipient):
        logger.error("SMTP-konfiguration ofullständig (sender/password/email saknas)")
        return False

    title = listing.get("title") or "(ingen titel)"

    msg = EmailMessage()
    msg["Subject"] = f"🏠 Ny förstahandslägenhet i Stockholm - {title}"
    msg["From"] = sender
    msg["To"] = recipient

    # Plain text-fallback för e-postklienter som inte renderar HTML
    msg.set_content(
        f"Ny lägenhet: {title}\n"
        f"Hyra: {_format_price(listing.get('price'))}\n"
        f"Storlek: {listing.get('size') or 'okänt'} kvm\n"
        f"Område: {listing.get('area') or 'Stockholm'}\n"
        f"Länk: {listing.get('url') or ''}\n"
    )
    msg.add_alternative(_build_email_html(listing), subtype="html")

    try:
        with smtplib.SMTP(server, port, timeout=30) as smtp:
            smtp.starttls()
            smtp.login(sender, password)
            smtp.send_message(msg)
        logger.info("E-post skickad till %s om '%s'", recipient, title)
        return True
    except Exception as e:
        logger.error("Misslyckades skicka e-post: %s", e)
        return False


# ---------------------------------------------------------------------------
# SMS via Twilio (valfritt)
# ---------------------------------------------------------------------------

def send_sms(listing: dict, config: dict) -> bool:
    """Skicka SMS via Twilio. Returnera True om det lyckades."""
    twilio_cfg = config.get("twilio", {}) or {}
    user_cfg = config.get("user", {}) or {}

    sid = twilio_cfg.get("account_sid")
    token = twilio_cfg.get("auth_token")
    from_num = twilio_cfg.get("from_number")
    to_num = user_cfg.get("phone")

    if not (sid and token and from_num and to_num):
        logger.warning("Twilio-konfiguration ofullständig – hoppar över SMS")
        return False

    try:
        from twilio.rest import Client  # importeras lokalt så paketet är valfritt
    except ImportError:
        logger.error("Paketet 'twilio' saknas (kör: pip install twilio)")
        return False

    title = listing.get("title") or "(ingen titel)"
    price = listing.get("price") or "?"
    url = listing.get("url") or ""
    body = f"Ny lägenhet: {title} {price}kr - {url}"

    try:
        client = Client(sid, token)
        client.messages.create(body=body, from_=from_num, to=to_num)
        logger.info("SMS skickat till %s", to_num)
        return True
    except Exception as e:
        logger.error("Misslyckades skicka SMS: %s", e)
        return False


# ---------------------------------------------------------------------------
# Aggregat
# ---------------------------------------------------------------------------

def notify(listing: dict, config: dict) -> bool:
    """Skicka aktiverade notiser. Returnera True om minst en lyckades."""
    notif_cfg = config.get("notifications", {}) or {}
    success = False

    if notif_cfg.get("email"):
        success = send_email(listing, config) or success

    if notif_cfg.get("sms"):
        success = send_sms(listing, config) or success

    return success

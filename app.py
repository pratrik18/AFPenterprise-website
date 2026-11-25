import json
import os
import re
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from flask import Flask, jsonify, render_template, request, redirect, url_for, send_from_directory
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix
from supabase_client import supabase

app = Flask(
    __name__,
    static_folder='public/static',
    static_url_path='/static',
)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024  # 16 KB per request

# Vercel sits in front of Flask. Trust its forwarded client IP for per-IP limits.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

limiter = Limiter(
    get_remote_address,
    app=app,
    storage_uri=os.getenv('RATELIMIT_STORAGE_URI', 'memory://'),
    headers_enabled=True,
)


CONTACT_NOTIFICATION_RECIPIENTS = [
    'ajanega@afpstudio.eu',
    'flezo@afpstudio.eu',
    'pvrabec@afpstudio.eu',
]


def send_contact_notification(name, email, category, message):
    """Send the submitted contact request to the AFP team through Resend."""
    api_key = os.getenv('RESEND_API_KEY')
    sender = os.getenv('CONTACT_FROM_EMAIL')
    if not api_key or not sender:
        raise RuntimeError('Chýba konfigurácia RESEND_API_KEY alebo CONTACT_FROM_EMAIL.')

    safe_name = ' '.join(name.split())
    text = (
        'Nový dopyt z webovej stránky AFP\n\n'
        'Niekto odoslal kontaktný formulár a má záujem o službu.\n\n'
        f'Meno a priezvisko: {name}\n'
        f'E-mail klienta: {email}\n'
        f'Služba: {category}\n'
        'Potvrdenie oboznámenia s informáciami o spracúvaní údajov: Áno\n\n'
        'Správa:\n'
        f'{message or "(Klient neuviedol správu.)"}\n'
    )
    payload = {
        'from': sender,
        'to': CONTACT_NOTIFICATION_RECIPIENTS,
        'reply_to': email,
        'subject': f'Nový dopyt z webu AFP – {safe_name}',
        'text': text,
    }
    req = Request(
        'https://api.resend.com/emails',
        data=json.dumps(payload, ensure_ascii=False).encode('utf-8'),
        headers={
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'User-Agent': 'AFPStudio-ContactForm/1.0 (+https://www.afpstudio.eu)',
        },
        method='POST',
    )

    try:
        with urlopen(req, timeout=10) as response:
            if response.status < 200 or response.status >= 300:
                raise RuntimeError(f'Resend vrátil HTTP {response.status}.')
    except HTTPError as error:
        # Resend returns a JSON body with the actionable reason (for example,
        # an unverified sender domain or an API-key permission issue). Keep the
        # API key private by logging only the response body, never request headers.
        details = error.read().decode('utf-8', errors='replace').strip()
        raise RuntimeError(
            f'Resend vrátil HTTP {error.code}: {details or error.reason}'
        ) from error


@app.errorhandler(429)
def rate_limit_exceeded(error):
    if request.path.startswith('/api/'):
        return jsonify(error='Dosiahli ste limit odosielania. Skúste to, prosím, neskôr.'), 429
    return 'Dosiahli ste limit odosielania. Skúste to, prosím, neskôr.', 429


@app.errorhandler(413)
def request_too_large(error):
    if request.path.startswith('/api/'):
        return jsonify(error='Odoslané údaje sú príliš veľké.'), 413
    return 'Odoslané údaje sú príliš veľké.', 413


@app.route('/api/contact', methods=['POST'])
@limiter.limit('5 per hour')
def submit_contact():
    """Validate and store a contact form submission in Supabase."""
    name = (request.form.get('name') or '').strip()
    email = (request.form.get('email') or '').strip()
    category = (request.form.get('type') or '').strip()
    message = (request.form.get('message') or '').strip()
    privacy_acknowledgement = request.form.get('privacy_acknowledgement')

    allowed_categories = {
        'Oficiálne slávnosti',
        'Promo služieb',
        'Auto & moto estetika',
        'Strih videa & úprava fotiek',
        'Iné',
    }

    if not name or len(name) > 120:
        return jsonify(error='Zadajte meno (najviac 120 znakov).'), 400
    if not email or len(email) > 254 or not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
        return jsonify(error='Zadajte platnú e-mailovú adresu.'), 400
    if category not in allowed_categories:
        return jsonify(error='Vyberte jednu z ponúkaných kategórií.'), 400
    if len(message) > 5000:
        return jsonify(error='Správa môže mať najviac 5000 znakov.'), 400
    if not privacy_acknowledgement:
        return jsonify(error='Potvrďte, že ste sa oboznámili s informáciami o spracúvaní údajov.'), 400

    try:
        supabase.table('contact_requests').insert({
            'Name': name,
            'Email': email,
            'Category': category,
            'Message': message,
        }).execute()
    except Exception as e:
        app.logger.exception('Chyba pri ukladaní kontaktného dopytu do Supabase: %r', e)
        return jsonify(error='Správu sa nepodarilo odoslať. Skúste to, prosím, neskôr.'), 500

    try:
        send_contact_notification(name, email, category, message)
    except Exception:
        # The request is already safely stored in Supabase; don't make the
        # visitor resubmit it and risk creating duplicate contact requests.
        app.logger.exception('Nepodarilo sa odoslať e-mailové upozornenie tímu AFP.')

    return jsonify(message='Ďakujeme za správu! Ozveme sa vám čo najskôr.'), 201


@app.route('/')
def home():
    try:
        response = (
            supabase
            .table("reviews")
            .select("name, rating, review, service, created_at")
            .eq("approved", True)
            .order("created_at", desc=True)
            .execute()
        )

        reviews = response.data or []

    except Exception as e:
        print("ERROR PRI NAČÍTANÍ RECENZIÍ:")
        print(repr(e))
        reviews = []

    return render_template(
        'index.html',
        reviews=reviews
    )


@app.route('/review', methods=['GET', 'POST'])
@limiter.limit('3 per 5 minutes', methods=['POST'])
def review():
    if request.method == 'POST':
        first_name = (request.form.get('first_name') or '').strip()
        last_name = (request.form.get('last_name') or '').strip()
        review_text = (request.form.get('review_text') or '').strip()
        rating = (request.form.get('rating') or '').strip()
        service = (request.form.get('service') or '').strip()
        privacy_consent = request.form.get('privacy_consent') == 'on'

        allowed_services = {
            'Oficiálne slávnosti',
            'Promo služieb',
            'Auto & moto estetika',
            'Strih videa & úprava fotiek',
            'Iné',
        }

        def has_disallowed_controls(value, allow_newlines=False):
            allowed_controls = '\n\r\t' if allow_newlines else ''
            return any(
                (ord(char) < 32 and char not in allowed_controls) or ord(char) == 127
                for char in value
            )

        if not first_name or len(first_name) > 80 or has_disallowed_controls(first_name):
            return 'Zadajte platné meno (najviac 80 znakov).', 400
        if not last_name or len(last_name) > 80 or has_disallowed_controls(last_name):
            return 'Zadajte platné priezvisko (najviac 80 znakov).', 400
        if (
            not review_text
            or len(review_text) > 2000
            or has_disallowed_controls(review_text, allow_newlines=True)
        ):
            return 'Recenzia musí obsahovať najviac 2000 znakov.', 400
        if rating not in {'1', '2', '3', '4', '5'}:
            return 'Vyberte hodnotenie od 1 do 5 hviezdičiek.', 400
        if service not in allowed_services:
            return 'Vyberte jednu z ponúkaných služieb.', 400
        if not privacy_consent:
            return 'Potvrďte, že ste sa oboznámili s informáciami o spracúvaní údajov.', 400

        try:
            name = f"{first_name} {last_name}"

            supabase.table("reviews").insert({
                "name": name,
                "rating": int(rating),
                "review": review_text,
                "service": service,
                "approved": False
            }).execute()

            return redirect(url_for('review'))

        except Exception as e:
            app.logger.exception('Chyba pri ukladaní recenzie do Supabase: %r', e)
            return "Chyba pri odosielaní recenzie", 500

    return render_template('review.html')


@app.get('/sitemap.xml')
def sitemap_xml():
    return send_from_directory(
        os.path.join(app.root_path, 'templates'),
        'sitemap.xml',
        mimetype='application/xml',
    )


@app.get('/robots.txt')
def robots_txt():
    return app.response_class(
        render_template('robots.txt', site_url="www.afpstudio.eu"),
        mimetype='text/plain',
    )

if __name__ == '__main__':
    app.run(debug=True)

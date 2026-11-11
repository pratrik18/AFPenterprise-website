import os
import re

from flask import Flask, jsonify, render_template, request, redirect, url_for
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.middleware.proxy_fix import ProxyFix
from supabase_client import supabase

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024  # 16 KB per request

# Vercel sits in front of Flask. Trust its forwarded client IP for per-IP limits.
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

limiter = Limiter(
    get_remote_address,
    app=app,
    storage_uri=os.getenv('RATELIMIT_STORAGE_URI', 'memory://'),
    headers_enabled=True,
)


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
        return jsonify(message='Ďakujeme za správu! Ozveme sa vám čo najskôr.'), 201
    except Exception as e:
        app.logger.exception('Chyba pri ukladaní kontaktného dopytu do Supabase: %r', e)
        return jsonify(error='Správu sa nepodarilo odoslať. Skúste to, prosím, neskôr.'), 500


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
@limiter.limit('3 per hour', methods=['POST'])
def review():
    if request.method == 'POST':
        try:
            first_name = request.form.get('first_name')
            last_name = request.form.get('last_name')
            review_text = request.form.get('review_text')
            rating = request.form.get('rating')
            service = request.form.get('service')

            name = f"{first_name} {last_name}"

            response = supabase.table("reviews").insert({
                "name": name,
                "rating": int(rating),
                "review": review_text,
                "service": service,
                "approved": False
            }).execute()

            return redirect(url_for('review'))

        except Exception as e:
            print("ERROR PRI ODOSIELANÍ RECENZIE:")
            print(repr(e))
            return "Chyba pri odosielaní recenzie", 500

    return render_template('review.html')


@app.route('/ochrana-osobnych-udajov')
def privacy():
    return render_template('ochrana-osobnych-udajov.html')


if __name__ == '__main__':
    app.run(debug=True)

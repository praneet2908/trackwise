import json
import os
from database import get_connection

# Path to presets file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRESETS_PATH = os.path.join(BASE_DIR, 'data', 'presets.json')

def get_presets():
    """Load the Indian subscription presets from presets.json"""
    with open(PRESETS_PATH, 'r') as f:
        data = json.load(f)
    return data

def get_all_subscriptions():
    """Fetch all active subscriptions from the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM subscriptions
        WHERE is_active = 1
        ORDER BY price DESC
    ''')
    rows = cursor.fetchall()
    conn.close()

    # Convert rows to list of dicts so we can send as JSON
    return [dict(row) for row in rows]

def add_subscription(name, category, price, cycle='monthly', renewal_date=None):
    """Add a new subscription to the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO subscriptions (name, category, price, cycle, renewal_date)
        VALUES (?, ?, ?, ?, ?)
    ''', (name, category, price, cycle, renewal_date))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id

def delete_subscription(subscription_id):
    """Soft delete — marks as inactive instead of removing from DB."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE subscriptions
        SET is_active = 0
        WHERE id = ?
    ''', (subscription_id,))
    conn.commit()
    conn.close()
    return True

def get_total_monthly_spend():
    """Calculate total monthly spend across all active subscriptions."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT SUM(price) as total
        FROM subscriptions
        WHERE is_active = 1
    ''')
    row = cursor.fetchone()
    conn.close()
    return row['total'] or 0
import sys
import os
sys.path.append(os.path.dirname(__file__))

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

from database import init_db
from subscriptions import (
    get_all_subscriptions,
    add_subscription,
    delete_subscription,
    get_presets,
    get_total_monthly_spend
)
from waste_score import calculate_waste_score
from ai_advisor import get_ai_advice, get_quick_tip
from alerts import get_all_alerts, get_upcoming_renewals

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # allows frontend to talk to backend

# Initialize database on startup
init_db()

# ─────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health_check():
    """Just to confirm the server is running."""
    return jsonify({'status': 'ok', 'message': 'TrackWise backend is live!'})


# ─────────────────────────────────────────
# PRESETS
# ─────────────────────────────────────────

@app.route('/api/presets', methods=['GET'])
def fetch_presets():
    """Return all Indian subscription presets."""
    try:
        presets = get_presets()
        return jsonify({'success': True, 'data': presets})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────
# SUBSCRIPTIONS
# ─────────────────────────────────────────

@app.route('/api/subscriptions', methods=['GET'])
def fetch_subscriptions():
    """Return all active subscriptions."""
    try:
        subscriptions = get_all_subscriptions()
        total = get_total_monthly_spend()
        return jsonify({
            'success': True,
            'data': subscriptions,
            'total_monthly': total,
            'count': len(subscriptions)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/subscriptions', methods=['POST'])
def create_subscription():
    """Add a new subscription."""
    try:
        body = request.get_json()

        # Validate required fields
        if not body.get('name') or not body.get('category') or not body.get('price'):
            return jsonify({'success': False, 'error': 'name, category and price are required'}), 400

        new_id = add_subscription(
            name=body['name'],
            category=body['category'],
            price=float(body['price']),
            cycle=body.get('cycle', 'monthly'),
            renewal_date=body.get('renewal_date')
        )

        return jsonify({'success': True, 'id': new_id, 'message': 'Subscription added!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/subscriptions/<int:sub_id>', methods=['DELETE'])
def remove_subscription(sub_id):
    """Delete a subscription by ID."""
    try:
        delete_subscription(sub_id)
        return jsonify({'success': True, 'message': 'Subscription removed!'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────
# WASTE SCORE
# ─────────────────────────────────────────

@app.route('/api/waste-score', methods=['GET'])
def fetch_waste_score():
    """Calculate and return the Waste Score."""
    try:
        result = calculate_waste_score()
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────
# AI ADVISOR
# ─────────────────────────────────────────

@app.route('/api/ai-advice', methods=['GET'])
def fetch_ai_advice():
    """Get AI-powered advice based on current waste score."""
    try:
        waste_data = calculate_waste_score()
        advice = get_ai_advice(waste_data)
        return jsonify({'success': True, 'advice': advice})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/quick-tip/<category>', methods=['GET'])
def fetch_quick_tip(category):
    """Get a quick tip for a specific category."""
    try:
        tip = get_quick_tip(category)
        return jsonify({'success': True, 'tip': tip})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────
# ALERTS
# ─────────────────────────────────────────

@app.route('/api/alerts', methods=['GET'])
def fetch_alerts():
    """Get all renewal alerts."""
    try:
        alerts = get_all_alerts()
        return jsonify({'success': True, 'data': alerts})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ─────────────────────────────────────────
# RUN SERVER
# ─────────────────────────────────────────

if __name__ == '__main__':
    app.run(debug=True, port=5000)
from subscriptions import get_all_subscriptions, get_total_monthly_spend
from database import get_connection

# Category weights — how "wasteable" each category is considered
# Higher = more likely to be wasted money
CATEGORY_WEIGHTS = {
    'OTT': 0.8,
    'Music': 0.6,
    'Fitness': 0.7,
    'AI Tools': 0.5,
    'Productivity': 0.4,
    'Cloud': 0.3,
    'Mobile': 0.1,   # mobile recharge is essential, low waste score
    'Insurance': 0.0, # never flag insurance as waste
    'SIP': 0.0,       # never flag investments as waste
    'EMI': 0.1,       # EMIs are committed, not wasteable
    'Finance': 0.2,
}

def calculate_waste_score():
    """
    Calculate the Waste Score (0 to 100).
    Higher score = more money being wasted.
    """
    subscriptions = get_all_subscriptions()

    if not subscriptions:
        return {
            'score': 0,
            'total_monthly': 0,
            'wasted_amount': 0,
            'breakdown': [],
            'verdict': 'No subscriptions added yet.',
            'color': 'green'
        }

    total_monthly = get_total_monthly_spend()
    weighted_waste = 0
    breakdown = []

    for sub in subscriptions:
        category = sub['category']
        price = sub['price']
        weight = CATEGORY_WEIGHTS.get(category, 0.5)
        waste_contribution = price * weight

        breakdown.append({
            'name': sub['name'],
            'category': category,
            'price': price,
            'waste_contribution': round(waste_contribution, 2),
            'weight': weight
        })

        weighted_waste += waste_contribution

    # Score is a 0-100 number
    # Formula: (weighted waste / total spend) * 100
    if total_monthly > 0:
        raw_score = (weighted_waste / total_monthly) * 100
        score = min(round(raw_score, 1), 100)  # cap at 100
    else:
        score = 0

    wasted_amount = round(weighted_waste, 2)

    # Save score to history
    save_score_to_history(score, total_monthly)

    return {
        'score': score,
        'total_monthly': round(total_monthly, 2),
        'wasted_amount': wasted_amount,
        'breakdown': sorted(breakdown, key=lambda x: x['waste_contribution'], reverse=True),
        'verdict': get_verdict(score),
        'color': get_color(score)
    }

def get_verdict(score):
    """Return a human-readable verdict based on score."""
    if score <= 20:
        return "Excellent! Your money is working hard for you."
    elif score <= 40:
        return "Pretty good. A few subscriptions could be trimmed."
    elif score <= 60:
        return "Warning. You are leaking money on unused subscriptions."
    elif score <= 80:
        return "Bad. Significant monthly waste detected."
    else:
        return "Critical. You are burning money every month."

def get_color(score):
    """Return a color code for the UI based on score."""
    if score <= 20:
        return 'green'
    elif score <= 40:
        return 'yellow'
    elif score <= 60:
        return 'orange'
    else:
        return 'red'

def save_score_to_history(score, total_monthly):
    """Save the calculated score to history table."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO waste_score_history (score, total_monthly)
        VALUES (?, ?)
    ''', (score, total_monthly))
    conn.commit()
    conn.close()
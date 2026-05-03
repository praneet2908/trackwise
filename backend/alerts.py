from datetime import datetime, timedelta
from database import get_connection

def get_upcoming_renewals(days_ahead=7):
    """
    Returns subscriptions renewing in the next X days.
    Default is 7 days ahead.
    """
    conn = get_connection()
    cursor = conn.cursor()

    # Calculate the date range
    today = datetime.today().date()
    future_date = today + timedelta(days=days_ahead)

    cursor.execute('''
        SELECT * FROM subscriptions
        WHERE is_active = 1
        AND renewal_date IS NOT NULL
        AND date(renewal_date) BETWEEN date(?) AND date(?)
        ORDER BY renewal_date ASC
    ''', (str(today), str(future_date)))

    rows = cursor.fetchall()
    conn.close()

    renewals = []
    for row in rows:
        renewal = dict(row)
        # Calculate how many days until renewal
        renewal_date = datetime.strptime(renewal['renewal_date'], '%Y-%m-%d').date()
        days_left = (renewal_date - today).days
        renewal['days_left'] = days_left
        renewal['urgency'] = get_urgency(days_left)
        renewals.append(renewal)

    return renewals


def get_urgency(days_left):
    """
    Returns urgency level based on days until renewal.
    Used to color-code alerts in the UI.
    """
    if days_left <= 1:
        return 'critical'   # red — renews today or tomorrow
    elif days_left <= 3:
        return 'high'       # orange — renews in 3 days
    elif days_left <= 7:
        return 'medium'     # yellow — renews this week
    else:
        return 'low'        # green — plenty of time


def get_all_alerts():
    """
    Returns a full alerts summary for the dashboard.
    """
    upcoming = get_upcoming_renewals(days_ahead=7)
    critical = [r for r in upcoming if r['urgency'] == 'critical']
    high = [r for r in upcoming if r['urgency'] == 'high']
    medium = [r for r in upcoming if r['urgency'] == 'medium']

    return {
        'upcoming_renewals': upcoming,
        'total_upcoming': len(upcoming),
        'critical_count': len(critical),
        'high_count': len(high),
        'medium_count': len(medium),
        'total_amount_due': sum(r['price'] for r in upcoming)
    }


def get_monthly_calendar():
    """
    Returns all active subscriptions grouped by renewal day of month.
    Powers the calendar view on the dashboard.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM subscriptions
        WHERE is_active = 1
        AND renewal_date IS NOT NULL
        ORDER BY renewal_date ASC
    ''')
    rows = cursor.fetchall()
    conn.close()

    calendar = {}
    for row in rows:
        sub = dict(row)
        day = datetime.strptime(sub['renewal_date'], '%Y-%m-%d').day
        if day not in calendar:
            calendar[day] = []
        calendar[day].append(sub)

    return calendar
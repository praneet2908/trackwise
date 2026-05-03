import sqlite3
import os

# Path to the database file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'trackwise.db')

def get_connection():
    """Get a connection to the SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # lets us access columns by name, not just index
    return conn

def init_db():
    """Create all tables if they don't exist yet."""
    conn = get_connection()
    cursor = conn.cursor()

    # Subscriptions table — stores every subscription the user adds
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subscriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            price REAL NOT NULL,
            cycle TEXT DEFAULT 'monthly',
            renewal_date TEXT,
            is_active INTEGER DEFAULT 1,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Waste score history — tracks score over time
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS waste_score_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            score REAL NOT NULL,
            total_monthly REAL NOT NULL,
            calculated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()
    print("Database initialized successfully.")

# Run init when this file is executed directly
if __name__ == '__main__':
    init_db()
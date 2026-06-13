from flask import Flask, request, jsonify, session
from flask_cors import CORS
import re
from datetime import datetime, timedelta
import os
import sqlite3
import bcrypt
import secrets
import functools
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature
import json
import sys
from collections import defaultdict

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', os.environ.get('SMARTSPEND_SECRET_KEY', 'change-this-secret-key-for-production'))
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'
# Secure cookies should be True in production
app.config['SESSION_COOKIE_SECURE'] = os.environ.get('FLASK_ENV') == 'production'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

# Flexible CORS config for production (Render) and local dev
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

@app.route("/")
def home():
    return jsonify({
        "message": "FinTrack Backend Running"
    })

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'smartspend.db')
PASSWORD_RESET_SALT = 'smartspend-password-reset'
serializer = URLSafeTimedSerializer(app.config['SECRET_KEY'])

def get_db():
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    conn.execute('PRAGMA journal_mode = WAL')
    conn.execute('PRAGMA busy_timeout = 30000')
    return conn

def execute_db(query, parameters=()):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute(query, parameters)
        conn.commit()
        return cursor.lastrowid
    finally:
        cursor.close()
        conn.close()

def query_db(query, parameters=(), one=False):
    conn = get_db()
    try:
        cursor = conn.cursor()
        cursor.execute(query, parameters)
        rows = cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
    if one:
        return rows[0] if rows else None
    return rows

def init_db():
    if not os.path.exists(DATABASE_PATH):
        open(DATABASE_PATH, 'a').close()
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            profession TEXT NOT NULL,
            annual_income REAL NOT NULL,
            current_savings REAL NOT NULL,
            savings_goal REAL NOT NULL DEFAULT 0,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            vendor TEXT NOT NULL,
            amount REAL NOT NULL,
            currency TEXT NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT,
            items TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS password_resets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            token TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    conn.commit()
    cursor.close()
    conn.close()

init_db()

# Migrate existing user schema to the new annual income/current savings model.
def migrate_user_schema():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(users)")
    columns = [row['name'] for row in cursor.fetchall()]

    if 'monthly_budget' in columns or 'monthly_savings_goal' in columns or 'annual_income' not in columns or 'current_savings' not in columns:
        cursor.execute('PRAGMA foreign_keys = OFF')
        cursor.execute('BEGIN TRANSACTION')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                profession TEXT NOT NULL,
                annual_income REAL NOT NULL DEFAULT 0,
                current_savings REAL NOT NULL DEFAULT 0,
                savings_goal REAL NOT NULL DEFAULT 0,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        ''')

        if 'monthly_budget' in columns and 'monthly_savings_goal' in columns:
            cursor.execute('''
                INSERT INTO users_new (id, username, first_name, last_name, email, profession, annual_income, current_savings, savings_goal, password_hash, created_at, updated_at)
                SELECT id, username, first_name, last_name, email, profession, monthly_budget, monthly_savings_goal, 0, password_hash, created_at, updated_at FROM users
            ''')
        else:
            cursor.execute('''
                INSERT INTO users_new (id, username, first_name, last_name, email, profession, annual_income, current_savings, savings_goal, password_hash, created_at, updated_at)
                SELECT id, username, first_name, last_name, email, profession, COALESCE(annual_income, 0), COALESCE(current_savings, 0), COALESCE(savings_goal, 0), password_hash, created_at, updated_at FROM users
            ''')

        cursor.execute('DROP TABLE users')
        cursor.execute('ALTER TABLE users_new RENAME TO users')
        cursor.execute('PRAGMA foreign_keys = ON')
        conn.commit()

    cursor.close()
    conn.close()

migrate_user_schema()

def migrate_optional_columns():
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("PRAGMA table_info(users)")
        user_columns = {row['name'] for row in cursor.fetchall()}
        if 'savings_goal' not in user_columns:
            cursor.execute('ALTER TABLE users ADD COLUMN savings_goal REAL NOT NULL DEFAULT 0')

        cursor.execute("PRAGMA table_info(expenses)")
        expense_columns = {row['name'] for row in cursor.fetchall()}
        if 'description' not in expense_columns:
            cursor.execute('ALTER TABLE expenses ADD COLUMN description TEXT')
        conn.commit()
    finally:
        cursor.close()
        conn.close()

migrate_optional_columns()

def format_user(row):
    if not row:
        return None

    annual_income = row['annual_income'] if 'annual_income' in row.keys() else row['monthly_budget'] if 'monthly_budget' in row.keys() else 0
    current_savings = row['current_savings'] if 'current_savings' in row.keys() else row['monthly_savings_goal'] if 'monthly_savings_goal' in row.keys() else 0
    return {
        'id': row['id'],
        'username': row['username'],
        'first_name': row['first_name'],
        'last_name': row['last_name'],
        'email': row['email'],
        'profession': row['profession'],
        'annual_income': annual_income,
        'current_savings': current_savings,
        'savings_goal': row['savings_goal'] if 'savings_goal' in row.keys() else 0,
        'created_at': row['created_at'],
        'updated_at': row['updated_at']
    }

def get_user_by_id(user_id):
    return query_db('SELECT * FROM users WHERE id = ?', (user_id,), one=True)

def get_user_by_identifier(identifier):
    return query_db(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        (identifier, identifier),
        one=True
    )

def get_user_by_username(username):
    return query_db('SELECT * FROM users WHERE username = ?', (username,), one=True)

def get_user_by_email(email):
    return query_db('SELECT * FROM users WHERE email = ?', (email,), one=True)

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password, password_hash):
    return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))

def create_session(user):
    session.clear()
    session.permanent = True
    session['user_id'] = user['id']
    session['csrf_token'] = secrets.token_urlsafe(32)
    return session['csrf_token']

def destroy_session():
    session.clear()

def current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return get_user_by_id(user_id)

def generate_reset_token(email):
    return serializer.dumps(email, salt=PASSWORD_RESET_SALT)

def verify_reset_token(token, max_age=3600):
    try:
        return serializer.loads(token, salt=PASSWORD_RESET_SALT, max_age=max_age)
    except (SignatureExpired, BadSignature):
        return None

def validate_password(password):
    if not password or len(password) < 8:
        return 'Password must be at least 8 characters long.'
    if not re.search(r'[A-Z]', password):
        return 'Password must contain at least one uppercase letter.'
    if not re.search(r'[a-z]', password):
        return 'Password must contain at least one lowercase letter.'
    if not re.search(r'\d', password):
        return 'Password must contain at least one number.'
    return None

def validate_email(email):
    if not email or not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
        return 'Please enter a valid email address.'
    return None

def auth_required(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        if not current_user():
            return jsonify({'success': False, 'message': 'Authentication required.'}), 401
        return fn(*args, **kwargs)
    return wrapper

def csrf_protect(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        if request.method in ('POST', 'PUT', 'DELETE'):
            token = None
            if request.is_json:
                token = request.headers.get('X-CSRF-Token') or request.json.get('csrf_token')
            else:
                token = request.headers.get('X-CSRF-Token')
            if not token or token != session.get('csrf_token'):
                return jsonify({'success': False, 'message': 'Invalid CSRF token.'}), 403
        return fn(*args, **kwargs)
    return wrapper

def handle_exceptions(fn):
    @functools.wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    return wrapper

@app.route('/api/register', methods=['POST'])
@handle_exceptions
def register():
    data = request.json or {}
    required_fields = ['username', 'first_name', 'last_name', 'email', 'profession', 'annual_income', 'current_savings', 'password', 'confirm_password']
    for field in required_fields:
        if data.get(field) is None or str(data.get(field)).strip() == '':
            return jsonify({'success': False, 'message': f'{field.replace("_", " ").title()} is required.'}), 400

    username = data['username'].strip()
    email = data['email'].strip().lower()
    profession = data['profession'].strip()
    password = data['password']
    confirm_password = data['confirm_password']

    if get_user_by_username(username):
        return jsonify({'success': False, 'message': 'Username already exists.'}), 400
    if get_user_by_email(email):
        return jsonify({'success': False, 'message': 'Email already exists.'}), 400

    email_error = validate_email(email)
    if email_error:
        return jsonify({'success': False, 'message': email_error}), 400

    if password != confirm_password:
        return jsonify({'success': False, 'message': 'Passwords do not match.'}), 400

    password_error = validate_password(password)
    if password_error:
        return jsonify({'success': False, 'message': password_error}), 400

    if profession not in ['Student', 'Working Professional', 'Freelancer', 'Business Owner', 'Content Creator', 'Other']:
        return jsonify({'success': False, 'message': 'Please select a valid profession.'}), 400

    try:
        annual_income = float(data['annual_income'])
        current_savings = float(data['current_savings'])
    except (TypeError, ValueError):
        return jsonify({'success': False, 'message': 'Income and savings values must be numeric.'}), 400

    if annual_income <= 0:
        return jsonify({'success': False, 'message': 'Annual Income must be greater than 0.'}), 400
    if current_savings < 0:
        return jsonify({'success': False, 'message': 'Current Savings cannot be negative.'}), 400

    now = datetime.utcnow().isoformat()
    password_hash = hash_password(password)
    user_id = execute_db(
        '''INSERT INTO users (username, first_name, last_name, email, profession, annual_income, current_savings, password_hash, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
        (username, data['first_name'].strip(), data['last_name'].strip(), email, profession, annual_income, current_savings, password_hash, now, now)
    )

    user = get_user_by_id(user_id)
    csrf_token = create_session(format_user(user))
    return jsonify({'success': True, 'message': 'Registration successful.', 'user': format_user(user), 'csrf_token': csrf_token})

@app.route('/api/login', methods=['POST'])
@handle_exceptions
def login():
    data = request.json or {}
    identifier = (data.get('identifier') or '').strip()
    password = data.get('password', '')

    if not identifier or not password:
        return jsonify({'success': False, 'message': 'Username or email and password are required.'}), 400

    user = get_user_by_identifier(identifier)
    if not user or not check_password(password, user['password_hash']):
        return jsonify({'success': False, 'message': 'Invalid username/email or password.'}), 401

    csrf_token = create_session(format_user(user))
    return jsonify({'success': True, 'message': 'Login successful.', 'user': format_user(user), 'csrf_token': csrf_token})

@app.route('/api/logout', methods=['POST'])
@auth_required
@handle_exceptions
def logout():
    destroy_session()
    return jsonify({'success': True, 'message': 'Logged out successfully.'})

@app.route('/api/me', methods=['GET'])
@handle_exceptions
def me():
    user = current_user()
    if not user:
        return jsonify({'success': False, 'message': 'Not authenticated.'}), 401
    return jsonify({'success': True, 'user': format_user(user), 'csrf_token': session.get('csrf_token')})

@app.route('/api/profile', methods=['PUT'])
@auth_required
@csrf_protect
@handle_exceptions
def update_profile():
    user = current_user()
    data = request.json or {}

    profession = data.get('profession', user['profession']).strip()
    first_name = data.get('first_name', user['first_name']).strip()
    last_name = data.get('last_name', user['last_name']).strip()

    if profession not in ['Student', 'Working Professional', 'Freelancer', 'Business Owner', 'Content Creator', 'Other']:
        return jsonify({'success': False, 'message': 'Please select a valid profession.'}), 400

    try:
        annual_income = float(data.get('annual_income', user['annual_income']))
        current_savings = float(data.get('current_savings', user['current_savings']))
    except (TypeError, ValueError):
        return jsonify({'success': False, 'message': 'Income and savings values must be numeric.'}), 400

    if annual_income <= 0:
        return jsonify({'success': False, 'message': 'Annual Income must be greater than 0.'}), 400
    if current_savings < 0:
        return jsonify({'success': False, 'message': 'Current Savings cannot be negative.'}), 400

    updated_at = datetime.utcnow().isoformat()
    execute_db(
        '''UPDATE users SET first_name = ?, last_name = ?, profession = ?, annual_income = ?, current_savings = ?, updated_at = ? WHERE id = ?''',
        (first_name, last_name, profession, annual_income, current_savings, updated_at, user['id'])
    )

    updated_user = get_user_by_id(user['id'])
    return jsonify({'success': True, 'message': 'Profile updated successfully.', 'user': format_user(updated_user)})

@app.route('/api/change-password', methods=['PUT'])
@auth_required
@csrf_protect
@handle_exceptions
def change_password():
    user = current_user()
    data = request.json or {}
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not check_password(current_password, user['password_hash']):
        return jsonify({'success': False, 'message': 'Current password is incorrect.'}), 400
    if new_password != confirm_password:
        return jsonify({'success': False, 'message': 'New passwords do not match.'}), 400
    password_error = validate_password(new_password)
    if password_error:
        return jsonify({'success': False, 'message': password_error}), 400

    password_hash = hash_password(new_password)
    updated_at = datetime.utcnow().isoformat()
    execute_db('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', (password_hash, updated_at, user['id']))
    return jsonify({'success': True, 'message': 'Password updated successfully.'})

@app.route('/api/reset-password-request', methods=['POST'])
@handle_exceptions
def request_password_reset():
    data = request.json or {}
    email = (data.get('email') or '').strip().lower()

    if not email:
        return jsonify({'success': False, 'message': 'Email is required.'}), 400

    email_error = validate_email(email)
    if email_error:
        return jsonify({'success': True, 'message': 'If that email exists, a reset link will be sent.'})

    user = get_user_by_email(email)
    if user:
        token = generate_reset_token(email)
        execute_db('INSERT INTO password_resets (email, token, created_at) VALUES (?, ?, ?)', (email, token, datetime.utcnow().isoformat()))
        reset_url = f'http://localhost:5173/reset-password?token={token}'
        return jsonify({'success': True, 'message': 'Password reset link created.', 'reset_url': reset_url})

    return jsonify({'success': True, 'message': 'If that email exists, a reset link will be sent.'})

@app.route('/api/reset-password', methods=['POST'])
@handle_exceptions
def reset_password():
    data = request.json or {}
    token = data.get('token', '')
    new_password = data.get('new_password', '')
    confirm_password = data.get('confirm_password', '')

    if not token:
        return jsonify({'success': False, 'message': 'Reset token is required.'}), 400
    if new_password != confirm_password:
        return jsonify({'success': False, 'message': 'Passwords do not match.'}), 400

    email = verify_reset_token(token)
    if not email:
        return jsonify({'success': False, 'message': 'Invalid or expired reset token.'}), 400

    user = get_user_by_email(email)
    if not user:
        return jsonify({'success': False, 'message': 'User account not found.'}), 400

    password_error = validate_password(new_password)
    if password_error:
        return jsonify({'success': False, 'message': password_error}), 400

    password_hash = hash_password(new_password)
    execute_db('UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?', (password_hash, datetime.utcnow().isoformat(), email))
    return jsonify({'success': True, 'message': 'Password has been reset successfully.'})

@app.route('/api/expenses', methods=['GET', 'POST'])
@auth_required
@csrf_protect
def expenses():
    """API endpoint to manage expenses"""
    try:
        user = current_user()
        if request.method == 'POST':
            data = request.json or {}
            required_fields = ['vendor', 'amount', 'category', 'date']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'Missing required field: {field}'}), 400

            try:
                amount_value = float(data['amount'])
                if amount_value <= 0:
                    return jsonify({'success': False, 'message': 'Amount must be greater than 0.'}), 400
            except (ValueError, TypeError):
                return jsonify({'success': False, 'message': 'Amount must be a valid number.'}), 400

            if not data['vendor'].strip():
                return jsonify({'success': False, 'message': 'Vendor name cannot be empty.'}), 400
            if not data['category'].strip():
                return jsonify({'success': False, 'message': 'Category must be selected.'}), 400

            date_value = str(data['date']).strip()
            try:
                parsed_date = datetime.strptime(date_value, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({'success': False, 'message': 'Date must use YYYY-MM-DD format.'}), 400
            if parsed_date > datetime.now().date():
                return jsonify({'success': False, 'message': 'Date cannot be in the future.'}), 400

            expense = {
                'user_id': user['id'],
                'vendor': data['vendor'].strip(),
                'amount': amount_value,
                'currency': data.get('currency', 'INR').strip(),
                'category': data['category'].strip(),
                'date': date_value,
                'description': str(data.get('description', '')).strip(),
                'items': json.dumps(data.get('items', [])),
                'created_at': datetime.utcnow().isoformat()
            }

            expense_id = execute_db(
                '''INSERT INTO expenses (user_id, vendor, amount, currency, category, date, description, items, created_at)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                (expense['user_id'], expense['vendor'], expense['amount'], expense['currency'], expense['category'], expense['date'], expense['description'], expense['items'], expense['created_at'])
            )

            expense['id'] = expense_id
            expense['items'] = data.get('items', [])
            return jsonify({'success': True, 'message': 'Expense added successfully', 'expense': expense})

        # GET expenses
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        category = request.args.get('category')

        query = 'SELECT * FROM expenses WHERE user_id = ?'
        params = [user['id']]

        expenses = query_db(query, tuple(params))
        expense_list = []
        for row in expenses:
            expense_data = dict(row)
            expense_data['items'] = json.loads(expense_data.get('items') or '[]')
            expense_list.append(expense_data)

        if start_date:
            expense_list = [e for e in expense_list if str(e.get('date', '')) >= start_date]
        if end_date:
            expense_list = [e for e in expense_list if str(e.get('date', '')) <= end_date]
        if category and category != 'All Categories':
            expense_list = [e for e in expense_list if e['category'] == category]

        expense_list.sort(key=lambda x: str(x.get('date', '')), reverse=True)
        return jsonify({'success': True, 'expenses': expense_list, 'total': len(expense_list)})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
@auth_required
@csrf_protect
def update_expense(expense_id):
    try:
        user = current_user()
        expense = query_db('SELECT * FROM expenses WHERE id = ? AND user_id = ?', (expense_id, user['id']), one=True)
        if not expense:
            return jsonify({'success': False, 'message': 'Expense not found.'}), 404

        data = request.json or {}
        required_fields = ['vendor', 'amount', 'category', 'date']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'success': False, 'message': f'{field.replace("_", " ").title()} is required.'}), 400

        try:
            amount_value = float(data['amount'])
            if amount_value <= 0:
                return jsonify({'success': False, 'message': 'Amount must be greater than 0'}), 400
        except (ValueError, TypeError):
            return jsonify({'success': False, 'message': 'Amount must be a valid number'}), 400

        vendor = data['vendor'].strip()
        category = data['category'].strip()
        currency = data.get('currency', 'INR').strip() or 'INR'
        date_value = str(data['date']).strip()

        if not vendor:
            return jsonify({'success': False, 'message': 'Vendor name cannot be empty'}), 400
        if not category:
            return jsonify({'success': False, 'message': 'Category must be selected.'}), 400
        try:
            parsed_date = datetime.strptime(date_value, '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'success': False, 'message': 'Date must use YYYY-MM-DD format.'}), 400
        if parsed_date > datetime.now().date():
            return jsonify({'success': False, 'message': 'Date cannot be in the future.'}), 400

        execute_db(
            '''UPDATE expenses SET vendor = ?, amount = ?, currency = ?, category = ?, date = ?, description = ?, items = ? WHERE id = ? AND user_id = ?''',
            (vendor, amount_value, currency, category, date_value, str(data.get('description', '')).strip(), json.dumps(data.get('items', [])), expense_id, user['id'])
        )

        updated_expense = query_db('SELECT * FROM expenses WHERE id = ? AND user_id = ?', (expense_id, user['id']), one=True)
        expense_data = dict(updated_expense)
        expense_data['items'] = json.loads(expense_data.get('items') or '[]')
        return jsonify({'success': True, 'message': 'Expense updated successfully.', 'expense': expense_data})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@auth_required
@csrf_protect
def delete_expense(expense_id):
    try:
        user = current_user()
        expense = query_db('SELECT * FROM expenses WHERE id = ? AND user_id = ?', (expense_id, user['id']), one=True)
        if not expense:
            return jsonify({'success': False, 'message': 'Expense not found.'}), 404

        execute_db('DELETE FROM expenses WHERE id = ? AND user_id = ?', (expense_id, user['id']))
        return jsonify({'success': True, 'message': 'Expense deleted successfully.'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analytics', methods=['GET'])
@auth_required
def analytics():
    try:
        user = current_user()
        expenses = query_db('SELECT * FROM expenses WHERE user_id = ?', (user['id'],))
        if not expenses:
            return jsonify({'success': True, 'categoryData': [], 'monthlyData': [], 'totalExpenses': 0, 'averageExpense': 0, 'expenseCount': 0})

        category_totals = defaultdict(float)
        monthly_totals = defaultdict(float)
        total_expenses = 0.0

        for row in expenses:
            expense = dict(row)
            amount_inr = float(expense['amount'])
            if expense['currency'] == 'USD':
                amount_inr *= 80

            category_totals[expense['category']] += amount_inr
            total_expenses += amount_inr

            expense_date_str = expense['date']
            if isinstance(expense_date_str, list):
                expense_date_str = expense_date_str[0] if expense_date_str else datetime.now().strftime('%Y-%m-%d')
            try:
                expense_date = datetime.strptime(expense_date_str, '%Y-%m-%d')
                month_key = expense_date.strftime('%Y-%m')
            except (ValueError, TypeError):
                month_key = datetime.now().strftime('%Y-%m')

            monthly_totals[month_key] += amount_inr

        category_data = [{'name': category, 'value': round(amount, 2)} for category, amount in category_totals.items()]
        monthly_data = [{'month': month, 'amount': round(amount, 2)} for month, amount in sorted(monthly_totals.items())]
        average_expense = total_expenses / len(expenses) if expenses else 0

        return jsonify({'success': True, 'categoryData': category_data, 'monthlyData': monthly_data, 'totalExpenses': round(total_expenses, 2), 'averageExpense': round(average_expense, 2), 'expenseCount': len(expenses)})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/expenses/clear', methods=['DELETE'])
@auth_required
@csrf_protect
def clear_expenses():
    try:
        user = current_user()
        execute_db('DELETE FROM expenses WHERE user_id = ?', (user['id'],))
        return jsonify({'success': True, 'message': 'All expenses cleared.'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/upload-bill', methods=['POST'])
@auth_required
@csrf_protect
def upload_bill():
    """Accept bill uploads without requiring optional OCR dependencies at startup."""
    if 'bill' not in request.files and 'file' not in request.files:
        return jsonify({
            'success': False,
            'message': 'Please upload a bill file.'
        }), 400

    uploaded_file = request.files.get('bill') or request.files.get('file')
    if not uploaded_file or not uploaded_file.filename:
        return jsonify({
            'success': False,
            'message': 'Please upload a valid bill file.'
        }), 400

    return jsonify({
        'success': True,
        'message': 'Bill received. OCR extraction is not configured on this deployment.',
        'filename': uploaded_file.filename,
        'extracted': {}
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    expense_count = query_db('SELECT COUNT(*) AS count FROM expenses', one=True)['count']
    return jsonify({
        'status': 'healthy',
        'application': 'FinTrack',
        'expenses_count': expense_count
    })

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

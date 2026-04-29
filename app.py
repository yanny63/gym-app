from flask import Flask, redirect, render_template, session, request, url_for, jsonify
from flask_login import LoginManager, login_user, current_user, UserMixin, logout_user, login_required
from flask_mail import Mail
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import timedelta, datetime, timezone
import requests
import secrets
import psycopg2
import dotenv
import os
import random
import string
import json


def database_connect(database):
    conn = psycopg2.connect(
        host = 'localhost',
        database = database,
        user = os.getenv('DATABASE_USER'),
        password = os.getenv('DATABASE_PASSWORD')
    )
    cur = conn.cursor()
    return conn, cur

app = Flask(__name__)
mail = Mail(app)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_PORT'] = 587
app.config['MAIL_USER'] = os.getenv('MAIL_USER')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')


login_manager = LoginManager(app)
login_manager.login_view = 'login'

class User(UserMixin):
    def __init__(self, id, name, email, role, profile_picture):
        self.id = id
        self.name = name
        self.email = email
        self.role = role
        self.profile_picture = profile_picture

    @staticmethod
    def get(id):
        conn, cur = database_connect('gym_app')
        try:
            cur.execute(
                "SELECT * FROM users WHERE id = %s",
                (id,)
            )
            row = cur.fetchone()
            if not row:
                return None
            return User(
                id = row[0],
                name = row[1],
                email = row[2],
                role = row[4],
                profile_picture = row[7]
            )
        except Exception as e:
            conn.rollback()
            print(f"Error - {e}")
        finally:
            conn.close()

    @staticmethod
    def register(username, email, password, gmail, apple):
        conn, cur = database_connect('gym_app')
        try:
            cur.execute(
                "SELECT * FROM users WHERE username = %s",
                (username,)
            )
            x = cur.fetchone()
            if x:
                return 'username'
            cur.execute(
                "SELECT * FROM users WHERE email = %s",
                (email,)
            )
            x = cur.fetchone()
            if x:
                return 'email'
            hashed = PasswordUtils.hash_password(password)
            cur.execute(
                "INSERT INTO users (username, email, password) VALUES (%s, %s, %s)",
                (username, email, hashed)
            )
            conn.commit()
            return User.get(username)
        except Exception as e:
            conn.rollback()
            print(f"Error - {e}")
        finally:
            conn.close()
        
    @staticmethod
    def login(user, password):
        conn, cur = database_connect('gym_app')
        try:
            if '@' in user:
                cur.execute(
                    "SELECT * FROM users WHERE email = %s",
                    (user,)
                )
                row = cur.fetchone()
                if not row:
                    return 'No_user'
                hashed = row[3]
                if not PasswordUtils.check_password(hashed, password):
                    return False
                return User(
                    id = row[0],
                    name = row[1],
                    email = user,
                    role = row[4],
                    profile_picture = row[7]
                )
            else:
                cur.execute(
                    "SELECT * FROM users WHERE username = %s",
                    (user,)
                )
                r = cur.fetchone()
                if not r:
                    return 'No_user'
                h = r[3]
                if not PasswordUtils.check_password(h, password):
                    return False
                return User(
                    id = r[0],
                    name = user,
                    email = r[2],
                    role = r[4],
                    profile_picture = r[7]
                )
        except Exception as e:
            print(F"Error - {e}")
        finally:
            conn.close()

class PasswordUtils:
    @staticmethod
    def hash_password(password):
        return generate_password_hash(password)

    @staticmethod 
    def check_password(hashed, password):
        return check_password_hash(hashed, password)
    
    @staticmethod
    def is_strong(password):
        return (
            len(password) >= 8 and
            any(c.isupper() for c in password) and 
            any(c.isdigit() for c in password)
        )

    @staticmethod
    def generate_password():
        special_chars = ['?', '!', '@', '#', '$', '&', '*', '_', '-']
        while True:
            x = random.randint(6, 12)
            generated = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(x))
            p_specials = random.sample(special_chars, random.randint(1, x))

            for i in p_specials:
                index = random.randint(0, len(generated))
                generated = generated[:index] + i + generated[index:]

            if PasswordUtils.is_strong(generated):
                return generated

    @staticmethod
    def generate_token():
        token = "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(6))
        return token

@login_manager.user_loader
def user_get(id):
    return User.get(id)

dotenv.load_dotenv()


@app.route("/")
def home():
    return render_template("index.html")

@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect("/")
    
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        language = data.get('language')
        if language == 'pl':
            u_taken = 'Ta nazwa użytkownika jest zajęta.'
            e_taken = 'Ten email jest już zajęty.'
            p_not_strong = 'Hasło jest za słabe.'
        elif language == 'es':
            u_taken = 'Este nombre de usuario ya está en uso.'
            e_taken = 'Este correo ya está registrado.'
            p_not_strong = 'Esta contraseña es demasiado débil.'
        else:
            u_taken = 'This username is already taken.'
            e_taken = 'This email is already taken.'
            p_not_strong = 'This password is too weak.'

        if not PasswordUtils.is_strong(password):
            return {"error": p_not_strong, "input": "password"}

        user = User.register(username, email, password, False, False)

        if user == 'username':
            return {"error": u_taken, "input": "username"}
        if user == 'email':
            return {"error": e_taken, "input": "email"}

        login_user(user, remember=True, duration=timedelta(days=4))
        return {"success": True}
    
    return render_template('register.html')


@app.route("/google")
def google():
    if current_user.is_authenticated:
        return redirect("/")

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect("/")
    
    if request.method == 'POST':
        data = request.get_json()
        user = data.get("user")
        password = data.get("password")
        language = data.get("language")

        if language == 'pl':
            invalid_credentials = 'Nieprawidłowe dane logowania.'
        elif language == 'es':
            invalid_credentials = 'Credenciales incorrectas.'
        else:
            invalid_credentials = 'Invalid login credentials.'

        u = User.login(user, password)
        if not u:
            return {"error": invalid_credentials, "input": "user"}
        elif u == 'No_user':
            return {"error": invalid_credentials}
        else:
            login_user(u)
            return {"success": True}
            
    return render_template('login.html')

@app.route("/training")
def training():
    return render_template("training.html")

@app.route("/API/training")
def training_api():
    conn, cur = database_connect('gym_app')

    if not current_user.is_authenticated:
        return "", 404
    user_id = current_user.id
    x = datetime.now()
    date = x.strftime("%Y-%m-%d")
    print(date)
    parsed_date = x - timedelta(days=7)
    parsed_date = parsed_date.strftime("%Y-%m-%d")
    try:
        cur.execute(
            "SELECT id, training_name, exercises FROM training_sessions WHERE user_id = %s AND date = %s",
            (user_id, parsed_date)
        )
        row = cur.fetchone()
        print(row)
        cur.execute(
            "SELECT id, training_name, exercises FROM training_sessions WHERE user_id = %s AND date = %s",
            (user_id, date)
        )
        second_row = cur.fetchone()
        print(second_row)
        if not row and not second_row:
            return "", 404
        if row:
            t_session = {}
            t_session['name'] = row[1]
            t_session['exercises'] = row[2]
        else:
            t_session = {}
            t_session['name'] = second_row[1]
            t_session['exercises'] = second_row[2]

        cur.execute(
            "SELECT id, goal FROM goals WHERE user_id = %s AND done = %s",
            (user_id, False)
        )
        rows = cur.fetchall()
        goals = []
        for x in rows:
            d = {}
            d['id'] = x[0]
            d['goal'] = x[1]
            goals.append(d)

        return {"session": t_session, "goals": goals}

    except Exception as e:
        print(f"Error - {e}")
        conn.rollback()
    finally:
        conn.close()

@app.route("/API/training/newsession", methods=['POST'])
def newSession():
    if not current_user.is_authenticated:
        return "", 401
    conn, cur = database_connect('gym_app')
    data = request.get_json()
    values = data.get('values')
    nazwa = values.get('trainingName')
    del values['trainingName']
    user_id = current_user.id
    exercises = json.dumps(values)
    try:
        cur.execute(
            "INSERT INTO training_sessions (user_id, training_name, exercises) VALUES (%s, %s, %s)",
            (user_id, nazwa, exercises)
        )
        conn.commit()
        return {'success': True}, 201
    except Exception as e:
        conn.rollback()
        print(f"Error - {e}")
    finally:
        conn.close()

@app.route("/API/training/lastsessions")
def lastSessions():
    if not current_user.is_authenticated:
        return "", 404
    conn, cur = database_connect('gym_app')
    user_id = current_user.id 
    try:
        cur.execute(
            "SELECT id, training_name, exercises, date FROM training_sessions WHERE user_id = %s ORDER BY date DESC LIMIT 5",
            (user_id,)
        )
        rows = cur.fetchall()
        sessions = []
        for row in rows:
            s = {}
            s['id'] = row[0]
            s['name'] = row[1]
            s['exercises'] = row[2]
            s['date'] = row[3].strftime("%Y-%m-%d")
            sessions.append(s)
        print(sessions)
        return {"sessions": sessions}
    except Exception as e:
        print(f"Error - {e}")
        conn.rollback()
    finally:
        conn.close()

@app.route('/API/training/goals', methods=['POST'])
def goals():
    conn, cur = database_connect('gym_app')
    if not current_user.is_authenticated:
        return "", 401
    user_id = current_user.id 
    print(user_id)
    data = request.get_json()
    goal = data.get('goal')
    try: 
        cur.execute(
            "INSERT INTO goals (user_id, goal) VALUES (%s, %s)",
            (user_id, goal)
        )
        conn.commit()
        return {"success": True}, 201
    except Exception as e:
        print(f"Error - {e}")
        conn.rollback()
    finally:
        conn.close()

app.route("/API/training/goalDone")
def goalDone():
    conn, cur = database_connect('gym_app')
    data = request.get_json()
    if not data:
        return "", 400
    goal_id = data.get('id')
    if not goal_id:
        return "", 400

    try:
        cur.execute(
            "UPDATE goals SET done = %s WHERE id = %s",
            (True, goal_id)
        )
        conn.commit()
        return "", 200
    except Exception as e:
        print(f"Error - {e}")
        conn.rollback()
    finally:
        conn.close()

@app.route("/calculator")
def calculator():
    return render_template('calculator.html')

@app.route("/API/calculator", methods=['POST'])
def calculate():

    data = request.get_json()

    if data.get("type") == 'one-rep':
        weight = data.get('weight')
        weight = int(weight)
        reps = data.get('reps')
        reps = int(reps)
        
        if reps >= 1 and reps <= 3:
            result = weight * 36 / (37 - reps)
            return {"result": round(result, 2)}
        elif reps > 3 and reps <= 10:
            result = weight * (1 + reps / 30)
            return {"result": round(result, 2)}
        elif reps > 10:
            result = (100 * weight) / (101.3 - 2.67123 * reps)
            return {"result": round(result, 2)}
        else:
            return "", 400
        
    if data.get("type") == 'calories':
        weight = data.get('weight')
        weight = int(weight)
        height = data.get('height')
        height = int(height)
        age = data.get('age')
        age = int(age)
        gender = data.get('gender')
        activity = data.get('activity')
        activity = float(activity)

        if gender == 'male':
            bmr = 10 * weight + 6.25 * height - 5 * age  + 5
            caloric_intake = bmr * activity
            return {"intake": caloric_intake}
        elif gender == 'female':
            bmr = 10 * weight + 6.25 * height - 5 * age  - 161
            caloric_intake = bmr * activity
            return {"intake": caloric_intake}
        else:
            return "", 400

    return {"status": "ok"}

@app.route("/timer")
def timer():
    return render_template('timer.html')

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8080,
        debug=True
    )
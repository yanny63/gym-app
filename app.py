from flask import Flask, redirect, render_template, session, request, url_for, jsonify
from flask_login import LoginManager, login_user, current_user, UserMixin, logout_user, login_required
from flask_mail import Mail
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import timedelta, datetime
import requests
import secrets
import psycopg2
import dotenv
import os
import random
import string


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
    def __init__(self, id, name, email, role):
        self.id = id
        self.name = name
        self.email = email
        self.role = role

    @staticmethod
    def get(username):
        conn, cur = database_connect('gym_app')
        try:
            cur.execute(
                "SELECT * FROM users WHERE username = %s",
                (username,)
            )
            row = cur.fetchone()
            if not row:
                return False
            return User(
                id = row[0],
                name = username,
                email = row[2],
                role = row[4]
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
    def login(email, password):
        conn, cur = database_connect('gym_app')
        try:
            cur.execute(
                "SELECT * FROM users WHERE email = %s",
                (email,)
            )
            row = cur.fetchone()
            if not row:
                return False
            hashed = row[3]
            if not PasswordUtils.check_password(hashed, password):
                return False
            return User(
                id = row[0],
                username = row[1],
                email = email,
                role = row[4]
            )
        except Exception as e:
            print(F"Error - {e}")
        finally:
            conn.close()

class PasswordUtils():
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

@app.route('/login')
def login():
    
    return render_template('login.html')

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8080,
        debug=True
    )
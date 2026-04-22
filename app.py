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
    def __init__(self, id, name, email, role, profile_picture):
        self.id = id
        self.name = name
        self.email = email
        self.role = role
        self.profile_picture = profile_picture

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
                return None
            return User(
                id = row[0],
                name = username,
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
                    username = row[1],
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
                    profile_picture = row[7]
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

# class FileManager:
#     def __init__(self, path):
#         self.path = path
#         self.history = []
#         self.name = None

#     def saveFile(self):
#         path = f"images/{self.name}"
#         if os.path.exists(path):
#             self.history.append(f"Replaced: {path}")
#             os.replace(path)
#             return 'Replaced'
#         else:
#             os.path.join('images', self.name)
#             return 'Saved'
        
#     def getFile(self):
#         if self.name is None:
#             return 'No such file'
#         self.history.append(f"Got file: {datetime.now()}")
#         path = f"images/{self.name}"
#         return path
    
#     def extentionCheck(self, name):
#         allowed_extentions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
#         extention = name.split(".")[1]
#         if not extention in allowed_extentions:
#             return False
#         self.name = name
#         return True
    
#     def getHistory(self):
#         return self.history


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

@app.route("/calculator")
def calculator():
    return render_template('calculator.html')

@app.route("/API/calculator", methods=['POST'])
def calculate():

    data = request.get_json()

    if data.get("type") == 'one-rep':
        weight = data.get('weight')
        reps = data.get('reps')
        
        if reps >= 1 and reps <= 3:
            result = weight * 36 / (37 - reps)
            return {"result": result}
        elif reps > 3 and reps <= 10:
            result = weight * (1 + reps / 30)
            return {"result": result}
        elif reps > 10:
            result = (100 * weight) / (101.3 - 2.67123 * reps)
            return {"result": result}
        else:
            return "", 400
        
    if data.get("type") == 'calories':
        weight = data.get('weight')
        height = data.get('height')
        age = data.get('age')
        gender = data.get('gender')
        activity = data.get('activity')

        if gender == 'male':
            bmr = 10 * weight + 6.25 * height - 5 * age  + 5
            caloric_intake = bmr * int(activity)
            return {"intake": caloric_intake}
        elif gender == 'female':
            bmr = 10 * weight + 6.25 * height - 5 * age  - 161
            caloric_intake = bmr * int(activity)
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
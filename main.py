import json
import random
from urllib import request
from flask import Flask, jsonify, redirect, url_for, request, render_template, session, request, Response, send_from_directory, flash
from flask_sqlalchemy import SQLAlchemy
from datetime import timedelta
from flask_login import LoginManager, UserMixin, current_user, login_user, logout_user, login_required
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from datetime import datetime
import urllib.parse
from sqlalchemy.exc import IntegrityError
# from flask_migrate import Migrate
from sqlalchemy import or_
# from  flask_wtf.csrf import CSRFProtect
# from flask_wtf import FlaskForm
# from flask_wtf.file import FileField, FileAllowed
from werkzeug.utils import secure_filename


# API settings for google maps 
from dotenv import load_dotenv
import os

load_dotenv()

# grabs info from another file 
# key = os.getenv('KEY')

# CREATE - POST 
# READ - GET 
# UPDATE - PUT
# DELETE - DELETE 


# create app that will be ran 
app = Flask(__name__, template_folder='templates', static_folder='static')

# create a database for user information
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///storage.sqlite3"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# set optional bootswatch theme
app.config['FLASK_ADMIN_SWATCH'] = 'cerulean'
app.config['UPLOAD_FOLDER'] = os.path.join('static', 'uploads')
# maybe allow gifs (not yet)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# csrf = CSRFProtect(app)
db = SQLAlchemy(app)
# migrate = Migrate(app, db)

# initialize Flask-Login
login_manager = LoginManager(app)
login_manager.login_view = 'login'
key = os.getenv('FLASK_KEY')
app.secret_key = key


# Data Models  
class Account(UserMixin, db.Model): 
    id = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(100), nullable = False, unique=True)
    password = db.Column(db.String(100), nullable = False)
    reviews = db.relationship('Review', backref='author', lazy=True)
    picture = db.Column(db.String(255), nullable=True)
    # good idea to have tiers of users (possible subscription based for premium / admin)
    # acc_status = db.Column(db.Integer, nullable = False)

    def get_id(self): 
        return self.id
    
    def password_auth(self, password): 
        return self.password == password

    # def acc_status_auth(self): 
    #     return self.acc_status

class Review(db.Model): 
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    marker_id = db.Column(db.String, db.ForeignKey('marker.id'))
    marker = db.relationship('Marker', backref=db.backref('reviews', lazy='dynamic'))

class Marker(db.Model): 
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)
    title = db.Column(db.String, nullable=False)

    def to_dict(self): 
        return {
            'id': self.id,
            'lat': self.lat, 
            'lng': self.lng, 
            'title': self.title,
        }

class Following(db.Model): 
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    friend_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)

    def to_dict(self):
        return {
            'user_id': self.user_id,
            'friend_id': self.friend_id,
        }

@login_manager.user_loader
def load_user(user_id): 
    return Account.query.get(int(user_id))

@app.route('/')
def loadloginpage(): 
    return render_template('login.html')



@app.route('/logout', methods=['POST'])
@login_required 
def logout(): 
    # token = request.form.get('token')

    # if csrf.validate_csrf_token(token): 
    #     logout_user() 
    #     return jsonify({'redirect': url_for('loadloginpage')})
    # else: 
    #     return jsonify({'error': 'Invalid token. Nice try.'})
    logout_user()
    # return jsonify({'redirect': url_for('loadloginpage')})
    return render_template('login.html')
    

@app.route('/home')
@login_required
def home(): 
    # test
    username = current_user.username
    # passing in the key in order to utilize api on the homepage
    key = os.getenv('KEY')
    mapid = os.getenv('MAP')
    return render_template('home.html', username=username, key=key, mapid=mapid)
    # return render_template('home.html')

@app.route('/login', methods=['POST'])
def login(): 
    data = request.json 
    user = Account.query.filter_by(username = data['username']).first() 
    if user is None or not user.password_auth(data['password']): 
        return jsonify({'error': 'Invalid username or password'})
    else: 
        login_user(user)
        return jsonify({'message': 'Login successful', 'redirect': '/home'})
        # return render_template('home.html')
    

@app.route('/loadregisterpage', methods=['GET'])
def loadregister(): 
    return render_template('register.html')

@app.route('/register', methods=['POST']) 
def register(): 
    if request.method == 'POST': 
        data = request.json 
        # print(data)
        username = data['username']
        password = data['password']
        confirm = data['cpass']


        user = Account.query.filter_by(username=username).first() 

        if user: 
            return jsonify({'error': 'That name has been taken!'})
        elif confirm != password: 
            return jsonify({'error': 'Passwords must match!'})
        else: 
            new_user = Account(username=username, password=password)
            db.session.add(new_user)
            db.session.commit()
            
            return jsonify({'message': 'Registration successful', 'redirect': '/'})

@app.route('/add_marker', methods=['POST'])
def add_marker(): 
    data = request.json

    # ensure if fields are valid
    if 'lat' not in data or 'lng' not in data: 
        return jsonify({'error': 'Lat and long are required'}), 400
    
    exist_marker = Marker.query.filter_by(lat=data['lat'], lng=data['lng']).first()
    if exist_marker: 
        return jsonify({'message': 'Marker already exists', 'marker_id': exist_marker.id})
    
    new_marker = Marker(lat=data['lat'], lng=data['lng'], title=data.get('title'))

    try: 
        db.session.add(new_marker)
        db.session.commit()
        return jsonify({'message': 'Marker added successfully', 'marker_id': new_marker.id})

    except IntegrityError: 
        db.session.rollback()
        existing_marker = Marker.query.filter_by(lat=data['lat'], lng=data['lng']).first()
        return jsonify({'message': 'Marker already exists', 'marker_id': existing_marker.id})

@app.route('/follow', methods=['POST'])
def folow_user(): 
    data = request.json

    if 'follower_id' not in data or 'followed_id' not in data: 
        return jsonify({'error': 'Invalid request, user is not specified'})
    
    follower_id = data['follower_id']
    followed_id = data['followed_id']

    exist = Following.query.filter_by(user_id=follower_id, friend_id=followed_id).first()

    if exist: 
        return jsonify({'message': 'You are already following this user'}), 200 
    
    new = Following(user_id=follower_id, friend_id=followed_id)
    db.session.add(new)
    db.session.commit()

    return jsonify({'message': 'You are now following this user'}), 201

@app.route('/unfollow', methods=['DELETE'])
def unfollow_user(): 
    data = request.json

    if 'follower_id' not in data or 'followed_id' not in data: 
        return jsonify({'error': 'Invalid request, user is not specified'}), 400
    
    follower_id = data['follower_id']
    followed_id = data['followed_id']

    delete = Following.query.filter_by(user_id=follower_id, friend_id=followed_id).first()

    if delete:
        db.session.delete(delete)
        db.session.commit()
        return jsonify({'message': 'Unfollow success'}), 200 
    else: 
        return jsonify({'message': 'Error DNE'})

@app.route('/search_users')
def search_user(): 
    search_term = request.args.get('term')

    # match = Account.query.filter(Account.username.ilike(f'%{search_term}%')).all()
    match = Account.query.filter(or_(
        Account.username.like(f'{search_term}%'),
        Account.username.like(f'{search_term.capitalize()}%')
    )).all()

    user_list = [{'id': user.id, 'username': user.username} for user in match]

    print(user_list)

    return jsonify(user_list)

@app.route('/profile', methods=['GET']) 
def profile(): 
    username = current_user.username
    return render_template('profile.html', username=username)

def allowed_file(filename): 
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    if request.method == 'POST':
        if 'profile_picture' not in request.files:
            flash('No file available')
            return redirect(request.url)

        file = request.files['profile_picture']

        if file.filename == '':
            flash('No file selected')
            return redirect(request.url)

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

            current_user.picture = filename
            db.session.commit()

            flash('Profile picture uploaded successfully.')

    return redirect(url_for('profile'))
    

# this should create the database upon activating file 
if __name__ == '__main__': 
    with app.app_context(): 
        db.create_all() 
    app.run(debug=True)
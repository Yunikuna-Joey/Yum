import json
import random
from datetime import datetime, timezone, timedelta
from urllib import request
from flask import Flask, jsonify, redirect, url_for, request, render_template, session, request, Response, send_from_directory, flash
from flask_sqlalchemy import SQLAlchemy
from datetime import timedelta
from flask_login import LoginManager, UserMixin, current_user, login_user, logout_user, login_required
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from datetime import datetime
from sqlalchemy.exc import IntegrityError
from flask_migrate import Migrate
from sqlalchemy import or_, func
from flask_wtf.csrf import CSRFProtect
# from flask_wtf import FlaskForm
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from sqlalchemy.orm import Session
from markupsafe import escape
import re
# sanitation library
import bleach
from bleach.css_sanitizer import CSSSanitizer
# empty list means no css allowed
css_sanitizer = CSSSanitizer(allowed_css_properties=[])


# API settings for google maps 
from dotenv import load_dotenv
import os

load_dotenv()


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
migrate = Migrate(app, db)

# initialize Flask-Login
login_manager = LoginManager(app)
login_manager.login_view = 'login'
key = os.getenv('FLASK_KEY')
app.secret_key = key


# Data Models  
class Account(UserMixin, db.Model): 
    id = db.Column(db.Integer, primary_key = True)
    display_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), nullable=False, unique=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    password_hash = db.Column(db.String(128), nullable = False)
    reviews = db.relationship('Review', backref='author', lazy=True, overlaps="user_reviews")
    picture = db.Column(db.String(255), nullable=True)
    # good idea to have tiers of users (possible subscription based for premium / admin)
    # acc_status = db.Column(db.Integer, nullable = False)

    def get_id(self): 
        return self.id
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password): 
        return check_password_hash(self.password_hash, password)
    
    # def password_auth(self, password): 
    #     return self.password == password

    # def acc_status_auth(self): 
    #     return self.acc_status

class Review(db.Model): 
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    content = db.Column(db.Text, nullable=False)
    rating = db.Column(db.Integer, nullable=False)
    account_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    account = db.relationship('Account', backref=db.backref('user_reviews', lazy=True), overlaps="reviews")
    place_id = db.Column(db.String, nullable=False)

    def to_dict(self):
        return {
            'id': self.id, 
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'content': self.content,
            'rating': self.rating, 
            'account_id': self.account_id, 
            'place_id': self.place_id,
        }

class Marker(db.Model): 
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String, nullable=False)
    address = db.Column(db.string)
    place_id = db.Column(db.String)
    lat = db.Column(db.Float, nullable=False)
    lng = db.Column(db.Float, nullable=False)

    def to_dict(self): 
        return {
            'id': self.id,
            'title': self.title,
            'address': self.address,
            'place_id': self.place_id,
            'lat': self.lat, 
            'lng': self.lng, 
        }

class Following(db.Model): 
    id = db.Column(db.Integer, primary_key=True)
    # initiated following  (follower)
    user_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    # Following
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
    logout_user()
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

# not necessary for sanzing
@app.route('/login', methods=['POST'])
def login(): 
    data = request.json 
    # * New changes for hashing and salting 
    user = Account.query.filter_by(username=data['username']).first()

    if user is None or not user.check_password(data['password_hash']): 
        return jsonify({'Error: ', 'Invalid username or password'})
    
    else: 
        login_user(user)
        return jsonify({'message': 'Login successful', 'redirect': '/home'})

    

@app.route('/loadregisterpage', methods=['GET'])
def loadregister(): 
    return render_template('register.html')

# implement sanzing here
@app.route('/register', methods=['POST']) 
def register(): 
    if request.method == 'POST': 
        data = request.json 

        displayName = bleach.clean(data.get('displayName', ''), 
            tags=[], 
            attributes={}, 
            css_sanitizer=css_sanitizer, 
            strip=True,
            strip_comments=True)
        
        email = bleach.clean(data.get('email', ''), 
            tags = [], 
            attributes={}, 
            css_sanitizer=css_sanitizer, 
            strip=True,
            strip_comments=True)
        
        username = bleach.clean(data.get('username', ''), 
            tags=[],
            attributes={},
            css_sanitizer=css_sanitizer, 
            strip=True,
            strip_comments=True)
        
        username = username.strip()
        
        password = bleach.clean(data.get('password', ''), 
            tags=[], 
            attributes={}, 
            css_sanitizer=css_sanitizer,
            strip=True,
            strip_comments=True)
        
        confirm = bleach.clean(data.get('cpass', ''), 
            tags=[], 
            attributes={}, 
            css_sanitizer=css_sanitizer,
            strip=True,
            strip_comments=True)


        user = Account.query.filter(func.lower(Account.username) == func.lower(username)).first() 
        user_email = Account.query.filter(func.lower(Account.email) == func.lower(email)).first()

        if user: 
            return jsonify({'error': 'That name has been taken!'})
        elif user_email:
            return jsonify({'error': 'Email already in use'})
        elif not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return jsonify({'error': 'Invalid email address'})
        elif confirm != password: 
            return jsonify({'error': 'Passwords must match!'})
        elif len(confirm) < 8:
            return jsonify({'error': 'Your password must be at least 8 characters long!'})
        elif not re.search(r'[!@#$%^&*(),.?":{}|<>]', password): 
            return jsonify({'error': 'Your password must contain at least one symbol!'})
        elif not re.search(r'[A-Z]', password): 
            return jsonify({'error': 'Your password must contain an uppercase letter!'})
        else: 
            new_user = Account(username=username, display_name=displayName, email=email)
            # * we hash the password here
            new_user.set_password(password) 
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
    
    new_marker = Marker(lat=data['lat'], lng=data['lng'], title=data.get('title'), place_id=data.get('place_id'))

    try: 
        db.session.add(new_marker)
        db.session.commit()
        return jsonify({'message': 'Marker added successfully', 'marker_id': new_marker.id})

    except IntegrityError: 
        db.session.rollback()
        existing_marker = Marker.query.filter_by(lat=data['lat'], lng=data['lng']).first()
        return jsonify({'message': 'Marker already exists', 'marker_id': existing_marker.id})

@app.route('/submit_review', methods=['POST'])
@login_required
def submit_review(): 
    data = request.json 
    
    place_id = data.get('place_id')
    content = data.get('content')
    rating = data.get('rating')

    # Determine if marker is in db 
    marker = Marker.query.filter_by(place_id=place_id).first()

    if not marker: 
        response = {'status': 'error', 'message': 'Invalid marker'}
        return jsonify(response), 400 
    
    sanitize = bleach.clean(
        # target 
        content, 
        # removes html tags 
        tags=[], 
        # removes html attributes
        attributes={}, 
        # removes any style so no CSS (not working on this version of bleach library)
        css_sanitizer=css_sanitizer,
        # we want to remove it from the content 
        strip=True, 
        # remove trailing and / or leading whitespaces
        # strip_whitespace=True,
        # removes any html comments
        strip_comments=True,
        # escapes special characters 
        # escape=True
    )
    pst = datetime.utcnow().replace(tzinfo=timezone.utc).astimezone(timezone(timedelta(hours=-8)))
    
    # save review into db [left var is db = right var is variable within function]
    new = Review(content=sanitize, rating=rating, account_id=current_user.id, place_id=marker.place_id, timestamp=pst)
    db.session.add(new)
    db.session.commit()

    response = {'status': 'success', 'message': 'Review submitted successfully'}
    return jsonify(response)

@app.route('/check_review_status', methods=['POST'])
@login_required
def check_review_status(): 
        data = request.json
        place_id = data.get('place_id')

        # check if current_user has submitted a review
        user_review = Review.query.filter_by(account_id=current_user.id, place_id=place_id).first()

        if user_review: 
            response = {'status': 'reviewed', 'rating': user_review.rating}
        else: 
            response = {'status': 'not_reviewed'}
        
        return jsonify(response)


@app.route('/follow/<int:user_id>', methods=['POST'])
@login_required
def follow_user(user_id): 
    data = request.json

    person_id = data.get('user_id')
    friend_id = data.get('friend_id')


    if person_id is None or friend_id is None: 
        return jsonify({'error': 'Invalid request, user is not specified'})
    
    # * new changes here and test 
    if not Following.query.filter_by(user_id=person_id, friend_id=friend_id).first(): 
        entry = Following(user_id=person_id, friend_id=friend_id) 
        db.session.add(entry)
        db.session.commit() 
        print('Success follow')
        return jsonify({'message': 'You are now folowing this user '}), 200 
    
    else: 
        return jsonify({'error': 'Already following'}), 400 


@app.route('/unfollow/<int:user_id>', methods=['POST'])
@login_required
def unfollow_user(user_id): 
    data = request.json

    person_id = data.get('user_id')
    friend_id = data.get('friend_id')

    if person_id is None or friend_id is None: 
        return jsonify({'error': 'Invalid request, user is not specified'}), 400
    
    delete = Following.query.filter_by(user_id=person_id, friend_id=friend_id).first()

    if delete:
        db.session.delete(delete)
        db.session.commit()
        return jsonify({'message': 'Unfollow success'}), 200 
    else: 
        return jsonify({'message': 'Error DNE'})

@app.route('/search_users')
@login_required
def search_user(): 
    search_term = request.args.get('term')

    match = Account.query.filter(or_(
        Account.username.like(f'{search_term}%'),
        Account.username.like(f'{search_term.capitalize()}%')
    )).all()

    user_list = [{'id': user.id, 'username': user.username} for user in match]

    print(user_list)

    return jsonify(user_list)

@app.route('/feed', methods=['GET'])
@login_required 
def loadFeedPage(): 
    username = current_user.username 
    gather_following = [following.friend_id for following in Following.query.filter_by(user_id=current_user.id).all()]
    following_reviews = Review.query.filter(Review.account_id.in_(gather_following)).all()

    status_updates = [] 
    for item in following_reviews:
        status_updates.append({
            'content': item.content,
            'rating': item.rating, 
            'author_display_name': item.author.display_name, 
        }) 

    return render_template('feed.html', username=username, status=status_updates)

# *This is going to be for current user
@app.route('/profile', methods=['GET']) 
@login_required
def profile(): 
    # username will show on the page
    username = current_user.username

    # query the reviews associated with the current-user
    review = Review.query.filter_by(account_id=current_user.id).all() 
    # review_data = [{'content': item.content, 'rating': item.rating} for item in review]
    review_data = []
    # packs all the necessary data into the object 
    for item in review: 
        marker = Marker.query.filter_by(place_id=item.place_id).first()
        if marker: 
            review_data.append({
                'content': item.content, 
                'rating': item.rating, 
                'place_title': marker.title,
            })

    print(review_data)
    return render_template('profile.html', username=username, reviews=review_data)

# *This is going to be for loading OTHER users
@app.route('/profile/<username>')
@login_required 
def loadProfile(username): 
    user = Account.query.filter_by(username=username).first_or_404() 
    review = Review.query.filter_by(account_id=user.id).all() 
    review_data = []

    for item in review: 
        marker = Marker.query.filter_by(place_id=item.place_id).first() 
        if marker: 
            review_data.append({
                'content': item.content,
                'rating': item.rating, 
                'place_title': marker.title,
            })

    user_is_following = Following.query.filter_by(user_id=current_user.id, friend_id=user.id).first() is not None

    return render_template('userprofile.html', user=user, reviews=review_data, user_is_following=user_is_following)


# function to check if the file extension is allowed
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
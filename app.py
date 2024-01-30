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
from sqlalchemy.orm import Session, joinedload, aliased
from markupsafe import escape
import re
from validate_email_address import validate_email
from itsdangerous import URLSafeTimedSerializer as Serializer
from flask_mail import Message, Mail
import ssl

# sanitation library
import bleach
from bleach.css_sanitizer import CSSSanitizer

# start of distance calculation for nearby reviews
from math import radians, sin, cos, sqrt, atan2
from geopy.distance import geodesic

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

app.config['MAIL_SERVER'] = os.getenv('SERVER')
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.getenv('EMAIL')
app.config['MAIL_PASSWORD'] = os.getenv('APP')

# *debug 
# print(os.getenv('SERVER'))
# print(os.getenv('PORT'))
# print(os.getenv('EMAIL'))
# print(os.getenv('APP'))

# csrf = CSRFProtect(app)
db = SQLAlchemy(app)
migrate = Migrate(app, db)
mail = Mail(app)

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
    bio = db.Column(db.String(150), nullable=True)
    lat = db.Column(db.Float, nullable=True)
    lng = db.Column(db.Float, nullable=True)
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
    likes = db.relationship('Like', backref='review', lazy=True)
    reposts = db.relationship('Repost', backref='review_parent', lazy=True)

    def to_dict(self):
        return {
            'id': self.id, 
            'timestamp': self.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'content': self.content,
            'rating': self.rating, 
            'account_id': self.account_id, 
            'place_id': self.place_id,
            'likes': len(self.likes), 
            'reposts': len(self.reposts)
        }

class Marker(db.Model): 
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title = db.Column(db.String, nullable=False)
    address = db.Column(db.String)
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
    
class Like(db.Model): 
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    review_id = db.Column(db.Integer, db.ForeignKey('review.id'), nullable=False)

class Repost(db.Model): 
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('account.id'), nullable=False)
    review_id = db.Column(db.Integer, db.ForeignKey('review.id'), nullable=False)
    comments = db.Column(db.Text, nullable=True)
    review = db.relationship('Review', backref=db.backref('repost', lazy=True))
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


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

    # # this is grab current user following 
    # following = [following.friend_id for following in current_user.following]
    # # this will grab all revies from current user and their following
    # reviews = Review.query.filter(Review.account_id.in_([current_user.id] + following)).all()

    return render_template('home.html', username=username, key=key, map=mapid)


# not necessary for sanzing
@app.route('/login', methods=['POST'])
def login(): 
    data = request.json 
    # * New changes for hashing and salting 
    user = Account.query.filter_by(username=data['username']).first()

    if user is None or not user.check_password(data['password_hash']): 
        return jsonify({'error': 'Invalid username or password'}), 401
    
    else: 
        login_user(user)
        return jsonify({'message': 'Login successful', 'redirect': '/home'})

@app.route('/get_following_reviews', methods=['POST'])
def get_following_reviews():
    data = request.json 
    place_id = data.get('place_id')

    following_ids = [following.friend_id for following in Following.query.filter_by(user_id=current_user.id)]
    user_ids = [current_user.id] + following_ids

    reviews = Review.query.filter(
        (Review.place_id == place_id) & (Review.account_id.in_(user_ids))
    ).all()

    reviews_data = []

    for review in reviews: 
        author = Account.query.get(review.account_id)
        author_info = {
            'author_display_name': author.display_name if author.display_name != current_user.display_name else 'You', 
            'author_username': author.username if author.username != current_user.username else '',
            'author_picture': author.picture if author.picture else '/static/uploads/default.jpg', 
        }

        review_info = {
            'id': review.id,
            'timestamp': review.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'content': review.content,
            'rating': review.rating, 
            'account_id': review.account_id, 
            'place_id': review.place_id,
            'likes': len(review.likes), 
            'reposts': len(review.reposts),
        }

        review_data = {**review_info, **author_info}
        reviews_data.append(review_data)

    return jsonify(reviews_data), 200

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
    
    new_marker = Marker(lat=data['lat'], lng=data['lng'], title=data.get('title'), place_id=data.get('place_id'), address=data.get('address'))

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

def getLikeCount(review): 
    return len(review.likes)

@app.route('/like/<int:review_id>', methods=['POST'])
@login_required
def like(review_id): 
    review = Review.query.get_or_404(review_id)

    exist = Like.query.filter_by(user_id=current_user.id, review_id=review.id).first()

    try: 
        if exist: 
            db.session.delete(exist)
        else: 
            new = Like(user_id=current_user.id, review_id=review.id)
            db.session.add(new)

        db.session.commit()
        
        likeCount = db.session.query(func.count(Like.id)).filter(Like.review_id == review.id).scalar()

        return jsonify({'status': 'success', 'message': 'Action performed successfully', 'likes': likeCount})

    except IntegrityError: 
        db.session.rollback() 
        return jsonify({'status': 'error', 'message': 'IntegrityError occurred'}), 500
    
@app.route('/repost/<int:review_id>', methods=['POST'])
@login_required
def repost(review_id): 
    review = Review.query.get_or_404(review_id)

    exist = Repost.query.filter_by(user_id=current_user.id, review_id=review.id).first()

    comment = request.json.get('additional_comments', '')

    if exist: 
        db.session.delete(exist)
        db.session.commit() 
        return jsonify({'status': 'success', 'message': 'Repost is gone'})
    
    pst = datetime.utcnow().replace(tzinfo=timezone.utc).astimezone(timezone(timedelta(hours=-8)))
    
    new = Repost(user_id=current_user.id, review_id=review.id, comments=comment, timestamp=pst)
    db.session.add(new)
    db.session.commit()

    repostCount = db.session.query(func.count(Repost.id)).filter(Repost.review_id == review.id).scalar()

    return jsonify({'status': 'success', 'message': 'Review reposted successfully', 'reposts': repostCount, 'review_id': review.id})

@app.route('/feed', methods=['GET'])
@login_required
def loadFeedPage():
   username = current_user.username
   gather_following = [following.friend_id for following in Following.query.filter_by(user_id=current_user.id).all()]
   # print('This is following gathering', gather_following)

   if gather_following:
       # Perform join statement for fetching the following
       following_reviews = db.session.query(Review, Account, Marker)\
           .join(Account, Review.account_id == Account.id)\
           .join(Marker, Review.place_id == Marker.place_id)\
           .filter(Review.account_id.in_(gather_following))\
           .all()


       status_updates = []
       for review, user, marker in following_reviews:
           repost_count = db.session.query(func.count(Repost.id)).filter(Repost.review_id == review.id).scalar()
           status_updates.append({
               'id': review.id,
               'content': review.content,
               'rating': review.rating,
               'author_display_name': user.display_name,
               'username': user.username,
               'timestamp': review.timestamp,
               'place_title': marker.title,
               'profile_picture': '/static/uploads/' + user.picture if user.picture else '/static/uploads/default.jpg',
               'likes': len(review.likes),
               'reposts': repost_count,
           })
       # this is for fetching the followings' reposts
       reposts = (
           db.session.query(Review, Repost, Account, Marker)
           .join(Repost, Review.id == Repost.review_id)
           .join(Account, Repost.user_id == Account.id)
           .outerjoin(Marker, Review.place_id == Marker.place_id)
           .filter(Repost.user_id.in_(gather_following))
           .all()
       )


       reposted_review_data = []
       for review, repost, reposted_user, marker in reposts:
           original = (
               db.session.query(Account)
               .filter(Account.id == review.account_id)
               .first()
           )


           reposted_review_data.append({
               'id': review.id,
               'content': review.content,
               'place_title': marker.title if marker else None,
               'timestamp': repost.timestamp,
               'profile_picture': '/static/uploads/' + reposted_user.picture if reposted_user.picture else '/static/uploads/default.jpg',
               'author_display_name': reposted_user.display_name,
               'username': reposted_user.username,
               'oa_display_name': original.display_name,
               'oa_username': original.username,
               'rating': review.rating,
               'likes': len(review.likes),
               'reposts': 0,
               'comments': repost.comments if repost else None,
               'is_repost': True if repost.comments else False,
           })


       # this is for current users reviews
       current_review = Review.query.filter_by(account_id=current_user.id).all()
       current_reposts = (
           db.session.query(Review, Repost, Account, Marker)
           .join(Repost, Review.id == Repost.review_id)
           .join(Account, Review.account_id == Account.id)
           .outerjoin(Marker, Review.place_id == Marker.place_id)
           .filter(Repost.user_id == current_user.id)
           .all()
       )


       current_data = []
       for review in current_review:
           repost_count = db.session.query(func.count(Repost.id)).filter(Repost.review_id == review.id).scalar()
           current_data.append({
               'id': review.id,
               'content': review.content,
               'rating': review.rating,
               'author_display_name': current_user.display_name,
               'username': current_user.username,
               'timestamp': review.timestamp,
               'place_title': marker.title,
               'profile_picture': '/static/uploads/' + current_user.picture if current_user.picture else '/static/uploads/default.jpg',
               'likes': len(review.likes),
               'reposts': repost_count,
               'is_repost': False,
           })
      


       total = reposted_review_data + status_updates + current_data
       total.sort(key=lambda x:x['timestamp'], reverse=True)
      
       miles = 5

       nearby_reviews = (
           db.session.query(Review, Account, Marker)
           .join(Account, Review.account_id == Account.id)
           .join(Marker, Review.place_id == Marker.place_id)
           .options(joinedload(Review.likes))
           .all()
       )


       nearby_data = []
       for review, user, marker in nearby_reviews:
           lat = request.args.get('lat', type=float)
           lng = request.args.get('lng', type=float)


           location_user = (lat, lng)
           location_review = (marker.lat, marker.lng)
           distance = geodesic(location_user, location_review).miles


           if distance <= miles:
               repost_count = db.session.query(func.count(Repost.id)).filter(Repost.review_id == review.id).scalar()
               nearby_data.append({
                   'id': review.id,
                   'content': review.content,
                   'rating': review.rating,
                   'author_display_name': user.display_name,
                   'username': user.username,
                   'timestamp': review.timestamp,
                   'place_title': marker.title,
                   'profile_picture': '/static/uploads/' + user.picture if user.picture else '/static/uploads/default.jpg',
                   'likes': len(review.likes),
                   'reposts': repost_count,
               })


       return render_template('feed.html', username=username, status=total, reviews=nearby_data)
   else:
       return render_template('feed.html', username=username, status=[], reviews=[])

@app.route('/update_miles', methods=['POST'])
@login_required
def update_miles():
    miles = float(request.json.get('miles', 5))
    session['miles'] = miles

    lat = current_user.lat
    lng = current_user.lng

    print('This is lat', lat)
    print('This is lng', lng)

    # Use the miles value to fetch and return the updated feed data
    nearby_reviews = (
        db.session.query(Review, Account, Marker)
        .join(Account, Review.account_id == Account.id)
        .join(Marker, Review.place_id == Marker.place_id)
        .options(joinedload(Review.likes))
        .all()
    )

    nearby_data = []
    for review, user, marker in nearby_reviews:
        location_user = (lat, lng)
        location_review = (marker.lat, marker.lng)
        distance = geodesic(location_user, location_review).miles

        if distance <= miles:
            # Assuming Repost is your model for reposts
            repost_count = (
                db.session.query(func.count(Repost.id))
                .filter(Repost.review_id == review.id)
                .scalar()
            )

            nearby_data.append({
                'id': review.id,
                'content': review.content,
                'rating': review.rating,
                'author_display_name': user.display_name,
                'username': user.username,
                'timestamp': review.timestamp,
                'place_title': marker.title,
                'profile_picture': '/static/uploads/' + user.picture if user.picture else '/static/uploads/default.jpg',
                'likes': len(review.likes),
                'reposts': repost_count,
            })

    return jsonify(nearby_data)

@app.route('/feed_data', methods=['GET'])
@login_required
def feed_data():
    miles = float(session.get('miles', 5))
    lat = current_user.lat
    lng = current_user.lng
    nearby_reviews = (
        db.session.query(Review, Account, Marker)
        .join(Account, Review.account_id == Account.id)
        .join(Marker, Review.place_id == Marker.place_id)
        .options(joinedload(Review.likes))
        .all()
    )

    nearby_data = []
    for review, user, marker in nearby_reviews:
        location_user = (lat, lng)
        location_review = (marker.lat, marker.lng)
        distance = geodesic(location_user, location_review).miles

        if distance <= miles:
            # Assuming Repost is your model for reposts
            repost_count = (
                db.session.query(func.count(Repost.id))
                .filter(Repost.review_id == review.id)
                .scalar()
            )

            nearby_data.append({
                'id': review.id,
                'content': review.content,
                'rating': review.rating,
                'author_display_name': user.display_name,
                'username': user.username,
                'timestamp': review.timestamp,
                'place_title': marker.title,
                'profile_picture': '/static/uploads/' + user.picture if user.picture else '/static/uploads/default.jpg',
                'likes': len(review.likes),
                'reposts': repost_count,
            })

    return jsonify(nearby_data)

# *This is going to be for current user
@app.route('/profile', methods=['GET'])
@login_required
def profile():
    # display name will show on the page
    displayName = current_user.display_name

    # username will show on the page
    username = current_user.username

    # this will pass the filename + jpg not the path
    picture = ('/static/uploads/' + current_user.picture) if current_user.picture else '/static/uploads/default.jpg'

    # query the reviews associated with the current-user
    review = Review.query.filter_by(account_id=current_user.id).all()

    review_quant = Review.query.filter_by(account_id=current_user.id).count()
    follower_quant = Following.query.filter_by(friend_id=current_user.id).count() 
    following_quant = Following.query.filter_by(user_id=current_user.id).count()

    # query the reposted reviews associated with the current-user
    reposted = (
        db.session.query(Review, Repost, Marker)
        .join(Repost, Review.id == Repost.review_id)
        .join(Marker, Review.place_id == Marker.place_id, isouter=True)
        .join(Account, Review.account_id == Account.id)
        .filter(Repost.user_id == current_user.id)
        .all()
    )

    # review_data = [{'content': item.content, 'rating': item.rating} for item in review]
    review_data = []


    # packs all the necessary data into the object
    for item in review:
        marker = Marker.query.filter_by(place_id=item.place_id).first()
        if marker:
            repost_count = Repost.query.filter_by(review_id=item.id).count()
            review_data.append({
                'id': item.id,
                'content': item.content,
                'rating': item.rating,
                'place_title': marker.title,
                'timestamp': item.timestamp,
                'likes': len(item.likes),
                'comments': None,
                'reposts': repost_count,
                'is_repost': False,
            })

    reposted_review_data = []

    for review, repost, marker in reposted: 
        original = Account.query.get(review.account_id)
        repost_status = Repost.query.filter_by(user_id=current_user.id, review_id=review.id).first() is not None
        repost_count = 0 if repost_status else Repost.query.filter_by(review_id=review.id).count()

        reposted_review_data.append({
            'id': review.id, 
            'content': review.content, 
            'rating': review.rating,
            'place_title': marker.title if marker else None, 
            'timestamp': repost.timestamp, 
            'likes': len(review.likes), 
            'reposts': repost_count, 
            'comments': repost.comments if repost else None,
            'is_repost': True,
            'original_author': original.display_name,
        })

    total = review_data + reposted_review_data
    total.sort(key=lambda x:x['timestamp'], reverse=True)
   
    return render_template('profile.html', display_name=displayName, username=username, reviews=total, reviewq=review_quant, followerq=follower_quant, followingq=following_quant, picture=picture)

# *This is going to be for loading OTHER users
@app.route('/profile/<username>')
@login_required 
def loadProfile(username): 
    user = Account.query.filter_by(username=username).first_or_404() 
    picture = '/static/uploads/' + user.picture if user.picture else '/static/uploads/default.jpg'
    
    review_quant = Review.query.filter_by(account_id=user.id).count()
    follower_quant = Following.query.filter_by(friend_id=user.id).count() 
    following_quant = Following.query.filter_by(user_id=user.id).count()

    reviews = ( 
        db.session.query(Review, Marker)
        .outerjoin(Marker, Review.place_id == Marker.place_id)
        .filter(Review.account_id == user.id)
        .all()
    )

    review_data = [] 

    for review, marker in reviews: 
        review_data.append({ 
            'id': review.id, 
            'content': review.content, 
            'rating': review.rating, 
            'place_title': marker.title if marker else None, 
            'timestamp': review.timestamp, 
            'likes': len(review.likes), 
            'reposts': 0, 
            'comments': None, 
            'is_repost': False,
        })
    
    reposts = (
        db.session.query(Review, Repost, Marker) 
        .join(Repost, Review.id == Repost.review_id)
        .outerjoin(Marker, Review.place_id == Marker.place_id)
        .filter(Repost.user_id == user.id)
        .all()
    )

    reposted_review_data = [] 

    for review, repost, marker in reposts: 
        reposted_review_data.append({ 
            'id': review.id, 
            'content': review.content, 
            'rating': review.rating, 
            'place_title': marker.title if marker else None, 
            'timestamp': repost.timestamp, 
            'likes': len(review.likes),     # might need to change this value 
            'reposts': 0,                   # might need to change this value 
            'comments': repost.comments if repost else None, 
            'is_repost': True,
        })

    # might need to add the user is following variable here and pass it into the template 
    user_is_following = Following.query.filter_by(user_id=current_user.id, friend_id=user.id).first() is not None

    total = review_data + reposted_review_data
    total.sort(key = lambda x: x['timestamp'], reverse=True)

    # user_is_following = Following.query.filter_by(user_id=current_user.id, review_id=review.id).first() is not None 
    return render_template('userprofile.html', user=user, reviews=total, user_is_following=user_is_following, reviewq=review_quant, followerq=follower_quant, followingq=following_quant, picture=picture)


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

@app.route('/friends', methods=['GET'])
@login_required 
def friends(): 
    username = current_user.username 

    # this is for following 
    query = (
        Account.query
        .join(Following, Following.friend_id == Account.id)
        .filter(Following.user_id == current_user.id)
    )
    following = query.all()

    following_data = []

    for user in following: 
        info = {
            'username': user.username, 
            'display_name': user.display_name, 
            'picture': user.picture,
            'bio': user.bio if user.bio else 'No bio yet',
        }
        following_data.append(info)
    
    # this is for followers 
    query2 = (
        Account.query
        .join(Following, Following.user_id == Account.id)
        .filter(Following.friend_id == current_user.id)
    )
    follower = query2.all()

    follower_data = [] 

    for user in follower: 
        info = {
            'username': user.username,
            'display_name': user.display_name, 
            'picture': user.picture,
            'bio': user.bio if user.bio else 'No bio yet',
        }
        follower_data.append(info) 

    return render_template('cards.html', following_data=following_data, follower_data=follower_data, username=username)


@app.route('/update_profile', methods=['POST'])
@login_required
def update_profile(): 
    user = current_user 
    data = request.json 


    new_bio = bleach.clean(data.get('bio', ''), 
        tags=[], 
        attributes={}, 
        css_sanitizer=css_sanitizer, 
        strip=True, 
        strip_comments=True)

    new_display = bleach.clean(data.get('displayname', ''), 
        tags=[], 
        attributes={}, 
        css_sanitizer=css_sanitizer, 
        strip=True, 
        strip_comments=True)
    
    user.bio = new_bio
    user.display_name = new_display 

    db.session.commit()

    return redirect(url_for('profile'))

@app.route('/loadforgot', methods=['GET'])
def loadforgot(): 
    return render_template('forgotpw.html')

@app.route('/loadreset', methods=['GET'])
def loadreset(): 
    return render_template('resetpw.html')

@app.route('/submitforgot', methods=['POST'])
def submitforgot(): 
    data = request.json

    # grab email from the front end 
    email = data.get('email', 'None')

    # determine if this user email is within the db
    user = Account.query.filter(func.lower(Account.email) == func.lower(email)).first()

    # boolean for email verification
    valid = validate_email(email)

    # if valid email and user exists 
    if valid and user: 
        # generate a token for pw reset
        s = Serializer(app.config['SECRET_KEY'])
        token = s.dumps({'user_id': user.id})

        # send reset link to user email
        send_reset_email(user.email, token)
        message = 'Password reset link sent. Check your emails and/or spam.'
        return jsonify({'status': 'success', 'message': message})
    
    elif valid and not user: 
        error = 'No user exists!'
        return jsonify({'status': 'error', 'message': error})


    return render_template('login.html')

@app.route('/reset_password/<token>', methods=['GET', 'POST']) 
def reset_password(token):
    s = Serializer(app.config['SECRET_KEY'])
    try: 
        # user id here 
        data = s.loads(token)
    except: 
        flash('Invalid or expired token')
        return redirect(url_for('login'))

    if request.method == 'POST': 

        json_data = request.get_data(as_text=True)
        data_from_json = json.loads(json_data)

        new_pass = data_from_json.get('pw')
        c_pass = data_from_json.get('cpw')
        print('hello1')

        if new_pass == c_pass: 
            user = Account.query.get(data['user_id'])
            user.set_password(c_pass)
            db.session.commit()

            flash('Password reset success')
            return jsonify({'status': 'success', 'message': 'Password change was successful'})

        elif new_pass != c_pass: 
            return jsonify({'error ': 'passwords did not match'})
        

        else: 
            return jsonify({'error': 'Something went wrong'})

    return render_template('resetpw.html', token=token)


def send_reset_email(email, token):
    message = Message('Password Reset Request', sender='noreply@yourdomain.com', recipients=[email])
    message.body = f'''To reset your password, visit the following link:
        {url_for('reset_password', token=token, _external=True)}

        If you did not make this request, ignore this email.
        '''
    mail.send(message)

@app.route('/update_location', methods=['POST'])
@login_required
def update_location(): 
    lat = request.json.get('lat')
    lng = request.json.get('lng')

    if lat is not None and lng is not None: 
        current_user.lat = lat 
        current_user.lng = lng
        db.session.commit()

        return jsonify({'success': True}), 200 
    
    else: 
        return jsonify({'success': False, 'error': "Invalid"}), 400

# this should create the database upon activating file 
if __name__ == '__main__': 
    with app.app_context(): 
        db.create_all() 
    app.run(debug=True)
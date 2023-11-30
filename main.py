import json
import random
from urllib import request
from flask import Flask, jsonify, redirect, url_for, request, render_template, session, request, Response
from flask_sqlalchemy import SQLAlchemy
from datetime import timedelta
from flask_login import LoginManager, UserMixin, current_user, login_user, logout_user, login_required
from flask_admin import Admin
from flask_admin.contrib.sqla import ModelView
from datetime import datetime
import urllib.parse

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

db = SQLAlchemy(app)

# initialize Flask-Login
login_manager = LoginManager(app)
login_manager.login_view = 'login'
app.secret_key = 'Temporarily'


# Data Models  
class Account(UserMixin, db.Model): 
    id = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(100), nullable = False, unique=True)
    password = db.Column(db.String(100), nullable = False)
    reviews = db.relationship('Review', backref='author', lazy=True)
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
    marker_id = db.Column(db.String(255), nullable=False)

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
    return jsonify({'redirect': url_for('loadloginpage')})
    

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

@app.route('/submit_review', methods=['POST'])
@login_required
def submit_review(): 
    data = request.json
    content = data.get('content')
    rating = data.get('rating')
    marker_id = data.get('markerId')

    review = Review(content=content, rating=rating, marker_id=marker_id, account=current_user)
    db.session.add(review)
    db.session.commit()

    return jsonify({'message': 'Review submitted successfully'})

# this should create the database upon activating file 
if __name__ == '__main__': 
    with app.app_context(): 
        db.create_all() 
    app.run(debug=True)
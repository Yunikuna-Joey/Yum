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


# Data Models  
class Account(db.Model): 
    id = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(100), nullable = False, unique=True)
    password = db.Column(db.String(100), nullable = False)
    # good idea to have tiers of users (possible subscription based for premium / admin)
    # acc_status = db.Column(db.Integer, nullable = False)

    def get_id(self): 
        return self.id
    
    def password_auth(self, password): 
        return self.password == password

    # def acc_status_auth(self): 
    #     return self.acc_status

@app.route('/')
def homepage(): 
    return render_template('login.html')

@app.route('/home')
def home(): 
    return render_template('home.html')

@app.route('/login', methods=['POST'])
def login(): 
    data = request.json 
    user = Account.query.filter_by(username = data['username']).first() 
    if user is None or not user.password_auth(data['password']): 
        return jsonify({'error': 'Invalid username or password'})
    else: 
        return jsonify({'message': 'Login successful', 'redirect': '/home'})
    

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

# this should create the database upon activating file 
if __name__ == '__main__': 
    with app.app_context(): 
        db.create_all() 
    app.run(debug=True)
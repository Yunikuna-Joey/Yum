# Utilize Flask-Migrate to track database modifications [Assuming you are using SQLAlchemy]
1) Ensure the top of your app.py file has the following: 
    *** if needed run 'pip install Flask-Migrate
    - from flask import Flask 
    - from flask_sqlalchemy import SQLAlchemy 
    - from flask_migrate import Migrate

2) Your app.py file should look something like this: 
    - app = Flask(__name__)
    - app.config['SQLALCHEMY_DATABASE_URI'] = 'your_database_uri_here'
    - db = SQLAlchemy(app)
    - migrate = Migrate(app, db)

3) In your terminal type: 
    - 'flask db init' 

4) Then create your first migration of your database: 
    - 'flask db migrate -m 'insert-your-caption-here' 

5) Then apply your migration with this: 
    - 'flask db upgrade' 

6) Any subsequent changes should be a repeat of steps 4 & 5 


# [METHOD #2] Using Python shell to drop the entire base and recreate with blank values (P.W.C)
1) Important to note that if we proceed with this, the entire data model WILL be deleted 

2) use 'python' keyword within your terminal to enter the python shell 

3) use 'from flask_app_python_file import app, db' and press enter 

4) then type 'app.app_context().push()' 
    - 'db.drop_all()' [this will delete everything]
    - 'db.create_all()' [this will recreate the tables with blank values]
  

-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


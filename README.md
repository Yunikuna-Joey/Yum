# Alembic Database Upgrading [Testing in progress not sure if it will be kept] 
1) To start off: 'pip install alembic' 
2) Initialize alembic: 'alembic init alembic' 

3) Navigate to the file 'alembic.ini': 
    - look for the line 'sqlalchemy.url = driver://user:pass@localhost/dbname' 
    - then replace everything after the '=' with your database file or within your Flask Application, it should be everything after the '=' that contains the substring DATABASE_URI 

4) Navigate to the file 'env.py' within the newly created alembic folder and add in: 
    - from 'your Flask application name' import app, db  
        (i.e index.py) then it would be 'from index import app, db' respectively or whatever you named your app / database in your Flask file 

5) Now you're ready, create an initial revision of your database with 
    - 'alembic revision -- autogenerate -m "Initial" ' (Note: everything after the -m is essentially a comment about the revision push)
    - [This will create a file in the alembic folder under 'versions']

6) To apply the migrations, we will use: 
    - 'alembic upgrade head' 

7) That should do it! Repeat steps 5 / 6 for any future changes with the database! 

8) [MISC] If you would like to see the history / rollback a change: 
    - 'alembic history' to display the unique version ID's of your revisions 

    - 'alembic downgrade unique_id'  

# [METHOD #2] Using Python shell to drop the entire base and recreate with blank values (P.W.C)
1) Important to note that if we proceed with this, the entire data model WILL be deleted 

2) use 'python' keyword within your terminal to enter the python shell 

3) use 'from flask_app_python_file import app, db' and press enter 

4) then type 'app.app_context().push()' 
    - 'db.drop_all()' [this will delete everything]
    - 'db.create_all()' [this will recreate the tables with blank values]
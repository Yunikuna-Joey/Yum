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
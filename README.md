# CS2102-fds
AY19/20 Sem 2 CS2102 Project.
This project involves creating the a web-based database application for a food delivery service provider.

Database name: project

#Setup:
1. git clone
2. create .env fie
2a. e.g. cs2102-fds/App/.env
3. add "DATABASE_URL=postgres://[username]:[psqlpassword]@[hostaddress]:[portno]/[databasename]"
3a. e.g. "DATABASE_URL=postgres://postgres:password@localhost:5432/project"

# Setting up Database
Run the following commands to set up the database correctly
psql -U <postgres_role>
CREATE DATABASE project;
\c project
\i init.sql

*Ensure you are at the right directory!

# Run web server:
Next, run the following set of commands relative from the home directory
cd App
npm install
node bin /www
```
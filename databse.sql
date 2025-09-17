CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE DATABASE jwttut;

CREATE TABLE users(
    user_id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL UNIQUE,
    user_password TEXT NOT NULL
);

CREATE TABLE admin(
    admin_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    admin_name TEXT NOT NULL,
    trust_name TEXT NOT NULL,
    admin_mobile TEXT NOT NULL,
    admin_email TEXT NOT NULL UNIQUE,
    admin_password TEXT NOT NULL,
    active BOOLEAN DEFAULT FALSE
);

CREATE TABLE admin_verification_token(

    admin_id INTEGER REFERENCES admin(admin_id)
);

ALTER SEQUENCE admin_admin_id_seq RESTART WITH 1;
ALTER SEQUENCE admin_verification_token_id_seq RESTART WITH 1;

CREATE TABLE admin_verification_token(
    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    admin_id INTEGER REFERENCES admin(admin_id),
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);


CREATE TABLE user_forms(
 form_id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
 user_name TEXT NOT NULL,
 user_mobile TEXT UNIQUE,
 user_email TEXT UNIQUE,
 user_age INTEGER NOT NULL,
 user_address TEXT NOT NULL,
 user_aadhar TEXT NOT NULL UNIQUE,
 user_monthly_income INTEGER NOT NULL,
 user_electricy_bill INTEGER NOT NULL,
 received_assistance BOOLEAN NOT NULL,
 residence_type TEXT NOT NULL,
 assitance_type TEXT NOT NULL,
 referred_by TEXT NOT NULL
);


CREATE TABLE user_form(
    
)

SELECT * FROM users;

INSERT INTO users(user_name,user_email,user_password) VALUES('Bob', 'bob@email.com','bob');
INSERT INTO users(user_name,user_email,user_password) VALUES('Frank', 'frank@email.com','frank');

--psql -U postgres
--\c jwttut
--\dt

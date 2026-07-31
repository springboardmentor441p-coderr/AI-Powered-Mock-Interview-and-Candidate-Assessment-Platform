-- ==========================================
-- SmartHire AI Database Schema
-- ==========================================


CREATE DATABASE IF NOT EXISTS smarthire_ai;


USE smarthire_ai;



-- ==========================================
-- Roles Table
-- ==========================================


CREATE TABLE roles (

    id INT AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(50) UNIQUE NOT NULL,

    description TEXT

);



-- ==========================================
-- Users Table
-- ==========================================


CREATE TABLE users (

    id INT AUTO_INCREMENT PRIMARY KEY,


    full_name VARCHAR(100) NOT NULL,


    email VARCHAR(120) UNIQUE NOT NULL,


    password VARCHAR(255) NOT NULL,


    phone VARCHAR(15),


    role_id INT NOT NULL,


    is_active BOOLEAN DEFAULT TRUE,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,


    FOREIGN KEY(role_id)

    REFERENCES roles(id)

);



-- ==========================================
-- Default Roles
-- ==========================================


INSERT INTO roles
(name, description)

VALUES

(
'Candidate',
'Candidate user who attends AI interviews'
),


(
'Recruiter',
'Recruiter who manages candidates'
),


(
'Admin',
'System administrator'
);



-- ==========================================
-- Profiles Table
-- ==========================================


CREATE TABLE profiles (

    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    education TEXT,

    skills TEXT,

    experience TEXT,

    resume_path VARCHAR(255),


    FOREIGN KEY(user_id)

    REFERENCES users(id)

);



-- ==========================================
-- Interviews Table
-- ==========================================


CREATE TABLE interviews (

    id INT AUTO_INCREMENT PRIMARY KEY,


    user_id INT NOT NULL,


    job_role VARCHAR(100),


    difficulty VARCHAR(50),


    score FLOAT DEFAULT 0,


    status VARCHAR(50),


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(user_id)

    REFERENCES users(id)

);



-- ==========================================
-- Interview Answers Table
-- ==========================================


CREATE TABLE answers (

    id INT AUTO_INCREMENT PRIMARY KEY,


    interview_id INT NOT NULL,


    question TEXT,


    answer TEXT,


    ai_score FLOAT,


    feedback TEXT,


    FOREIGN KEY(interview_id)

    REFERENCES interviews(id)

);



-- ==========================================
-- Reports Table
-- ==========================================


CREATE TABLE reports (

    id INT AUTO_INCREMENT PRIMARY KEY,


    interview_id INT NOT NULL,


    strengths TEXT,


    weaknesses TEXT,


    recommendations TEXT,


    overall_feedback TEXT,


    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,


    FOREIGN KEY(interview_id)

    REFERENCES interviews(id)

);
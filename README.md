# AI-Powered-Mock-Interview-and-Candidate-Assessment-Platform
# SmartHire AI

## AI-Powered Mock Interview and Candidate Assessment Platform

SmartHire AI is an AI-based recruitment platform designed to help candidates practice interviews and receive automated assessment feedback. The platform allows candidates to upload their resumes, extracts resume information, and provides an intelligent mock interview experience.

## Project Overview

The goal of SmartHire AI is to simulate a real interview environment using Artificial Intelligence.

The platform will:

* Accept candidate resumes in PDF format
* Extract resume content
* Conduct AI-powered mock interviews
* Evaluate candidate responses
* Generate interview performance feedback

## Current Implementation

### Resume Management Module

Implemented features:

* Resume PDF upload
* Resume text extraction using PyMuPDF
* Resume storage using SQLite database
* Resume details display in the web interface
* Upload and interview workflow

## Upcoming Features

### AI Voice Interview Agent

Planned features:

* AI interviewer that communicates through voice
* Speech-to-Text for candidate responses
* Text-to-Speech for AI-generated questions
* Dynamic interview questions using LLMs
* Candidate answer evaluation
* Final interview performance report

## Technology Stack

### Backend

* Python
* Flask
* SQLite
* PyMuPDF

### Frontend

* HTML
* CSS
* JavaScript

### AI Components (Planned)

* Large Language Model (LLM)
* Speech-to-Text
* Text-to-Speech

## Project Structure

```
SmartHire-AI/
│
├── app.py                  # Flask application
├── database.py             # SQLite database connection
├── parser.py               # Resume text extraction
├── smarthire.db            # SQLite database
│
├── templates/
│   ├── index.html          # Resume upload page
│   └── interview.html      # Interview interface
│
├── static/
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── script.js       # Resume upload logic
│       └── interview.js    # Interview workflow
│
├── uploads/                # Uploaded resumes
│
└── requirements.txt
```

## How to Run Locally

### 1. Clone the repository

```bash
git clone <repository-url>
```

### 2. Create virtual environment

```bash
python -m venv venv
```

Activate:

Windows:

```bash
venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the application

```bash
python app.py
```

Open in browser:

```
http://127.0.0.1:5000
```

## Current Workflow

```
Resume Upload
      ↓
PDF Text Extraction
      ↓
Store Resume Data
      ↓
Start Mock Interview
```

## Future Workflow

```
Resume Upload
      ↓
AI Voice Interview Agent
      ↓
LLM-Based Question Generation
      ↓
Candidate Voice Responses
      ↓
Answer Evaluation
      ↓
Interview Report
```

## Author

Deepthi Priya

```
```

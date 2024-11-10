
# SentiAnalyz - Installation and Use Guide

## Table of Contents

- [Prerequisites](#prerequisites)
- [Automatic Setup](#automatic-setup)
- [Manual Setup](#manual-setup)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [Optional Extras](#optional-extras)
- [Installation Checklist](#installation-checklist)

## Prerequisites

Before installing SentiAnalyz, ensure you have the following:

- Python 3.10 or 3.11 (3.11 recommended)
- pip (Python package installer)
- Git (for cloning the repository)

## Automatic Setup

1. Run the setup script:

   ```bash
   python setup.py
   ```
2. Activate the virtual environment:

   - Windows:
     ```bash
     .venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     source .venv/bin/activate
     ```
3. [Run the application](#running-the-application)

## Manual Setup

1. Create and activate a virtual environment:

   - Windows:
     ```bash
     python -m venv .venv
     .venv\Scripts\activate
     ```
   - macOS/Linux:
     ```bash
     python3 -m venv .venv
     source .venv/bin/activate
     ```
2. Upgrade package managers:

   ```bash
   python -m pip install --upgrade pip setuptools wheel
   ```
3. Install dependencies:

   - Using requirements.txt:
     ```bash
     pip install -r requirements.txt
     ```
   - Manual installation:
     ```bash
     pip install -q -U flask flask-cors python-dotenv flask-limiter flask-socketio torch transformers vaderSentiment "numpy<2" scikit-learn pandas google-generativeai nltk requests
     ```
4. Set up environment variables:
   Create a `.env` file in the project root or rename the example env to `.env` and make the required changes.

## Running the Application

Start the Flask server:

```bash
flask run
```

## Troubleshooting

If you encounter package conflicts, try:

```bash
pip install --upgrade --force-reinstall -r requirements.txt
```

## Optional Extras

These packages are not usually required:

```bash
pip install -q -U tqdm eventLet dnspython python-engineio pytest black flake8 pylint colorama psutil
```

## Installation Checklist

- [ ] Prerequisites installed
- [ ] Virtual environment created and activated
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] Application running

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

## Setup

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

If you get nltk import error, deactivate the virtual environment by running the below command and run the app

```bash
deactivate
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

# BhaavChitra: AI-Powered Sentiment Analysis Platform

BhaavChitra is an advanced sentiment analysis platform built using Flask and MongoDB. It combines cutting-edge machine learning models like **BERT** and **VADER** to analyze and present insights into textual sentiment. The project includes robust database integration and a responsive user interface.

## Features

- **Sentiment Analysis**: Uses a hybrid scoring system to combine BERT and VADER outputs for precise results.
- **Dynamic Sentiment Display**: Sentiment is highlighted with color-coded indicators (green for positive, red for negative, gray for neutral).
- **MongoDB Integration**: Stores user data, session information, and sentiment analysis history.
- **Customizable Models**: Easily swap models via environment configuration.
- **Responsive Design**: Dynamic navigation bar and mobile-friendly layout.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Setup](#setup)
- [Running the Application](#running-the-application)
- [Troubleshooting](#troubleshooting)
- [Installation Checklist](#installation-checklist)

## Prerequisites

Before installing BhaavChitra, ensure you have the following:

- Python 3.10 or 3.11 (3.11 recommended)
- pip (Python package installer)
- MongoDB (for database storage)
- Git (for cloning the repository)

## Setup

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/yourusername/bhaavchitra.git
   cd bhaavchitra
   ```
2. **Run the Setup Script**:

   ```bash
   python setup.py
   ```

4. **Configuration**:

   Use the `.env` file in the root directory for environment configuration. Refer to `.env-guide` for details on how to set up:

   - MongoDB URI
   - Flask server configurations
   - NLTK and model paths

## Running the Application

Start the Flask server:

```bash
flask run
```

## Troubleshooting

- **Dependency Conflicts**:If you encounter issues installing packages, force reinstall:

  ```bash
  pip install --upgrade --force-reinstall -r requirements.txt
  ```
- **NLTK Errors**:If you face issues related to NLTK paths, deactivate the virtual environment and rerun the application:

  ```bash
  deactivate
  ```
- **MongoDB Connection Errors**:
  Ensure your MongoDB server is running and the URI in `.env` is correctly configured.

## Installation Checklist

- [ ] Prerequisites installed
- [ ] Virtual environment created and activated
- [ ] Dependencies installed
- [ ] Environment variables set
- [ ] MongoDB server running
- [ ] Application running

## Database Schema

The database schema for MongoDB is as follows:

### **Users Collection**:

- **id**: Primary Key
- **email**: User's email address
- **password**: Securely hashed password
- **created_at**: Timestamp of account creation
- **is_google_user**: Boolean flag to indicate if the user logged in via Google

## Project Structure

```
bhaavchitra/
├── python_service/      # Main backend service
│   ├── __init__.py      # Application initialization
│   ├── app.py           # Main Flask app
│   ├── bert.py          # BERT sentiment logic
├── public/              # Static and dynamic resources
│   ├── CSS/             # CSS files for styling
│   ├── JS/              # JavaScript files for functionality
│   ├── @resources/      # Images and assets
│   ├── bhaavchitra.html # Main application page
│   ├── index.html       # Landing page
│   ├── about.html       # About page
│   ├── login.html       # Login page
├── .env                 # Environment configuration
├── requirements.txt     # Python dependencies
├── setup.py             # Setup script for initialization
├── dummydata.txt        # Sample data for testing
```

## Future Enhancements

- Support for multilingual sentiment analysis.
- Improved data visualizations for sentiment trends.
- Secure password resets and account management.
- Enhanced role-based access control (e.g., admin and user roles).

## General Note

For commercial and educational use, please note the following:

- **License:** This system is available under the [GNU General Public License v3.0 (GPL-3.0)](https://www.gnu.org/licenses/gpl-3.0.html).
- **Copyright:** Copyright © **2024** [Manju Madhav V A](https://bit.ly/manjumadhav-xo) and [Nishanth K R](https://github.com/Nishanth1409). All rights reserved.
- **Where to Find the Product:** The source code and documentation will be available on [GitHub](https://github.com/violetto-rose/BhaavChitra).
- **Contact:**
  For inquiries or support, please contact us via email:
  [manjumadhav.va@gmail.com](mailto:manjumadhav.va@gmail.com) or
  [nishanthkr1409@gmail.com](mailto:nishanthkr1409@gmail.com).

### BhaavChitra - A sentiment analysis tool.

Copyright © **2024** Manju Madhav V A and Nishanth K R.

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but **WITHOUT ANY WARRANTY**; without even the implied warranty of **MERCHANTABILITY** or **FITNESS FOR A PARTICULAR PURPOSE**. See the [GNU General Public License](https://www.gnu.org/licenses/) for more details.

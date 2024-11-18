import subprocess
import sys
import os
import platform
import venv
import requests
import zipfile
import secrets
from pymongo import MongoClient
from datetime import datetime, timezone
from werkzeug.security import generate_password_hash

def print_step(message):
    print(f"\n{'='*80}\n{message}\n{'='*80}")

def check_python_version():
    print_step("Checking Python version...")
    required_version = (3, 8)
    current_version = sys.version_info[:2]
    
    if current_version < required_version:
        print(f"Error: Python {required_version[0]}.{required_version[1]} or higher is required")
        print(f"Current version: {current_version[0]}.{current_version[1]}")
        sys.exit(1)
    print(f"✓ Python version {current_version[0]}.{current_version[1]} meets requirements")

def setup_virtual_environment():
    print_step("Setting up virtual environment...")
    venv_path = ".venv"
    
    if not os.path.exists(venv_path):
        print("Creating virtual environment...")
        venv.create(venv_path, with_pip=True)
        print("✓ Virtual environment created")
    else:
        print("✓ Virtual environment already exists")
    
    return venv_path

def install_requirements():
    print_step("Installing requirements; this may take a little time, so please be patient...")
    python_path = ".venv/Scripts/python" if platform.system() == "Windows" else ".venv/bin/python"
    
    commands = [
        f'"{python_path}" -m pip install --upgrade pip setuptools wheel',
        f'"{python_path}" -m pip install -r requirements.txt'
    ]
    
    for cmd in commands:
        try:
            subprocess.run(cmd, shell=True, check=True)
        except subprocess.CalledProcessError as e:
            print(f"Error during installation: {e}")
            sys.exit(1)

def setup_mongodb():
    print_step("Setting up MongoDB...")
    try:
        # Connect to MongoDB
        client = MongoClient('mongodb://localhost:27017/')
        print("✓ Connected to MongoDB successfully")

        # Create or get the database
        db = client['bhaavchitra_db']
        print("✓ Database 'bhaavchitra_db' selected")

        # Drop existing collections if they exist
        if 'users' in db.list_collection_names():
            db.users.drop()
            print("✓ Dropped existing users collection")

        # Create users collection
        users_collection = db['users']

        # Create indexes
        users_collection.create_index('email', unique=True)
        users_collection.create_index('password')
        users_collection.create_index('created_at')
        users_collection.create_index('is_google_user')
        print("✓ Created indexes for users collection")

        # Insert a sample user
        sample_user = {
            'email': 'admin@example.com',
            'password': generate_password_hash('admin123'),
            'created_at': datetime.now(timezone.utc),
            'is_google_user': False
        }

        users_collection.insert_one(sample_user)
        print("✓ Inserted sample admin user with credentials:")
        print("   Email: admin@example.com")
        print("   Password: admin123")

        # Verify setup
        user_count = users_collection.count_documents({})
        print(f"✓ Users collection contains {user_count} documents")
        
        return True

    except Exception as e:
        print(f"Error setting up MongoDB: {str(e)}")
        print("Please make sure MongoDB is installed and running on your system")
        return False
    finally:
        client.close()
        print("✓ MongoDB connection closed")

def download_model():
    print_step("Downloading BERT model...")
    try:
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        
        model_name = "nlptown/bert-base-multilingual-uncased-sentiment"
        
        # Create directories
        os.makedirs("local_model", exist_ok=True)
        os.makedirs("local_tokenizer", exist_ok=True)
        
        print("Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        tokenizer.save_pretrained("local_tokenizer")
        
        print("Downloading model...")
        model = AutoModelForSequenceClassification.from_pretrained(model_name)
        model.save_pretrained("local_model")
        
        print("✓ Model downloaded successfully")
    except Exception as e:
        print(f"Error downloading model: {e}")
        sys.exit(1)

def download_nltk_data():
    print_step("Downloading NLTK data...")
    # Define the URLs for the required NLTK data
    nltk_data_urls = {
        'punkt': 'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/tokenizers/punkt.zip',
        'stopwords': 'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/stopwords.zip',
        'wordnet': 'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/wordnet.zip',
        'averaged_perceptron_tagger': 'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/taggers/averaged_perceptron_tagger.zip',
    }
    
    nltk_data_path = 'local_tokenizer/nltk_data'

    def download_and_extract_nltk_data(package_name, url):
        os.makedirs(nltk_data_path, exist_ok=True)
        download_path = os.path.join(nltk_data_path, f"{package_name}.zip")
        
        print(f"Downloading {package_name}...")
        response = requests.get(url)
        with open(download_path, 'wb') as f:
            f.write(response.content)
        print(f"✓ Downloaded {package_name}")
        
        print(f"Extracting {package_name}...")
        with zipfile.ZipFile(download_path, 'r') as zip_ref:
            zip_ref.extractall(nltk_data_path)
        print(f"✓ Extracted {package_name}")
        
        os.remove(download_path)
        print(f"✓ Cleaned up {package_name}")

    for package, url in nltk_data_urls.items():
        download_and_extract_nltk_data(package, url)

    print("✓ All NLTK data downloaded and extracted")

def create_env_file():
    secret_key = secrets.token_hex(32)
    print_step("Creating .env file...")
    if not os.path.exists(".env"):
        with open(".env", "w") as f:
            f.write(f"""# Server Configuration
FLASK_APP=python_service/app.py
FLASK_HOST=localhost
FLASK_PORT=5000
FLASK_ENV=development

# BERT Model Configuration
BERT_MODEL_NAME=nlptown/bert-base-multilingual-uncased-sentiment
MODEL_PATH=local_model
MODEL_VERSION=1.0.0
MODEL_TIMEOUT=30

# API KEYS
OPENAI_API_KEY=
GEMINI_API_KEY=

# Secret key
SECRET_KEY={secret_key}
    
# NLTK Data Path
NLTK_DATA_PATH=local_tokenizers/nltk_data

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=bhaavchitra_db
""")
        print("✓ Created .env file")
    else:
        print("✓ .env file already exists")

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    print("\nStarting installation process...")
    
    check_python_version()
    setup_virtual_environment()
    install_requirements()
    create_env_file()
    
    # Setup MongoDB
    if not setup_mongodb():
        print("\nWarning: MongoDB setup failed. Please ensure MongoDB is installed and running.")
        print("You can still proceed with the rest of the setup.")
        user_input = input("Do you want to continue with the setup? (y/n): ")
        if user_input.lower() != 'y':
            sys.exit(1)
    
    download_model()
    download_nltk_data()
    
    print_step("Installation completed successfully! 🎉")
    print("\nInitial admin user credentials:")
    print("    Email: admin@example.com")
    print("    Password: admin123")
    print("\nTo activate the virtual environment:")
    if platform.system() == "Windows":
        print("    Run: .venv\\Scripts\\activate")
    else:
        print("    Run: source .venv/bin/activate")
    print("\nMake sure to:")
    print("1. Update your .env file with your API keys")
    print("2. Ensure MongoDB is running")
    print("3. Change the admin password after first login")
    print("\nTo start the server:")
    print("    Run: flask run")

if __name__ == "__main__":
    main()
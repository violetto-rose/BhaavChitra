import subprocess
import sys
import os
import platform
import venv
import os
import requests
import zipfile

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
    # Define the URLs for the required NLTK data
    nltk_data_urls = {
        'punkt': 'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/tokenizers/punkt.zip',
        'stopwords': 'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/stopwords.zip',
        'wordnet': 'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/corpora/wordnet.zip',
        'averaged_perceptron_tagger': 'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/taggers/averaged_perceptron_tagger.zip',
    }
    
    # Path to save the downloaded data
    nltk_data_path = 'local_tokenizer/nltk_data'

    # Function to download and extract each file
    def download_and_extract_nltk_data(package_name, url):
        # Ensure directory structure
        os.makedirs(nltk_data_path, exist_ok=True)
        
        # Define download path
        download_path = os.path.join(nltk_data_path, f"{package_name}.zip")
        
        # Download the package
        print(f"Downloading {package_name} from {url}...")
        response = requests.get(url)
        with open(download_path, 'wb') as f:
            f.write(response.content)
        print(f"✓ Downloaded {package_name}")
        
        # Extract the package
        print(f"Extracting {package_name} to {nltk_data_path}...")
        with zipfile.ZipFile(download_path, 'r') as zip_ref:
            zip_ref.extractall(nltk_data_path)
        print(f"✓ Extracted {package_name}")
        
        # Remove the zip file after extraction
        os.remove(download_path)
        print(f"✓ Removed temporary zip file for {package_name}")

    # Download and extract each required NLTK package
    for package, url in nltk_data_urls.items():
        download_and_extract_nltk_data(package, url)

    print("All required NLTK data has been downloaded and extracted.")

def create_env_file():
    print_step("Creating .env file...")
    if not os.path.exists(".env"):
        with open(".env", "w") as f:
            f.write("""# Server Configuration
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
    
# NLTK Data Path
NLTK_DATA_PATH=local_tokenizers/nltk_data
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
    download_model()
    download_nltk_data()
    
    print_step("Installation completed successfully! 🎉")
    print("\nTo activate the virtual environment:")
    if platform.system() == "Windows":
        print("    Run: .venv\\Scripts\\activate")
    else:
        print("    Run: source .venv/bin/activate")
    print("\nUpdate your .env file if necessary.")
    print("\nTo start the server:")
    print("    Run: flask run")

if __name__ == "__main__":
    main()

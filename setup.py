import subprocess
import sys
import os
import platform
import venv

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
    print_step("Installing requirements...")
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

def create_env_file():
    print_step("Creating .env file...")
    if not os.path.exists(".env"):
        with open(".env", "w") as f:
            f.write("""BERT_MODEL_NAME=nlptown/bert-base-multilingual-uncased-sentiment
MODEL_PATH=local_model
FLASK_ENV=development
HOST=localhost
PORT=5000""")
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
    
    print_step("Installation completed successfully! 🎉")
    print("\nTo activate the virtual environment:")
    if platform.system() == "Windows":
        print("    Run: .venv\\Scripts\\activate")
    else:
        print("    Run: source .venv/bin/activate")
    print("\nTo start the server:")
    print("    python -m python_service.app")

if __name__ == "__main__":
    main()
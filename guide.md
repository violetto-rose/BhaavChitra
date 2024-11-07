# SentiAnalyz - Installation and Use Guide

## Prerequisites

Before installing SentiAnalyz, ensure you have the following prerequisites:

* Python 3.10 or 3.11 (3.11 recommended)
* pip (Python package installer)
* Git (for cloning the repository)
* [Optional] NVIDIA GPU with CUDA support for faster processing

## Create and Activate Virtual Environment (automatic)

Run

```python
python setup.py
```

##### Windows

```bash
# Activate virtual environment
.venv\Scripts\activate
```

##### macOS/Linux

```bash
# Activate virtual environment
source .venv/bin/activate
```

### Run the application

```bash
flask run
```

## Create and Activate Virtual Environment (manual)

##### Windows

```bash
#create a virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\activate
```

##### macOS/Linux

```bash
# Create virtual environment
python3 -m venv .venv

# Activate virtual environment
source .venv/bin/activate
```

### Upgrade Package Managers

```bash
python -m pip install --upgrade pip setuptools wheel
```

### Install PyTorch

###### Normal installation

```bash
pip install torch
```

###### For NVIDIA GPU Users (Recommended if you have a compatible GPU)

```bash
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

###### For CPU Only

```bash
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### Environment Variables

Create a `.env` file in the project root:

```plaintext
FLASK_APP=python_service/app.py
FLASK_ENV=development
BERT_MODEL_NAME=nlptown/bert-base-multilingual-uncased-sentiment
MODEL_PATH=local_model
MODEL_VERSION=1.0.0
MODEL_TIMEOUT=30
HOST=localhost
PORT=5000
```

### Installing Dependancies

Run:

```bash
pip install -r requirements.txt
```

or alternatively use

```bash
pip install -q -U flask flask-cors python-dotenv flask-limiter flask-socketio torch transformers html vaderSentiment "numpy<2" scikit-learn pandas google-generativeai 
```

Extras (Not required usually):

```bash
pip install -q -U requests tqdm eventLet dnspython python-engineio pytest black flake8 pylint colorama psutil
```

### Package Conflicts

If you encounter package conflicts:

```bash
pip install --upgrade --force-reinstall -r requirements.txt
```

### Running the Application

Start the Flask server:

```bash
flask run
```

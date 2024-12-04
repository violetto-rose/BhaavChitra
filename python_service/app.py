from flask import Flask, request, jsonify, send_from_directory, redirect, url_for, session
from flask_login import LoginManager, UserMixin, current_user, login_user, logout_user, login_required
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_cors import CORS
from flask_socketio import SocketIO
from dotenv import load_dotenv
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from .bert import BertAnalyzer
import google.generativeai as genai
import os
import re
import html
import nltk
from nltk.tokenize import word_tokenize, sent_tokenize
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import logging
from logging.handlers import RotatingFileHandler
from collections import Counter
from datetime import datetime, timezone
from bson import ObjectId

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# Flask app setup
app = Flask(__name__, static_folder='public', static_url_path='')
app.secret_key = os.getenv("SECRET_KEY")

# MongoDB setup
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB")
client = MongoClient(MONGODB_URI)
db = client[MONGODB_DB]
users_collection = db['users']

# Set up logging
log_formatter = logging.Formatter('%(asctime)s %(levelname)s: %(message)s')
log_file = 'app.log'

# Check if log file exists; if not, create an empty one
if not os.path.exists(log_file):
    with open(log_file, 'w') as f:
        pass

# Set up the rotating file handler to log to app.log with rotation
file_handler = RotatingFileHandler(log_file, maxBytes=1000000, backupCount=5)
file_handler.setFormatter(log_formatter)
file_handler.setLevel(logging.DEBUG)

# Set up the console handler to log to console
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
console_handler.setLevel(logging.DEBUG)

# Add handlers to the Flask app logger
app.logger.addHandler(file_handler)
app.logger.addHandler(console_handler)
app.logger.setLevel(logging.DEBUG)

# Initialize CORS
CORS(app, resources={r"/*": {"origins": ["http://127.0.0.1:5000", "http://localhost:5000"]}})

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins=["http://127.0.0.1:5000", "http://localhost:5000"])

# Socket IO logger
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

# Initialize login manager
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.session_protection = "strong"
login_manager.login_view = "login"

class User(UserMixin):
    def __init__(self, user_data):
        self.id = str(user_data['_id'])
        self.email = user_data['email']
        self.password_hash = user_data.get('password')
        self.created_at = user_data.get('created_at', datetime.now(timezone.utc))
        self.is_google_user = user_data.get('is_google_user', False)

    def check_password(self, password):
        """Check if the provided password matches the stored hash"""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)

    @staticmethod
    def get_by_id(user_id):
        """Retrieve a user by their ID"""
        try:
            user_data = users_collection.find_one({'_id': ObjectId(user_id)})
            return User(user_data) if user_data else None
        except Exception as e:
            app.logger.error(f"Error retrieving user by ID: {str(e)}")
            return None

    @staticmethod
    def get_by_email(email):
        """Retrieve a user by their email address"""
        try:
            user_data = users_collection.find_one({'email': email})
            return User(user_data) if user_data else None
        except Exception as e:
            app.logger.error(f"Error retrieving user by email: {str(e)}")
            return None

    @staticmethod
    def get_or_create_dev_user():
        """Get or create a development user account"""
        dev_email = "admin@example.com"
        dev_password = generate_password_hash("admin123")
        dev_user = users_collection.find_one({'email': dev_email})
        
        if not dev_user:
            dev_user_data = {
                'email': dev_email,
                'password': dev_password,
                'created_at': datetime.now(timezone.utc),
                'is_google_user': False
            }
            result = users_collection.insert_one(dev_user_data)
            dev_user = users_collection.find_one({'_id': result.inserted_id})
        
        return User(dev_user)

    def get_id(self):
        """Override to return id as string"""
        return str(self.id)

@login_manager.user_loader
def load_user(user_id):
    return User.get_by_id(user_id)

# Initialize analyzers
vader_analyzer = SentimentIntensityAnalyzer()
bert_analyzer = BertAnalyzer()
lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

# NLTK data path setup
nltk_data_path = os.getenv('NLTK_DATA_PATH', 'nltk_data')
if nltk_data_path:
    nltk.data.path.append(nltk_data_path)

def get_sentiment_description(combined_score, vader_scores, text):
    """Generate a detailed description of the sentiment analysis"""
    
    # Overall sentiment strength
    if abs(combined_score) < 0.2:
        strength = "slightly"
    elif abs(combined_score) < 0.5:
        strength = "moderately"
    else:
        strength = "strongly"

    # Base description
    if combined_score > 0.05:
        base_sentiment = f"The text is {strength} positive"
    elif combined_score < -0.05:
        base_sentiment = f"The text is {strength} negative"
    else:
        base_sentiment = "The text is neutral"

    # Analyze emotional components
    emotions = []
    if vader_scores['pos'] > 0.2:
        emotions.append("positive emotions")
    if vader_scores['neg'] > 0.2:
        emotions.append("negative emotions")
    if vader_scores['neu'] > 0.5:
        emotions.append("neutral/factual content")

    emotional_content = ""
    if emotions:
        emotional_content = " It contains " + ", ".join(emotions) + "."

    # Analyze text characteristics
    characteristics = []
    word_count = len(text.split())
    if word_count < 10:
        characteristics.append("brief")
    elif word_count > 50:
        characteristics.append("detailed")

    # Check for exclamation marks and question marks
    if "!" in text:
        characteristics.append("emphatic")
    if "?" in text:
        characteristics.append("interrogative")

    text_characteristics = ""
    if characteristics:
        text_characteristics = " The text is " + " and ".join(characteristics) + "."
    return f"{base_sentiment}.{emotional_content}{text_characteristics} (Combined score: {combined_score:.2f})"

def preprocess_text(text):
    """Preprocess text with various NLP techniques"""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    
    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)
    
    # Remove numbers and special characters
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\d+', '', text)
    
    # Tokenize
    tokens = word_tokenize(text)
    
    # Remove stopwords and lemmatize
    tokens = [lemmatizer.lemmatize(token) for token in tokens if token not in stop_words]
    
    # Join tokens back into text
    processed_text = ' '.join(tokens)
    
    return processed_text

def custom_sort_key(item):
    """Custom sorting function to put punctuation first"""
    tag, _ = item
    if tag in [',', '.', ':', ';', '!', '?']:
        return ('0', tag)
    return ('1', tag)

def extract_features(text):
    """Extract linguistic features from text"""
    
    # Sentence tokenization
    sentences = sent_tokenize(text)
    
    # Word tokenization
    words = word_tokenize(text)
    
    # POS tagging
    pos_tags = nltk.pos_tag(words)
    
    # Calculate POS distribution
    pos_distribution = Counter(tag for _, tag in pos_tags)
    
    # Sort the POS distribution
    sorted_pos_distribution = sorted(pos_distribution.items(), key=custom_sort_key)
    
    # Calculate basic metrics
    features = {
        'sentence_count': len(sentences),
        'word_count': len(words),
        'avg_sentence_length': len(words) / len(sentences) if sentences else 0,
        'unique_words': len(set(words)),
        'pos_distribution': dict(sorted_pos_distribution)
    }
    
    return features

def format_markdown_to_html(text):
    """
    Convert markdown formatted text to HTML with specific styling rules.
    
    Args:
        text (str): Markdown formatted text
        
    Returns:
        str: HTML formatted text
    """
    # Initialize the formatted text
    formatted_text = text.strip()
    
    # Define section headers mapping
    section_headers = {
        r'##\s*(?:Concise\s*)?Summary(?:\s*of\s*(?:the\s*)?(?:Text|Feedback))?(?:\s*and\s*Analysis(?:\s*of\s*the\s*Feedback)?)?:': '<h4>Concise Summary:</h4>',
        r'###?\s*Key\s*Points:': '<h3>Key Points:</h3>'
    }
    
    # Replace section headers
    for pattern, replacement in section_headers.items():
        formatted_text = re.sub(pattern, replacement, formatted_text, flags=re.IGNORECASE)
    
    # Replace bold text
    formatted_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', formatted_text)
    
    # Replace italic text
    formatted_text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', formatted_text)
    
    # Replace strikethrough text
    formatted_text = re.sub(r'~~(.*?)~~', r'<strike>\1</strike>', formatted_text)
    
    # Replace bullet points with proper HTML list items
    formatted_text = re.sub(r'^\s*\*\s*', '<li>', formatted_text, flags=re.MULTILINE)
    
    # Add paragraph tags to section titles
    section_titles = [
        ('**Positive Points:**', '<p><b>Positive Points:</b></p>'),
        ('**Negative Points:**', '<p><b>Negative Points:</b></p>'),
        ('**Actionable Insights:**', '<p><b>Actionable Insights:</b></p>')
    ]
    
    for old, new in section_titles:
        formatted_text = formatted_text.replace(old, new)
    
    # Handle line breaks
    # Replace double line breaks or single line breaks with <br>
    formatted_text = re.sub(r'\n\n|\n', '<br>', formatted_text)
    
    # Clean up any duplicate <br> tags
    formatted_text = re.sub(r'<br>\s*<br>', '<br>', formatted_text)
    
    # Wrap lists in <ul> tags
    list_sections = re.finditer(r'(?:<br>|^)(<li>.*?(?=<br>(?!<li>)|$))', formatted_text, re.DOTALL)
    for section in list_sections:
        list_content = section.group(1)
        formatted_text = formatted_text.replace(list_content, f'<ul>{list_content}</ul>')
    
    # Clean up any remaining formatting issues
    formatted_text = re.sub(r'<br>\s*<ul>', '<ul>', formatted_text)
    formatted_text = re.sub(r'</ul>\s*<br>', '</ul>', formatted_text)
    
    return formatted_text

def combine_sentiment_scores(vader_scores, bert_score, text):
    """Combine VADER and BERT scores with simplified output"""
    # Set default values
    bert_numeric, bert_confidence = 0, 0.5  # Default confidence if not available

    try:
        # Convert BERT score to numeric, scale to [-1, 1]
        if bert_score:
            # Assuming bert_score[0] contains label and confidence (e.g., {"label": "4 stars", "confidence": 0.9})
            bert_numeric = (float(bert_score[0]['label'].split()[0]) - 3) / 2
            bert_confidence = bert_score[0].get('confidence', 0.5)  # Use confidence if provided, otherwise default
    except (TypeError, IndexError, KeyError, ValueError) as e:
        app.logger.error("Error processing BERT score: %s", e)
    
    # Calculate combined score using confidence as weight
    combined_score = vader_scores['compound'] * (1 - bert_confidence) + bert_numeric * bert_confidence
    overall_sentiment = 'Positive' if combined_score >= 0.05 else 'Negative' if combined_score <= -0.05 else 'Neutral'
    
    text_description = get_sentiment_description(combined_score, vader_scores, text)
    
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        if SELECTED_ANALYSIS_TYPE == "normal-sentiment":
            prompt = f"Explain the following text in a concise and informative manner, considering its sentiment: {text}"
        elif SELECTED_ANALYSIS_TYPE == "feedback-sentiment":
            feedback_text = 'Analyze the following feedback text: ' if 'feedback' in text.lower() else 'Explain the following text in a concise and informative manner, considering its sentiment:'
            prompt = f"""
            {feedback_text} {text}
            'If this is feedback, provide a concise summary of the key points.' +
            '* **Positive Points:** Highlight the specific aspects that were praised or appreciated.' +
            '* **Negative Points:** Identify any criticisms or areas for improvement.' +
            '* **Actionable Insights:** Suggest potential steps or strategies to address the negative points and enhance the overall performance or product.' if 'feedback' in text.lower() else ''
            """
        else:
            app.logger.info("Default prompt")
            # If analysis_type is not recognized, use a default prompt
            prompt = f"Explain the following text in a concise and informative manner, considering its sentiment: {text}"
        
        gemini_response = model.generate_content(prompt)
        gemini_explanation = format_markdown_to_html(gemini_response.text)
    except Exception as e:
        app.logger.error("Error calling Gemini API: %s", e)
        gemini_explanation = "N/A"

    return {
        'combined_score': combined_score,
        'overall_sentiment': overall_sentiment,
        'text_description': text_description,
        'vader_compound': vader_scores['compound'],
        'bert_score': bert_numeric,
        'gemini_explanation': gemini_explanation
    }

@app.route('/check-email', methods=['POST'])
def check_email():
    email = request.json.get('email')
    user = User.get_by_email(email)
    return jsonify({'user_exists': user is not None}), 200

@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('bhaavchitra'))

    if request.method == 'POST':
        data = request.get_json()
        
        if data.get('google_login'):
            dev_user = User.get_or_create_dev_user()
            if login_user(dev_user, remember=True):
                session.modified = True
                return jsonify({'success': True, 'redirect': url_for('bhaavchitra')}), 200
            return jsonify({'error': 'Login failed'}), 401

        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        user = User.get_by_email(email)
        
        if not user:
            try:
                hashed_password = generate_password_hash(password)
                user_data = {
                    'email': email,
                    'password': hashed_password,
                    'created_at': datetime.now(timezone.utc),
                    'is_google_user': False
                }
                result = users_collection.insert_one(user_data)
                user = User.get_by_id(str(result.inserted_id))
            except Exception as e:
                app.logger.error(f"Error creating user: {str(e)}")
                return jsonify({'error': 'Error creating user'}), 500

        if user and user.check_password(password):
            if login_user(user, remember=True):
                session.modified = True
                return jsonify({'success': True, 'redirect': url_for('bhaavchitra')}), 200
        
        return jsonify({'error': 'Invalid email or password'}), 401

    return send_from_directory(app.static_folder, 'login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    session.clear()
    return redirect(url_for('login'))

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/bhaavchitra')
@login_required
def bhaavchitra():
    if not current_user.is_authenticated:
        return redirect(url_for('login'))
    return send_from_directory(app.static_folder, 'bhaavchitra.html')

@app.route('/about')
def about():
    return send_from_directory(app.static_folder, 'about.html')

@app.route("/favicon.ico")
def favicon():
    return send_from_directory("public/@resources", "favicon.png")

@app.route('/set-analysis-type', methods=['POST'])
def set_analysis_type():
    data = request.get_json()
    analysis_type = data.get('analysis_type', 'normal-sentiment')
    global SELECTED_ANALYSIS_TYPE
    SELECTED_ANALYSIS_TYPE = analysis_type
    app.logger.info(f"Analysis type set to: {SELECTED_ANALYSIS_TYPE}")
    return jsonify({'analysis_type': SELECTED_ANALYSIS_TYPE})

@app.route('/analyze', methods=['POST'])
def analyze_sentiment():
    app.logger.info("Sentiment analysis request received")
    
    if not request.is_json:
        app.logger.error("Invalid JSON format")
        return jsonify({"error": "Invalid JSON format"}), 400

    data = request.get_json()
    text = data.get('text', '')

    if not text:
        app.logger.error("Text input cannot be empty")
        return jsonify({"error": "Text input cannot be empty"}), 400

    try:
        # Sanitize input
        text = html.escape(text.strip())
        
        try:
            linguistic_features = extract_features(text)
            processed_text = preprocess_text(text)
        except Exception as nltk_error:
            app.logger.warning(f"NLTK processing failed, falling back to basic analysis: {str(nltk_error)}")
            
            # Fallback to basic analysis
            sentences = nltk.sent_tokenize(text)
            words = nltk.word_tokenize(text)
            pos_tags = nltk.pos_tag(words)
            
            linguistic_features = {
                'sentence_count': len(sentences),
                'word_count': len(words),
                'avg_sentence_length': len(words) / len(sentences) if sentences else 0,
                'unique_words': len(set(words)),
                'pos_distribution': Counter(tag for _, tag in pos_tags)
            }
            processed_text = text.lower()  # Basic fallback preprocessing
        
        # Get sentiment scores with error handling
        try:
            vader_scores = vader_analyzer.polarity_scores(processed_text)
        except Exception as e:
            app.logger.error(f"VADER analysis failed: {str(e)}")
            vader_scores = {'compound': 0.0, 'pos': 0.0, 'neu': 0.0, 'neg': 0.0}
            
        try:
            bert_score = bert_analyzer.analyze(processed_text)
        except Exception as e:
            app.logger.error(f"BERT analysis failed: {str(e)}")
            bert_score = None

        # Ensure all numeric values are properly formatted
        sentiment_analysis = combine_sentiment_scores(vader_scores, bert_score, text)
        
        sentiment_description = get_sentiment_description(sentiment_analysis['combined_score'], vader_scores, text)
        
        # Ensure all numeric values are valid numbers before sending to frontend
        result = {
            'combined_score': float(sentiment_analysis['combined_score'] or 0),
            'overall_sentiment': str(sentiment_analysis['overall_sentiment']),
            'text_description': str(sentiment_description),
            'vader_compound': float(vader_scores['compound'] or 0),
            'bert_score': float(sentiment_analysis['bert_score'] or 0),
            'gemini_explanation': str(sentiment_analysis.get('gemini_explanation', 'N/A')),
            'linguistic_features': linguistic_features
        }
        
        # Validate all numeric values
        for key in ['combined_score', 'vader_compound', 'bert_score']:
            if not isinstance(result[key], (int, float)):
                result[key] = 0.0
        
        app.logger.info("Sentiment analysis completed")
        
        return jsonify(result)

    except Exception as e:
        app.logger.error("Error in sentiment analysis: %s", e)
        return jsonify({
            'error': 'An error occurred during analysis',
            'details': str(e),
            'combined_score': 0.0,
            'overall_sentiment': 'Neutral',
            'vader_compound': 0.0,
            'bert_score': 0.0,
            'gemini_explanation': 'Error during analysis',
            'linguistic_features': 'Error during analysis'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'bert_model': 'loaded' if bert_analyzer.model else 'not_loaded',
        'vader_model': 'loaded' if vader_analyzer else 'not_loaded',
        'nltk_status': 'loaded'
    })

@app.after_request
def add_copyright_footer(response):
    if response.direct_passthrough:
        return response

    if response.content_type.startswith('text/html'):
        content = response.get_data(as_text=True)
        footer = '<footer id="copyright-footer" class="copyright-footer"><p>Copyright © 2024 Manju Madhav V A and Nishanth K R. All rights reserved.</p></footer>'
        if '<div id="content-wrapper">' in content:
            content = content.replace('</div><!--content-wrapper-->', '</div><!--content-wrapper-->' + footer)
        else:
            content = content.replace('</body>', f'{footer}</body>')
    
    return response

'''
#test routes for vader
@app.route('/test-vader', methods=['GET'])
def test_vader():
    example_text = "This is a test sentence. Let's see how VADER scores it."
    vader_scores = vader_analyzer.polarity_scores(example_text)
    print("VADER scores:", vader_scores)  # Output to console for easy debugging
    return jsonify(vader_scores)

#test routes for bert
@app.route('/test-bert', methods=['GET'])
def test_bert():
    example_text = "This is a positive sentence!"
    try:
        bert_score = bert_analyzer.analyze(example_text)
        print("BERT score:", bert_score)  # Output to console
        return jsonify(bert_score)
    except Exception as e:
        print(f"BERT Analyzer error: {e}")
        return jsonify({"error": str(e)}), 500
'''

if __name__ == '__main__':
    SELECTED_ANALYSIS_TYPE = "normal-sentiment"
    socketio.run(
        app,
        host=os.getenv('HOST', 'localhost'),
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )
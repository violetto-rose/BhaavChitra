from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from .bert import BertAnalyzer
import os
from dotenv import load_dotenv
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import html
from flask_socketio import SocketIO
import logging
from logging.handlers import RotatingFileHandler
import google.generativeai as genai

app = Flask(__name__, static_folder='public', static_url_path='')
CORS(app, resources={r"/*": {"origins": "http://127.0.0.1:5000"}})
socketio = SocketIO(app, cors_allowed_origins="http://127.0.0.1:5000")

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

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

@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

# Initialize analyzers
vader_analyzer = SentimentIntensityAnalyzer()
bert_analyzer = BertAnalyzer()

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

def combine_sentiment_scores(vader_scores, bert_score, text):
    """Combine VADER and BERT scores using a weighted approach and generate detailed analysis"""
    try:
        bert_numeric = (float(bert_score[0]['label'].split()[0]) - 3) / 2 if bert_score else 0
    except (TypeError, IndexError, KeyError, ValueError) as e:
        app.logger.error("Error processing BERT score: %s", e)
        bert_numeric = 0

    combined_score = (vader_scores['compound'] + bert_numeric) / 2

    overall_sentiment = 'Positive' if combined_score >= 0.05 else 'Negative' if combined_score <= -0.05 else 'Neutral'
    
    # Generate detailed description
    description = get_sentiment_description(combined_score, vader_scores, text)

    # Generate score explanations
    vader_explanation = {
        'positive': f"Positive sentiment strength: {vader_scores['pos']:.2f}",
        'neutral': f"Neutral sentiment strength: {vader_scores['neu']:.2f}",
        'negative': f"Negative sentiment strength: {vader_scores['neg']:.2f}",
        'compound': f"Overall sentiment score: {vader_scores['compound']:.2f}"
    }

    bert_explanation = {
        'model_score': f"BERT sentiment score: {bert_numeric:.2f}",
        'confidence': f"Confidence: {bert_score[0]['score']:.2f}" if bert_score else "N/A"
    }
    
    try:
        model_name = "gemini-1.5-flash"
        model = genai.GenerativeModel(model_name)

        # Prepare the prompt for explanation
        prompt = f"Explain the following text in a concise and informative manner, considering its sentiment: {text}"

        # Call Gemini API for explanation
        gemini_response = model.generate_content(prompt)
        gemini_explanation = gemini_response.text  # Access explanation text
        
        # Remove formatting characters like **
        gemini_explanation = gemini_explanation.replace("**", "")

    except Exception as e:
        app.logger.error("Error calling Gemini API: %s", e)
        gemini_explanation = "N/A"

    return {
        'combined_score': combined_score,
        'overall_sentiment': overall_sentiment,
        'description': description,
        'vader_scores': vader_scores,
        'bert_score': bert_score,
        'vader_explanation': vader_explanation,
        'bert_explanation': bert_explanation,
        'gemini_explanation': gemini_explanation
    }

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"]
)

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/bhaavchitra')
def bhaavchitra():
    return send_from_directory(app.static_folder, 'bhaavchitra.html')

@app.route('/about')
def about():
    return send_from_directory(app.static_folder, 'about.html')

@app.route("/favicon.ico")
def favicon():
    return send_from_directory("public/@resources/favicon", "favicon.ico")

@app.route('/analyze', methods=['POST'])
def analyze_sentiment():
    app.logger.info("Sentiment analysis request received")
    app.logger.info("Request data: %s", request.get_json())

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
        if len(text) > 5000:
            app.logger.error("Text too long")
            return jsonify({'error': 'Text too long'}), 400

        # Get VADER scores
        app.logger.debug("Calculating VADER scores")
        vader_scores = vader_analyzer.polarity_scores(text)
        app.logger.debug("VADER scores: %s", vader_scores)

        # Get BERT analysis
        app.logger.debug("Calculating BERT score")
        bert_score = bert_analyzer.analyze(text)
        app.logger.debug("Raw BERT score: %s", bert_score)

        # Combine scores and generate detailed analysis
        app.logger.debug("Generating detailed analysis")
        result = combine_sentiment_scores(vader_scores, bert_score, text)
        result['gemini_explanation'] = result['gemini_explanation']
        app.logger.debug("Analysis result: %s", result)
        
        return jsonify(result)

    except Exception as e:
        app.logger.error("Error in sentiment analysis: %s", e)
        return jsonify({'error': 'An error occurred during analysis', 'details': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'bert_model': 'loaded' if bert_analyzer.model else 'not_loaded',
        'vader_model': 'loaded' if vader_analyzer else 'not_loaded'
    })

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
    socketio.run(
        app,
        host=os.getenv('HOST', 'localhost'),
        port=int(os.getenv('PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )
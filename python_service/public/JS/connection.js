let analysisTimeout;

// Initialize Socket.IO connection
const socket = io("http://127.0.0.1:5000", {
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected to Socket.IO server");
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);
});

socket.on("disconnect", () => {
  console.log("Disconnected from Socket.IO server");
});

socket.on("reconnect_attempt", (attempt) => {
  console.log(`Reconnect attempt: ${attempt}`);
});

socket.on("reconnect_failed", () => {
  console.error("Reconnect failed");
});

// Text length checker
function checkTextLength(text, maxLength = 3000) {
  const textLength = text.trim().length;
  const wordsCount = text.trim().split(/\s+/).length;

  return {
    isValid: textLength <= maxLength,
    currentLength: textLength,
    remainingChars: maxLength - textLength,
    wordCount: wordsCount,
    message:
      textLength <= maxLength
        ? `${textLength}/${maxLength} characters (${wordsCount} words)`
        : `Text exceeds maximum length by ${textLength - maxLength} characters`,
  };
}

// Update character count in real-time
function updateCharacterCount() {
  const textInput = document.getElementById("textInput");
  const charCountDiv = document.getElementById("charCount");

  // Create character count div if it doesn't exist
  if (!charCountDiv) {
    const countDisplay = document.createElement("div");
    countDisplay.id = "charCount";
    textInput.parentNode.appendChild(countDisplay);
  }

  const lengthCheck = checkTextLength(textInput.value);
  const charCount = document.getElementById("charCount");

  charCount.innerHTML = lengthCheck.message;

  // Update classes based on validity
  if (!lengthCheck.isValid) {
    charCount.classList.add("exceeded");
  } else {
    charCount.classList.remove("exceeded");
  }

  // Update analyze button state
  const analyzeButton = document.getElementById("analyzeButton");
  analyzeButton.disabled = !lengthCheck.isValid;
  analyzeButton.title = lengthCheck.isValid
    ? "Analyze text"
    : "Text length exceeds maximum limit of 512 characters";
}

// Debounce analysis function
function debounce(func, wait) {
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(analysisTimeout);
      func(...args);
    };
    clearTimeout(analysisTimeout);
    analysisTimeout = setTimeout(later, wait);
  };
}

// Get emoticon for sentiment
function getEmoticonForSentiment(sentiment) {
  switch (sentiment.toLowerCase()) {
    case "positive":
      return "😊";
    case "negative":
      return "😔";
    default:
      return "😐";
  }
}

// Get color for sentiment
function getSentimentColor(sentiment) {
  switch (sentiment.toLowerCase()) {
    case "positive":
      return "#00ff55";
    case "negative":
      return "#ff2626";
    default:
      return "#808080";
  }
}

// Create progress bar with safe number handling
function createProgressBar(value, maxValue = 1) {
  // Ensure value is a number and handle invalid inputs
  const numericValue = Number(value) || 0;
  const percentage = (numericValue / maxValue) * 100;
  const color =
    numericValue > 0 ? "#00ff55" : numericValue < 0 ? "#ff2626" : "#808080";

  return `
    <div class="progress">
      <div class="progress-bar" style="width: ${Math.abs(
        percentage
      )}%; background-color: ${color};"></div>
    </div>
    <span style="color: ${color}">${(numericValue * 100).toFixed(1)}%</span>
  `;
}

function displayLinguisticFeatures(features) {
  const container = document.getElementById("linguistic_features");

  // Basic metrics setup with a "Show more" button
  const sentenceCount = features.sentence_count ?? "N/A";
  const wordCount = features.word_count ?? "N/A";
  const avgSentenceLength = (features.avg_sentence_length || 0).toFixed(2);
  const uniqueWords = features.unique_words ?? "N/A";

  container.innerHTML = `
      <h3>Linguistic Features</h3>
      <p><strong>Sentence Count:</strong> ${sentenceCount}</p>
      <p><strong>Word Count:</strong> ${wordCount}</p>
      <p><strong>Average Sentence Length:</strong> ${avgSentenceLength}</p>
      <p><strong>Unique Words:</strong> ${uniqueWords}</p>
      <button id="toggle-details">Stats for nerds</button>
      <div id="detailed-stats" style="display: none;"></div>
  `;

  // POS Descriptions
  const posDescriptions = {
    ",": "Comma",
    ".": "Period",
    ":": "Colon",
    "(": "Left Parenthesis",
    ")": "Right Parenthesis",
    "``": "Opening Quote",
    "''": "Closing Quote",
    NN: "Noun, Singular",
    NNS: "Noun, Plural",
    NNP: "Proper Noun, Singular",
    NNPS: "Proper Noun, Plural",
    VB: "Verb, Base Form",
    VBD: "Verb, Past Tense",
    VBG: "Verb, Gerund or Present Participle",
    VBN: "Verb, Past Participle",
    VBP: "Verb, Present Tense",
    VBZ: "Verb, 3rd Person Singular Present",
    JJ: "Adjective",
    JJR: "Adjective, Comparative",
    JJS: "Adjective, Superlative",
    RB: "Adverb",
    RBR: "Adverb, Comparative",
    RBS: "Adverb, Superlative",
    PRP: "Personal Pronoun",
    PRP$: "Possessive Pronoun",
    WP: "Wh-pronoun",
    WP$: "Possessive Wh-pronoun",
  };

  // POS Categories
  const posCategories = {
    Punctuation: [",", ".", ":", "(", ")", "``", "''"],
    Nouns: ["NN", "NNS", "NNP", "NNPS"],
    Verbs: ["VB", "VBD", "VBG", "VBN", "VBP", "VBZ"],
    Adjectives: ["JJ", "JJR", "JJS"],
    Adverbs: ["RB", "RBR", "RBS"],
    Pronouns: ["PRP", "PRP$", "WP", "WP$"],
  };

  // Categorize POS tags
  const categorizedPOS = {};
  Object.keys(posCategories).forEach((category) => {
    categorizedPOS[category] = {};
    posCategories[category].forEach((tag) => {
      if (features.pos_distribution[tag]) {
        categorizedPOS[category][tag] = features.pos_distribution[tag];
      }
    });
  });

  // Create detailed stats table for each POS category
  let detailedHTML = "<h4>POS Distribution (Detailed)</h4>";
  Object.entries(categorizedPOS).forEach(([category, tags]) => {
    detailedHTML += `<h4>${category}</h4><table class="stats-table">`;
    detailedHTML += `
      <thead>
        <tr>
          <th class="pos-tag">Tag</th>
          <th>Distribution (Count (%))</th>
        </tr>
      </thead>
      <tbody>
    `;
    Object.entries(tags).forEach(([tag, count]) => {
      const percentage = ((count / wordCount) * 100).toFixed(1);
      const description = posDescriptions[tag] || tag; // Fallback to tag if no description
      detailedHTML += `
      <tr title="${description}">
        <td class="pos-tag"><strong>${tag}</strong></td>
        <td>
          <div class="pos-bar" style="width: ${percentage}%;"></div>
          <span>${count} (${percentage}%)</span>
        </td>
      </tr>
    `;
    });
    detailedHTML += "</tbody></table>";
  });

  // Attach the toggle functionality
  document
    .getElementById("toggle-details")
    .addEventListener("click", function () {
      const detailedStats = document.getElementById("detailed-stats");
      if (detailedStats.style.display === "none") {
        detailedStats.style.display = "block";
        detailedStats.innerHTML = detailedHTML; // Set detailed content when shown
        this.textContent = "Show less";
      } else {
        detailedStats.style.display = "none";
        this.textContent = "Stats for nerds";
      }
    });
}

async function analyzeSentimentWithRetry() {
  const retries = 3;
  console.log("analyzeSentimentWithRetry triggered");

  const text = document.getElementById("textInput").value.trim();
  const resultDiv = document.getElementById("result");

  // Check text length before proceeding
  const lengthCheck = checkTextLength(text);
  if (!text) {
    resultDiv.innerHTML = "Please enter some text for analysis.";
    return;
  }
  if (!lengthCheck.isValid) {
    resultDiv.innerHTML = `
      <div class="error-message">
        <h3>Text Length Error</h3>
        <p>${lengthCheck.message}</p>
        <p>Please shorten your text to proceed with analysis.</p>
      </div>
    `;
    return;
  }

  resultDiv.innerHTML = `
    <div class="analyzing-animation">
      <p>Analyzing sentiment...</p>
      <div class="spinner"></div>
    </div>
  `;

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i + 1} to analyze sentiment`);

      const response = await fetch("http://127.0.0.1:5000/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received data:", data);

      // Ensure all required properties exist with safe defaults
      const safeData = {
        overall_sentiment: data.overall_sentiment || "Neutral",
        combined_score: Number(data.combined_score) || 0,
        vader_compound: Number(data.vader_compound) || 0,
        bert_score: Number(data.bert_score) || 0,
        gemini_explanation: data.gemini_explanation || "No analysis available",
        linguistic_features:
          data.linguistic_features || "No linguistic features available",
      };

      const sentimentColor = getSentimentColor(safeData.overall_sentiment);
      const emoticon = getEmoticonForSentiment(safeData.overall_sentiment);

      resultDiv.innerHTML = `
        <div class="sentiment-header">
          <h2>Analysis Results ${emoticon}</h2>
        </div>

        <div class="sentiment-overview">
          <h3>Sentiment Analysis</h3>
          <p class="description">${safeData.text_description}</p>
          <h4>Overall Sentiment: <span style="color: ${sentimentColor};">${
        safeData.overall_sentiment
      }</span></h4>
          
          <div class="score-grid">
            <div class="score-item">
              <label>Combined Score</label>
              ${createProgressBar(safeData.combined_score)}
            </div>
            <div class="score-item">
              <label>VADER Score</label>
              ${createProgressBar(safeData.vader_compound)}
            </div>
            <div class="score-item">
              <label>BERT Score</label>
              ${createProgressBar(safeData.bert_score)}
            </div>
          </div>

          <div class="gemini-analysis">
            <h3>Detailed Analysis</h3>
            <p>${safeData.gemini_explanation}</p>
          </div>

          <div id="linguistic_features"></div>
        </div>
      `;
      displayLinguisticFeatures(safeData.linguistic_features);
      break;
    } catch (error) {
      console.error("Error occurred:", error);

      if (i === retries - 1) {
        resultDiv.innerHTML = `
          <div class="error-message">
            <h3>Error</h3>
            <p>${error.message}</p>
            <p>Please try again later.</p>
          </div>
        `;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const popupOverlay = document.getElementById("popupOverlay");
  const submitButton = document.getElementById("submitAnalysisType");

  // Show popup on load
  popupOverlay.style.display = "flex";

  submitButton.addEventListener("click", () => {
    const selectedOption = document.querySelector(
      'input[name="analysis-type"]:checked'
    );
    const selectedOptionId = selectedOption.id;

    // Set the global analysis type
    fetch("/set-analysis-type", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ analysis_type: selectedOptionId }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Analysis type set:", data.analysis_type);

        // Hide popup
        popupOverlay.style.display = "none";

        const text = document.getElementById("textInput").value;

        fetch("/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: text }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("Analysis result:", data);
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });

  // Add input event listener for real-time character count
  const textInput = document.getElementById("textInput");
  textInput.addEventListener("input", debounce(updateCharacterCount, 100));

  // Initial character count update
  updateCharacterCount();

  // Attach analyze button event listener
  document
    .getElementById("analyzeButton")
    .addEventListener("click", debounce(analyzeSentimentWithRetry, 300));
});

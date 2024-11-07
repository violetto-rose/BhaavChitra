let analysisTimeout;

// Initialize Socket.IO connection
const socket = io("http://localhost:5000", {
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

// Create progress bar
function createProgressBar(value, maxValue = 1) {
  const percentage = (value / maxValue) * 100;
  const color = value > 0 ? "#00ff55" : value < 0 ? "#ff2626" : "#808080";
  return `
    <div class="progress" style="height: 20px; background-color: #f0f0f0; border-radius: 10px; margin: 5px 0;">
      <div class="progress-bar" style="width: ${Math.abs(
        percentage
      )}%; height: 100%; background-color: ${color}; border-radius: 10px; transition: width 0.5s ease-in-out;"></div>
    </div>
    <span style="color: ${color}">${(value * 100).toFixed(1)}%</span>
  `;
}

// Fetch Gemini explanation
async function getGeminiExplanation(text) {
  try {
    const response = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: text }),
    });

    const data = await response.json();
    return data.gemini_explanation;
  } catch (error) {
    console.error("Error fetching Gemini explanation:", error);
    return "N/A";
  }
}

//
async function analyzeSentimentWithRetry() {
  const retries = 3;
  console.log("analyzeSentimentWithRetry triggered");

  const text = document.getElementById("textInput").value.trim();
  const resultDiv = document.getElementById("result");

  if (!text) {
    resultDiv.innerHTML = "Please enter some text for analysis.";
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

      const sentimentColor = getSentimentColor(data.overall_sentiment);
      const emoticon = getEmoticonForSentiment(data.overall_sentiment);
      const geminiExplanation = await getGeminiExplanation(text);

      resultDiv.innerHTML = `
        <div class="sentiment-header">
          <h2>Sentiment Analysis Results ${emoticon}</h2>
        </div>

        <div class="sentiment-overview">
          <h3>Overall Analysis</h3>
          <p class="description">${data.description}</p>
          <h4>Sentiment: <span style="color: ${sentimentColor};">${
        data.overall_sentiment
      }</span></h4>
          <div class="gemini-analysis">
            <h3>Explanation</h3>
            <p>${geminiExplanation}</p>
          </div>
          <p>Combined Score: ${createProgressBar(data.combined_score)}</p>
        </div>

        <div class="detailed-analysis">
          <div class="vader-analysis">
            <h3>VADER Analysis</h3>
            <div class="score-grid">
              <div class="score-item">
                <label>Positive</label>
                ${createProgressBar(data.vader_scores.pos)}
              </div>
              <div class="score-item">
                <label>Negative</label>
                ${createProgressBar(data.vader_scores.neg)}
              </div>
              <div class="score-item">
                <label>Neutral</label>
                ${createProgressBar(data.vader_scores.neu)}
              </div>
              <div class="score-item">
                <label>Compound</label>
                ${createProgressBar(data.vader_scores.compound)}
              </div>
            </div>
            <div class="explanation">
              ${Object.entries(data.vader_explanation)
                .map(([key, value]) => `<p>${value}</p>`)
                .join("")}
            </div>
          </div>

          <div class="bert-analysis">
            <h3>BERT Analysis</h3>
            <div class="bert-score">
              <p>Model Score: ${createProgressBar(
                (parseFloat(data.bert_score[0].label.split()[0]) - 3) / 2
              )}</p>
              <p>Confidence: ${createProgressBar(data.bert_score[0].score)}</p>
            </div>
            <div class="explanation">
              ${Object.entries(data.bert_explanation)
                .map(([key, value]) => `<p>${value}</p>`)
                .join("")}
            </div>
          </div>
        </div>
      `;
      break; // Exit the loop if successful
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

// Attach analyzeSentimentWithRetry to button click event
document.addEventListener("DOMContentLoaded", function () {
  document
    .getElementById("analyzeButton")
    .addEventListener("click", debounce(analyzeSentimentWithRetry, 300));
});

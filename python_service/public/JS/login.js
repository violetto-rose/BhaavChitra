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

const emailSection = document.getElementById("emailSection");
const passwordSection = document.getElementById("passwordSection");
const continueWithEmail = document.getElementById("continueWithEmail");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signIn = document.getElementById("signIn");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const googleLoginButton = document.getElementById("googleLoginButton");

// Email validation function
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Continue with email handler
continueWithEmail.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();

  if (!email) {
    showError(emailError, "Please enter your email address");
    return;
  }

  if (!isValidEmail(email)) {
    showError(emailError, "Please enter a valid email address");
    return;
  }

  try {
    const response = await fetch("/check-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (response.ok) {
      // Hide email section and show password section
      emailSection.style.display = "none";
      passwordSection.style.display = "block";
      passwordInput.focus();
    } else {
      showError(emailError, data.error || "An error occurred. Please try again.");
    }
  } catch (error) {
    showError(emailError, "Network error. Please try again.");
  }
});

// Sign in handler
signIn.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!password) {
    showError(passwordError, "Please enter your password");
    return;
  }

  try {
    signIn.disabled = true;
    signIn.textContent = "Signing in...";

    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      window.location.href = data.redirect;
    } else {
      showError(passwordError, data.error || "Invalid email or password");
    }
  } catch (error) {
    showError(passwordError, "Network error. Please try again.");
  } finally {
    signIn.disabled = false;
    signIn.textContent = "Sign in";
  }
});

// Add Google login handler
googleLoginButton.addEventListener("click", async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        google_login: true,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      window.location.href = data.redirect;
    } else {
      showError(data.error || "An error occurred during Google login");
    }
  } catch (error) {
    showError("Network error. Please try again.");
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Signing in...";

    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      window.location.href = data.redirect;
    } else {
      showError(data.error || "An error occurred during login");
    }
  } catch (error) {
    showError("Network error. Please try again.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Sign in";
  }
});

function showError(element, message) {
  element.textContent = message;
  element.style.display = "block";

  setTimeout(() => {
    element.style.display = "none";
  }, 5000);
}
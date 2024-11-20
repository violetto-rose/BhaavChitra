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

const loginForm = document.getElementById("loginForm");
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

// Enhanced password validation function
function isValidPassword(password) {
  // Check minimum length
  if (password.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long",
    };
  }

  // Check complexity requirements
  const complexityChecks = [
    {
      regex: /[A-Z]/,
      message: "Password must contain at least one uppercase letter",
    },
    {
      regex: /[a-z]/,
      message: "Password must contain at least one lowercase letter",
    },
    {
      regex: /[0-9]/,
      message: "Password must contain at least one number",
    },
    {
      regex: /[!@#$%^&*(),.?":{}|<>]/,
      message: "Password must contain at least one special character",
    },
  ];

  for (const check of complexityChecks) {
    if (!check.regex.test(password)) {
      return {
        valid: false,
        message: check.message,
      };
    }
  }

  return {
    valid: true,
    message: "",
  };
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
      const userExists =
        data.user_exists !== undefined ? data.user_exists : false;

      if (userExists) {
        signIn.querySelector(".inner").textContent = "Sign In";
        signIn.setAttribute("data-user-exists", "true");
      } else {
        signIn.querySelector(".inner").textContent = "Sign Up";
        signIn.setAttribute("data-user-exists", "false");
      }

      emailSection.style.display = "none";
      passwordSection.style.display = "block";
      passwordInput.focus();

      signIn.dataset.userExists = userExists;
    } else {
      const errorMessage =
        data.error ||
        "An error occurred while checking email. Please try again.";

      showError(emailError, errorMessage);
      console.error("Email check error:", errorMessage);
    }
  } catch (error) {
    console.error("Fetch error details:", error);

    if (error instanceof TypeError) {
      showError(emailError, "Network error. Please check your connection.");
    } else {
      showError(emailError, "An unexpected error occurred. Please try again.");
    }
  }
});

// Sign-in handler to handle both sign-in and sign-up
signIn.addEventListener("click", async (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const isUserExists = signIn.dataset.userExists === "true";

  passwordError.textContent = "";
  passwordError.style.display = "none";

  if (!isUserExists) {
    const passwordValidation = isValidPassword(password);

    if (!passwordValidation.valid) {
      showError(passwordError, passwordValidation.message);
      return;
    }
  }

  if (!password) {
    showError(passwordError, "Please enter your password");
    return;
  }

  try {
    signIn.disabled = true;
    signIn.querySelector(".inner").textContent = isUserExists
      ? "Signing in..."
      : "Signing up...";

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
      showError(
        passwordError,
        data.error ||
          (isUserExists ? "Invalid email or password" : "Sign up failed")
      );
    }
  } catch (error) {
    showError(passwordError, "Network error. Please try again.");
  } finally {
    signIn.disabled = false;
  }
});

// Add Google login handler
googleLoginButton.addEventListener("click", async (e) => {
  e.preventDefault();

  startSigningInAnimation(googleLoginButton);

  try {
    await new Promise((resolve) => setTimeout(resolve, 5000));

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
      stopSigningInAnimation(googleLoginButton);
      showError(data.error || "An error occurred during Google login");
    }
  } catch (error) {
    stopSigningInAnimation(googleLoginButton);
    showError("Network error. Please try again.");
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = emailInput.value;
  const password = passwordInput.value;

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
      showError(data.error || "An error occurred during login");
    }
  } catch (error) {
    showError("Network error. Please try again.");
  } finally {
    signIn.disabled = false;
  }
});

passwordInput.addEventListener("input", () => {
  const password = passwordInput.value;
  const passwordValidation = isValidPassword(password);

  if (password) {
    if (!passwordValidation.valid) {
      passwordInput.classList.add("invalid-password");
    } else {
      passwordInput.classList.remove("invalid-password");
    }
  }
});

function showError(element, message) {
  if (element) {
    element.textContent = message;
    element.style.display = "block";

    setTimeout(() => {
      element.style.display = "none";
    }, 5000);
  } else {
    console.error("Error element not found:", message);
  }
}

// Add signing-in animation to the button
function startSigningInAnimation(button) {
  button.disabled = true;
  button.innerHTML = `
    <span class="signing-in">
      Signing in<span class="dots-animation"></span>
    </span>
  `;
}

// Restore button state
function stopSigningInAnimation(button) {
  button.disabled = false;
  button.innerHTML = `
    <svg height="18" width="18" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
    Continue with Google
  `;
}

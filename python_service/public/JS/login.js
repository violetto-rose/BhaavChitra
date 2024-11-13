const emailForm = document.getElementById("emailForm");
const passwordForm = document.getElementById("passwordForm");
const backButton = document.getElementById("backButton");
const headerText = document.getElementById("headerText");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const slideshow = document.querySelector('.slideshow');
const images = slideshow.querySelectorAll('img');

let currentImage = 0;

setInterval(() => {
  images[currentImage].classList.remove('active');
  currentImage = (currentImage + 1) % images.length;
  images[currentImage].classList.add('active');
}, 3000); // Change the interval time as needed

emailForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = emailInput.value;

  if (!isValidEmail(email)) {
    emailError.textContent = "Please enter a valid email address";
    emailError.style.display = "block";
    return;
  }

  emailForm.style.display = "none";
  passwordForm.style.display = "block";
  backButton.style.display = "block";
  headerText.textContent = `Welcome back, ${email.split("@")[0]}`;
});

passwordForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const password = passwordInput.value;

  if (password.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters";
    passwordError.style.display = "block";
    return;
  }

  console.log("Logging in with:", {
    email: emailInput.value,
    password: passwordInput.value,
  });
});

backButton.addEventListener("click", () => {
  emailForm.style.display = "block";
  passwordForm.style.display = "none";
  backButton.style.display = "none";
  headerText.textContent = "Sign in";
  passwordInput.value = "";
  passwordError.style.display = "none";
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

document.querySelector(".btn-google").addEventListener("click", () => {
  console.log("Google login clicked");
});

// Utility function to generate random numbers within a range
function random(min, max) {
  return Math.random() * (max - min) + min;
}

// Preload resources and fonts for better performance
function preloadResources() {
  const logo = "@resources/logo-dark.svg";
  const link = document.createElement("link");
  link.rel = "preload";
  link.href = logo;
  link.as = "image/svg+xml";
  document.head.appendChild(link);

  if (window.location.pathname === "/index.html") {
    const resources = [
      "@resources/background.mp4",
      "@resources/intro.gif",
      "@resources/button.gif",
    ];
    resources.forEach((url) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.href = url;
      link.as = url.endsWith(".mp4")
        ? "video/mp4"
        : url.endsWith(".gif")
        ? "image/gif"
        : "image/*";
      document.head.appendChild(link);
    });
  }

  const fontLink = document.createElement("link");
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;700&family=Rowdies:wght@700&display=swap";
  fontLink.rel = "stylesheet";
  document.head.appendChild(fontLink);
}

// Check for font readiness with a timeout fallback
async function ensureFontsLoaded() {
  const timeoutPromise = new Promise((resolve) => setTimeout(resolve, 3000)); // Timeout after 3 seconds
  const fontPromise = document.fonts.ready;

  try {
    await Promise.race([fontPromise, timeoutPromise]);
    return true;
  } catch (error) {
    console.error("Error loading fonts:", error);
    return false;
  }
}

window.addEventListener("load", async function () {
  preloadResources();

  // Show content and hide spinner after fonts or timeout
  const fontsLoaded = await ensureFontsLoaded();

  const loadingScreen = document.getElementById("loading-screen");
  const content = document.querySelector(".content");

  // Hide the loading spinner and show content if font loaded
  if (fontsLoaded) {
    loadingScreen.style.display = "none";
    content.style.display = "flex";
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // const cursor = document.getElementById("circularcursor");
  const hamburger = document.querySelector(".hamburger");
  const navbarLinks = document.querySelector(".navbar-links");
  const analyzeButton = document.getElementById("analyzeButton");
  const popupOverlay = document.getElementById("popupOverlay");
  const submitAnalysisType = document.getElementById("submitAnalysisType");

  hamburger.addEventListener("click", () => {
    navbarLinks.classList.toggle("active");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      if (popupOverlay.style.display === "flex") {
        event.preventDefault(); // Prevent default Enter behavior
        submitAnalysisType.click();
      } else {
        event.preventDefault();
        analyzeButton.click();
      }
    }
  });

  /* Custom cursor hidden temorarily due to issues
  // Check if the device is a PC
  if (window.matchMedia("(pointer: fine)").matches) {
    // Show the cursor
    cursor.style.display = "block";

    document.addEventListener("mousemove", (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });

    document
      .querySelectorAll("a, button, .hover-target, .launch-btn")
      .forEach((element) => {
        element.addEventListener("mouseover", () =>
          cursor.classList.add("hover")
        );
        element.addEventListener("mouseout", () =>
          cursor.classList.remove("hover")
        );
      });

    // Function to show/hide custom cursor on input focus, hover, and blur
    function handleInputFocus() {
      if (cursor) {
        cursor.style.display = "none"; // Hide cursor on input focus
      }
    }

    function handleInputBlur() {
      if (cursor) {
        cursor.style.display = "block"; // Show cursor when input loses focus
      }
    }

    function handleInputMouseOver() {
      if (cursor) {
        cursor.style.display = "none"; // Hide cursor on input hover
      }
    }

    function handleInputMouseOut() {
      if (cursor) {
        cursor.style.display = "block"; // Show cursor when input is no longer hovered
      }
    }

    // Add event listeners to all input fields
    document.querySelectorAll("input, textarea").forEach((input) => {
      input.addEventListener("focus", handleInputFocus); // Hide cursor on focus
      input.addEventListener("blur", handleInputBlur); // Show cursor when not focused
      input.addEventListener("mouseover", handleInputMouseOver); // Hide cursor on hover
      input.addEventListener("mouseout", handleInputMouseOut); // Show cursor on hover out
    });
  } else {
    // Hide the cursor for mobile devices
    cursor.style.display = "none";
  }
  */
});

// Starry sky and twinkling effect
const starCount = 100;
const starContainer = document.getElementById("backgroundContainer");

for (let i = 0; i < starCount; i++) {
  const star = document.createElement("span");
  star.className = "star";
  star.style.top = `${random(0, 100)}%`;
  star.style.left = `${random(0, 100)}%`;
  starContainer.appendChild(star);
}

// Randomly apply glow to a limited number of stars each interval
setInterval(() => {
  const stars = Array.from(starContainer.querySelectorAll(".star"));
  const glowingStars = stars
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.floor(stars.length * 0.1)); // 10% random stars

  stars.forEach((star) => {
    const glowDuration = random(2, 4);
    star.style.transition = `opacity ${glowDuration}s ease-in-out, box-shadow ${glowDuration}s ease-in-out`;

    if (glowingStars.includes(star)) {
      star.style.opacity = 1;
      star.style.boxShadow = `0px 0px 8px 2px var(--spice-star-glow)`;
    } else {
      star.style.opacity = 0.5;
      star.style.boxShadow = `0px 0px 4px 1px var(--spice-star-glow)`;
    }
  });
}, 5000);

// Create shooting stars originating from top or right side
function createShootingStar() {
  const shootingstar = document.createElement("span");
  shootingstar.className = "shootingstar";

  if (Math.random() < 0.5) {
    shootingstar.style.top = "-4px";
    shootingstar.style.left = `${random(0, 100)}%`;
  } else {
    shootingstar.style.top = `${random(0, 100)}%`;
    shootingstar.style.left = "100vw";
  }

  shootingstar.style.background = "rgba(255, 255, 255, 1)";
  shootingstar.style.boxShadow = `
    0 0 20px rgba(255, 255, 255, 1),
    0 0 40px rgba(255, 255, 255, 1),
    0 0 60px rgba(255, 255, 255, 1)
  `;

  starContainer.appendChild(shootingstar);

  setTimeout(() => shootingstar.remove(), 5000);
}
setInterval(createShootingStar, 6000);

// Display based on mobile/pc
function displayHtml() {
  const screenWidth = window.innerWidth;
  const mobileHtml = document.getElementById("mobile-content");
  const pcHtml = document.getElementById("pc-content");

  if (mobileHtml && pcHtml) {
    if (screenWidth <= 768) {
      mobileHtml.style.display = "flex";
      pcHtml.style.display = "none";
    } else {
      mobileHtml.style.display = "none";
      pcHtml.style.display = "flex";
    }
  }
}

window.addEventListener("resize", displayHtml);
displayHtml();

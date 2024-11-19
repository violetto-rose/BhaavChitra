// Preload resources and fonts for better performance
function preloadResources() {
  if (window.location.pathname === "/index.html") {
    const logo = "@resources/logo-dark.svg";
    const link = document.createElement("link");
    link.rel = "preload";
    link.href = logo;
    link.as = "image/svg+xml";
    document.head.appendChild(link);
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

  const fontsLoaded = await ensureFontsLoaded();
  const loadingScreen = document.getElementById("loading-screen");

  if (fontsLoaded) {
    loadingScreen.style.display = "none";
    document.body.style.display = "";
    document.body.style.overflow = "auto";
    document.documentElement.style.overflow = "auto";
  }
});

document.addEventListener("DOMContentLoaded", () => {
  /*const cursor = document.getElementById("circularcursor");*/

  const currentPage = window.location.pathname.split("/").pop();

  const hamburger = document.querySelector(".hamburger");
  const navbarLinks = document.querySelector(".navbar-links");

  const continueWithEmail = document.getElementById("continueWithEmail");
  const passwordSection = document.getElementById("passwordSection");
  const signIn = document.getElementById("signIn");

  const popupOverlay = document.getElementById("popupOverlay");
  const submitAnalysisType = document.getElementById("submitAnalysisType");
  const analyzeButton = document.getElementById("analyzeButton");

  if (
    currentPage === "index.html" ||
    currentPage === "bhaavchitra.html" ||
    currentPage === "about.html"
  ) {
    hamburger.addEventListener("click", () => {
      navbarLinks.classList.toggle("active");
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();

      switch (currentPage) {
        case "":
          window.location.href = "/bhaavchitra";
          break;

        case "bhaavchitra":
          const overlayDisplay = popupOverlay
            ? window.getComputedStyle(popupOverlay).display
            : "none";

          if (overlayDisplay === "flex") {
            submitAnalysisType?.click();
          } else {
            analyzeButton?.click();
          }
          break;

        case "login":
        case "login?next=%2Fbhaavchitra":
          if (passwordSection && passwordSection.style.display === "none") {
            continueWithEmail?.click();
          } else {
            signIn?.click();
          }
          break;

        default:
          console.warn("Unhandled page:", currentPage);
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

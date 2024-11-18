// Load CSS
function loadNavCSS() {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./CSS/nav.css";
  document.head.appendChild(link);
}

// Inject navbar
function injectNavbar() {
  const navbar = document.createElement("nav");
  navbar.classList.add("navbar");

  const navbarContainer = document.createElement("div");
  navbarContainer.classList.add("navbar-container");

  const logoLink = document.createElement("a");
  logoLink.href = "index.html";
  logoLink.classList.add("navbar-logo");
  const logoImg = document.createElement("img");
  logoImg.src = "./@resources/logo-dark.svg";
  logoImg.alt = "Logo";
  logoLink.appendChild(logoImg);

  const navbarLinks = document.createElement("ul");
  navbarLinks.classList.add("navbar-links");

  const links = [
    { href: "/", text: "Home", id: "home-link" },
    { href: "/bhaavchitra", text: "Services", id: "services-link" },
    { href: "/about", text: "About", id: "about-link" },
  ];

  links.forEach((linkData) => {
    const li = document.createElement("li");
    li.classList.add("nav-item");

    const a = document.createElement("a");
    a.href = linkData.href;
    a.classList.add("nav-link");
    a.id = linkData.id;
    a.textContent = linkData.text;

    li.appendChild(a);
    navbarLinks.appendChild(li);
  });

  const currentPage = window.location.pathname.split("/").pop();
  if ((currentPage === "bhaavchitra.html" || currentPage === "bhaavchitra") || (currentPage === "about.html" || currentPage === "about")) {
    const logoutLi = document.createElement("li");
    logoutLi.classList.add("nav-item");

    const logoutLink = document.createElement("a");
    logoutLink.href = "/logout";
    logoutLink.classList.add("nav-link");
    logoutLink.id = "logout-link";
    logoutLink.textContent = "Logout";

    logoutLink.addEventListener("click", (event) => {
      event.preventDefault();
      logoutUser();
    });

    logoutLi.appendChild(logoutLink);
    navbarLinks.appendChild(logoutLi);
  }

  const hamburger = document.createElement("div");
  hamburger.classList.add("hamburger");
  hamburger.innerHTML = "&#9776;";
  hamburger.setAttribute("aria-expanded", "false");

  hamburger.addEventListener("click", () => {
    const isActive = navbarLinks.classList.toggle("active");
    hamburger.classList.toggle("active");
    hamburger.setAttribute("aria-expanded", isActive);
  });

  // Close menu on background click
  document.addEventListener("click", (event) => {
    if (!navbar.contains(event.target) && !hamburger.contains(event.target)) {
      navbarLinks.classList.remove("active");
      hamburger.classList.remove("active");
      hamburger.setAttribute("aria-expanded", "false");
    }
  });

  navbarContainer.appendChild(logoLink);
  navbarContainer.appendChild(navbarLinks);
  navbarContainer.appendChild(hamburger);
  navbar.appendChild(navbarContainer);
  document.body.insertBefore(navbar, document.body.firstChild);
}

// Set active link
function setActiveLink() {
  const currentPage = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute("href").split("/").pop();
    if (
      linkPage === currentPage ||
      (currentPage === "" && linkPage === "index.html") ||
      (currentPage === "bhaavchitra" && linkPage === "bhaavchitra.html")
    ) {
      link.classList.add("active");
    }
  });
}

// Set navbar width (Overriding the flex)
function setNavbarWidth() {
  const currentPage = window.location.pathname.split("/").pop();
  const navbar = document.querySelector(".navbar");
  // Set navbar width for this page due to flex display
  navbar.style.width =
    currentPage === "bhaavchitra.html" || currentPage === "bhaavchitra"
      ? "100%"
      : "";
}

// Logout function
function logoutUser() {
  fetch("/logout", {
    method: "GET",
    credentials: "same-origin",
  })
    .then(() => {
      sessionStorage.clear();
      window.location.href = "/login";
    })
    .catch((error) => {
      console.error("Logout error:", error);
      window.location.href = "/login"; // Redirect to login even if there's an error
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadNavCSS();
  injectNavbar();
  setActiveLink();
  setNavbarWidth();
});

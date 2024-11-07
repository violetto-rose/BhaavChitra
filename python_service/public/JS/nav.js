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
    { href: "index.html", text: "Home", id: "home-link" },
    { href: "bhaavchitra.html", text: "Services", id: "services-link" },
    { href: "about.html", text: "About", id: "about-link" },
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
    if (linkPage === currentPage) {
      link.classList.add("active");
    }
  });
}

// Set navbar width (Overriding the flex)
function setNavbarWidth() {
  const currentPage = window.location.pathname.split("/").pop();
  const navbar = document.querySelector(".navbar");
  // Set navbar width for this page due to flex display
  navbar.style.width = currentPage === "bhaavchitra.html" ? "100%" : "";
}

document.addEventListener("DOMContentLoaded", () => {
  loadNavCSS();
  injectNavbar();
  setActiveLink();
  setNavbarWidth();
});

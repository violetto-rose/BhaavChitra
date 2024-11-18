// Utility function to generate random numbers within a range
function random(min, max) {
  return Math.random() * (max - min) + min;
}

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

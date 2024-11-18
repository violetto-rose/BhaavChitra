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

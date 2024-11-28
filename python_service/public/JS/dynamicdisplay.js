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

// Video control functionality
document.addEventListener('DOMContentLoaded', function() {
  const videoControl = document.getElementById('video-control');
  const video = document.querySelector('.background-video');
  const pauseIcon = document.querySelector('.pause-icon');
  const playIcon = document.querySelector('.play-icon');

  if (videoControl && video) {
    videoControl.addEventListener('click', function() {
      if (video.paused) {
        video.play();
        pauseIcon.style.display = 'block';
        playIcon.style.display = 'none';
      } else {
        video.pause();
        pauseIcon.style.display = 'none';
        playIcon.style.display = 'block';
      }
    });
  }
});

async function loadConfig() {
  try {
    const response = await fetch("config.json");
    const config = await response.json();
    startTimer(config.timerMinutes * 60, config);
  } catch (error) {
    document.getElementById("timer").textContent = "Error loading config.";
    console.error(error);
  }
}

function startTimer(duration, config) {
  let timer = duration;
  const timerDisplay = document.getElementById("timer");
  const resetBtn = document.getElementById("resetBtn");

  if (config.showResetButton) resetBtn.style.display = "block";

  const countdown = setInterval(() => {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    timerDisplay.textContent = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

    if (--timer < 0) {
      clearInterval(countdown);
      window.location.href = config.redirectTimeUp;
    }
  }, 1000);

  resetBtn.onclick = () => {
    clearInterval(countdown);
    startTimer(duration, config);
  };
}

loadConfig();

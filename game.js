const board = document.querySelector("#game-board");
const token = document.querySelector("#idea-token");
const startButton = document.querySelector("#start-game");
const scoreText = document.querySelector("#score");
const timeText = document.querySelector("#time-left");
const bestText = document.querySelector("#best-score");
const message = document.querySelector("#game-message");

const roundSeconds = 30;
let score = 0;
let timeLeft = roundSeconds;
let timerId = null;
let active = false;
let bestScore = Number(localStorage.getItem("moon-notes-best-score") || 0);

bestText.textContent = String(bestScore);

function moveToken() {
  const boardBox = board.getBoundingClientRect();
  const tokenBox = token.getBoundingClientRect();
  const maxX = Math.max(boardBox.width - tokenBox.width - 16, 0);
  const maxY = Math.max(boardBox.height - tokenBox.height - 16, 0);
  const x = Math.round(8 + Math.random() * maxX);
  const y = Math.round(8 + Math.random() * maxY);

  token.style.transform = `translate(${x}px, ${y}px) rotate(${Math.random() * 10 - 5}deg)`;
}

function finishGame() {
  active = false;
  clearInterval(timerId);
  startButton.disabled = false;
  token.classList.remove("is-active");
  board.classList.remove("is-playing");

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("moon-notes-best-score", String(bestScore));
    bestText.textContent = String(bestScore);
    message.textContent = `新纪录：${score} 个想法，今天手感不错。`;
    return;
  }

  message.textContent = `这一局收集了 ${score} 个想法。`;
}

function startGame() {
  score = 0;
  timeLeft = roundSeconds;
  active = true;
  scoreText.textContent = "0";
  timeText.textContent = String(roundSeconds);
  message.textContent = "灵感出现了，快点它。";
  startButton.disabled = true;
  token.classList.add("is-active");
  board.classList.add("is-playing");
  moveToken();

  clearInterval(timerId);
  timerId = setInterval(() => {
    timeLeft -= 1;
    timeText.textContent = String(timeLeft);

    if (timeLeft <= 0) {
      finishGame();
    }
  }, 1000);
}

token.addEventListener("click", (event) => {
  event.stopPropagation();

  if (!active) {
    return;
  }

  score += 1;
  scoreText.textContent = String(score);
  message.textContent = score % 5 === 0 ? "连着抓到好几个了。" : "抓到了。";
  token.classList.remove("is-caught");
  void token.offsetWidth;
  token.classList.add("is-caught");
  moveToken();
});

board.addEventListener("click", () => {
  if (active) {
    message.textContent = "差一点，再点准一点。";
  }
});

startButton.addEventListener("click", startGame);

window.addEventListener("resize", () => {
  if (active) {
    moveToken();
  }
});

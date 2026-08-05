const screens = [...document.querySelectorAll(".screen")];
const yesBtn = document.querySelector("#yesBtn");
const noBtn = document.querySelector("#noBtn");
const teaseNextBtn = document.querySelector("#teaseNextBtn");
const dateInput = document.querySelector("#dateInput");
const dateNextBtn = document.querySelector("#dateNextBtn");
const placeInput = document.querySelector("#placeInput");
const foodInput = document.querySelector("#foodInput");
const submitBtn = document.querySelector("#submitBtn");
const summary = document.querySelector("#summary");
const restartBtn = document.querySelector("#restartBtn");
let lastTrailTime = 0;

const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
  .toISOString()
  .split("T")[0];

dateInput.min = localToday;

function showScreen(name) {
  screens.forEach((screen) => {
    screen.classList.toggle("active", screen.dataset.screen === name);
  });
}

function runAway() {
  const padding = 28;
  const activeScreen = document.querySelector('.screen[data-screen="ask"]');
  const minX = padding;
  const minY = padding;
  const maxX = activeScreen.clientWidth - noBtn.offsetWidth - padding;
  const maxY = activeScreen.clientHeight - noBtn.offsetHeight - padding;
  const x = minX + Math.random() * Math.max(0, maxX - minX);
  const y = minY + Math.random() * Math.max(0, maxY - minY);
  const nextX = Math.min(Math.max(x, minX), maxX);
  const nextY = Math.min(Math.max(y, minY), maxY);
  const screenBounds = activeScreen.getBoundingClientRect();

  noBtn.style.position = "absolute";
  noBtn.style.left = `${nextX}px`;
  noBtn.style.top = `${nextY}px`;
  noBtn.style.zIndex = "30";
  burstAt(screenBounds.left + nextX + noBtn.offsetWidth / 2, screenBounds.top + nextY + noBtn.offsetHeight / 2, 5);
}

function requireValue(input, message) {
  if (input.value.trim()) return true;
  input.setCustomValidity(message);
  input.reportValidity();
  input.setCustomValidity("");
  return false;
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderSummary(details) {
  summary.replaceChildren(
    buildSummaryLine("Date", details.date),
    buildSummaryLine("Place", details.place),
    buildSummaryLine("Food", details.food),
  );
}

function buildSummaryLine(label, value) {
  const line = document.createElement("p");
  const labelEl = document.createElement("strong");
  labelEl.textContent = `${label}:`;
  line.append(labelEl, ` ${value}`);
  return line;
}

async function sendBooking(details) {
  const response = await fetch("/api/book-date", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(details),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || "Booking notification failed");
  }
}

function createTwinkle(x, y) {
  const twinkle = document.createElement("span");
  twinkle.className = "pointer-twinkle";
  twinkle.style.left = `${x}px`;
  twinkle.style.top = `${y}px`;
  document.body.append(twinkle);
  twinkle.addEventListener("animationend", () => twinkle.remove(), { once: true });
}

function burstAt(x, y, count = 8) {
  for (let index = 0; index < count; index += 1) {
    window.setTimeout(() => {
      createTwinkle(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 60);
    }, index * 28);
  }
}

yesBtn.addEventListener("click", () => {
  noBtn.removeAttribute("style");
  burstAt(window.innerWidth / 2, window.innerHeight / 2, 12);
  showScreen("tease");
});
teaseNextBtn.addEventListener("click", () => showScreen("calendar"));
noBtn.addEventListener("mouseenter", runAway);
noBtn.addEventListener("focus", runAway);
noBtn.addEventListener("click", runAway);

dateNextBtn.addEventListener("click", () => {
  if (requireValue(dateInput, "Please pick a date first.")) {
    showScreen("details");
  }
});

document.querySelectorAll("[data-back]").forEach((button) => {
  button.addEventListener("click", () => {
    noBtn.removeAttribute("style");
    showScreen(button.dataset.back);
  });
});

window.addEventListener("pointermove", (event) => {
  const now = Date.now();
  if (now - lastTrailTime < 90) return;
  lastTrailTime = now;
  createTwinkle(event.clientX, event.clientY);
});

submitBtn.addEventListener("click", async () => {
  const valid =
    requireValue(placeInput, "Please enter where you want to go.") &&
    requireValue(foodInput, "Please enter what you want to eat.");

  if (!valid) return;

  const details = {
    date: formatDate(dateInput.value),
    place: placeInput.value.trim(),
    food: foodInput.value.trim(),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "booking...";

  try {
    await sendBooking(details);
    renderSummary(details);
    showScreen("success");
    burstAt(window.innerWidth / 2, window.innerHeight / 2, 18);
  } catch (error) {
    alert(error.message || "Booking notification could not be sent. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "book date";
  }
});

restartBtn.addEventListener("click", () => {
  dateInput.value = "";
  placeInput.value = "";
  foodInput.value = "";
  noBtn.removeAttribute("style");
  showScreen("ask");
});

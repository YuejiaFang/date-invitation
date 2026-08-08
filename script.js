const BOOKING_NOTIFICATION_URL = "https://date-booking.fangyuejia.workers.dev";

const screens = [...document.querySelectorAll(".screen")];
const yesBtn = document.querySelector("#yesBtn");
const noBtn = document.querySelector("#noBtn");
const teaseNextBtn = document.querySelector("#teaseNextBtn");
const dateInput = document.querySelector("#dateInput");
const dateNextBtn = document.querySelector("#dateNextBtn");
const placeInput = document.querySelector("#placeInput");
const foodInput = document.querySelector("#foodInput");
const emailInput = document.querySelector("#emailInput");
const submitBtn = document.querySelector("#submitBtn");
const summary = document.querySelector("#summary");
const mailLink = document.querySelector("#mailLink");
const restartBtn = document.querySelector("#restartBtn");

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
  const padding = 18;
  const activeScreen = document.querySelector('.screen[data-screen="ask"]');
  const bounds = activeScreen.getBoundingClientRect();

  const maxX = bounds.right - noBtn.offsetWidth - padding;
  const maxY = bounds.bottom - noBtn.offsetHeight - padding;
  const x = bounds.left + padding + Math.random() * Math.max(0, maxX - bounds.left - padding);
  const y = bounds.top + padding + Math.random() * Math.max(0, maxY - bounds.top - padding);

  noBtn.style.position = "fixed";
  noBtn.style.left = `${x}px`;
  noBtn.style.top = `${y}px`;
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

function buildEmailHref(details) {
  const subject = "Date booking details";
  const body = [
    "Reservation successful!",
    "",
    `Date: ${details.date}`,
    `Place: ${details.place}`,
    `Food: ${details.food}`,
    `Email: ${details.email}`,
    "",
    "See you there.",
  ].join("\n");

  return `mailto:${encodeURIComponent(details.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

async function sendBookingNotification(details) {
  const response = await fetch(BOOKING_NOTIFICATION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(details),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(message || "Booking notification failed.");
  }

  return response.json();
}

yesBtn.addEventListener("click", () => {
  noBtn.removeAttribute("style");
  showScreen("tease");
});

teaseNextBtn.addEventListener("click", () => {
  showScreen("calendar");
});

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

submitBtn.addEventListener("click", async () => {
  const valid =
    requireValue(dateInput, "Please pick a date first.") &&
    requireValue(placeInput, "Please enter where you want to go.") &&
    requireValue(foodInput, "Please enter what you want to eat.") &&
    requireValue(emailInput, "Please enter an email address.") &&
    emailInput.reportValidity();

  if (!valid) return;

  const details = {
    date: formatDate(dateInput.value),
    place: placeInput.value.trim(),
    food: foodInput.value.trim(),
    email: emailInput.value.trim(),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "booking...";

  try {
    await sendBookingNotification(details);

    summary.innerHTML = `
      <p><strong>Date:</strong> ${details.date}</p>
      <p><strong>Place:</strong> ${details.place}</p>
      <p><strong>Food:</strong> ${details.food}</p>
      <p><strong>Email:</strong> ${details.email}</p>
    `;

    mailLink.href = buildEmailHref(details);
    showScreen("success");
  } catch (error) {
    console.error(error);
    alert(error.message || "Booking notification failed");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "book date";
  }
});

restartBtn.addEventListener("click", () => {
  dateInput.value = "";
  placeInput.value = "";
  foodInput.value = "";
  emailInput.value = "";
  noBtn.removeAttribute("style");
  showScreen("ask");
});

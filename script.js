const BOOKING_NOTIFICATION_URL = "https://date-booking.fangyuejia.workers.dev";

document.addEventListener("DOMContentLoaded", () => {
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

  if (dateInput) {
    dateInput.min = localToday;
  }

  function showScreen(name) {
    screens.forEach((screen) => {
      screen.classList.toggle("active", screen.dataset.screen === name);
    });
  }

  function runAway() {
    if (!noBtn) return;

    const padding = 18;
    const activeScreen = document.querySelector('.screen[data-screen="ask"]');
    if (!activeScreen) return;

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
    if (!input) return true;
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

  if (yesBtn) {
    yesBtn.addEventListener("click", () => {
      if (noBtn) noBtn.removeAttribute("style");

      if (teaseNextBtn) {
        showScreen("tease");
      } else {
        showScreen("calendar");
      }
    });
  }

  if (teaseNextBtn) {
    teaseNextBtn.addEventListener("click", () => {
      showScreen("calendar");
    });
  }

  if (noBtn) {
    noBtn.addEventListener("mouseenter", runAway);
    noBtn.addEventListener("focus", runAway);
    noBtn.addEventListener("click", runAway);
  }

  if (dateNextBtn) {
    dateNextBtn.addEventListener("click", () => {
      if (requireValue(dateInput, "Please pick a date first.")) {
        showScreen("details");
      }
    });
  }

  document.querySelectorAll("[data-back]").forEach((button) => {
    button.addEventListener("click", () => {
      if (noBtn) noBtn.removeAttribute("style");
      showScreen(button.dataset.back);
    });
  });

  if (submitBtn) {
    submitBtn.addEventListener("click", async () => {
      const valid =
        requireValue(dateInput, "Please pick a date first.") &&
        requireValue(placeInput, "Please enter where you want to go.") &&
        requireValue(foodInput, "Please enter what you want to eat.") &&
        (!emailInput || emailInput.reportValidity());

      if (!valid) return;

      const details = {
        date: dateInput ? formatDate(dateInput.value) : "Not provided",
        place: placeInput ? placeInput.value.trim() : "Not provided",
        food: foodInput ? foodInput.value.trim() : "Not provided",
        email: emailInput ? emailInput.value.trim() : "",
      };

      submitBtn.disabled = true;
      submitBtn.textContent = "booking...";

      try {
        await sendBookingNotification(details);

        if (summary) {
          summary.innerHTML = `
            <p><strong>Date:</strong> ${details.date}</p>
            <p><strong>Place:</strong> ${details.place}</p>
            <p><strong>Food:</strong> ${details.food}</p>
            ${details.email ? `<p><strong>Email:</strong> ${details.email}</p>` : ""}
          `;
        }

        if (mailLink) {
          mailLink.href = "#";
        }

        showScreen("success");
      } catch (error) {
        console.error(error);
        alert(error.message || "Booking notification failed");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "book date";
      }
    });
  } else {
    alert("submitBtn not found. Please check the book date button id.");
  }

  if (restartBtn) {
    restartBtn.addEventListener("click", () => {
      if (dateInput) dateInput.value = "";
      if (placeInput) placeInput.value = "";
      if (foodInput) foodInput.value = "";
      if (emailInput) emailInput.value = "";
      if (noBtn) noBtn.removeAttribute("style");
      showScreen("ask");
    });
  }
});

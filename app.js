const STORAGE_KEY = "suTakibiState";

const state = loadState();

const elements = {
  todayLabel: document.querySelector("#todayLabel"),
  heroMessage: document.querySelector("#heroMessage"),
  progressRing: document.querySelector("#progressRing"),
  progressPercent: document.querySelector("#progressPercent"),
  currentAmount: document.querySelector("#currentAmount"),
  targetAmount: document.querySelector("#targetAmount"),
  customForm: document.querySelector("#customForm"),
  customAmount: document.querySelector("#customAmount"),
  undoButton: document.querySelector("#undoButton"),
  bmiForm: document.querySelector("#bmiForm"),
  bmiResult: document.querySelector("#bmiResult"),
  bmiValue: document.querySelector("#bmiValue"),
  bmiStatus: document.querySelector("#bmiStatus"),
  toast: document.querySelector("#toast")
};

function todayKey() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.date === todayKey()) {
      return {
        date: saved.date,
        amount: Number(saved.amount) || 0,
        target: Number(saved.target) || 2000,
        lastAdded: Number(saved.lastAdded) || 0
      };
    }
  } catch (error) {
    console.warn("Su takip verisi okunamadı.", error);
  }

  return { date: todayKey(), amount: 0, target: 2000, lastAdded: 0 };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDate() {
  return new Intl.DateTimeFormat("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date()).toLocaleUpperCase("tr-TR");
}

function updateUI(showToastMessage) {
  const percent = Math.min(100, Math.round((state.amount / state.target) * 100));
  elements.progressPercent.textContent = `${percent}%`;
  elements.progressRing.style.setProperty("--progress", `${percent * 3.6}deg`);
  elements.currentAmount.textContent = state.amount.toLocaleString("tr-TR");
  elements.targetAmount.textContent = `${state.target.toLocaleString("tr-TR")} ml`;
  elements.undoButton.disabled = state.lastAdded === 0;

  if (percent >= 100) {
    elements.heroMessage.textContent = "Tebrikler! Günlük hedefini tamamladın.";
  } else if (percent >= 70) {
    elements.heroMessage.textContent = "Çok az kaldı, hedefe ulaşmak üzeresin.";
  } else if (percent >= 30) {
    elements.heroMessage.textContent = "Harika ilerliyorsun!";
  } else {
    elements.heroMessage.textContent = "Biraz suyla güne devam et.";
  }

  updateDragon(percent);

  if (showToastMessage) {
    showToast(showToastMessage);
  }
}

function updateDragon(percent) {
  const fire = Math.max(0, 1 - percent / 100);
  const strip = document.querySelector("#dragonStrip");
  strip.style.setProperty("--fire", fire.toFixed(2));
  strip.classList.toggle("out", percent >= 100);
  document.querySelector(".dragon").classList.toggle("sleepy", percent >= 100);

  let text;
  if (percent >= 100) text = "Ejderhanın ateşi söndü! Teşekkürler 💧";
  else if (percent >= 70) text = "Ateş cılızlaştı, az kaldı!";
  else if (percent >= 30) text = "Ejderhanın ateşi zayıflıyor...";
  else text = "Ejderha ateş püskürtüyor! Su iç!";
  document.querySelector("#dragonText").textContent = text;
}

let toastTimer;
function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 2200);
}

function addWater(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return;

  state.amount = Math.min(state.amount + amount, 5000);
  state.lastAdded = amount;
  state.date = todayKey();
  saveState();
  updateUI(`${amount.toLocaleString("tr-TR")} ml su ekledin`);
}

document.querySelectorAll(".quick-option").forEach((button) => {
  button.addEventListener("click", () => {
    addWater(Number(button.dataset.amount));
  });
});

elements.customForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(elements.customAmount.value);
  if (!amount || amount < 1 || amount > 5000) {
    showToast("Lütfen 1-5000 ml arasında bir miktar gir");
    return;
  }
  addWater(amount);
  elements.customAmount.value = "";
});

elements.undoButton.addEventListener("click", () => {
  if (state.lastAdded <= 0) return;
  const removed = state.lastAdded;
  state.amount = Math.max(0, state.amount - removed);
  state.lastAdded = 0;
  saveState();
  updateUI(`${removed.toLocaleString("tr-TR")} ml geri alındı`);
});

elements.bmiForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const height = Number(document.querySelector("#height").value);
  const weight = Number(document.querySelector("#weight").value);
  if (!height || !weight || height < 50 || height > 250 || weight < 20 || weight > 300) {
    showToast("Geçerli boy ve kilo bilgisi gir");
    return;
  }

  const bmi = weight / ((height / 100) ** 2);
  let status = "Normal";
  let statusColor = "#26799b";

  if (bmi < 18.5) {
    status = "Düşük kilo";
    statusColor = "#8a7a32";
  } else if (bmi < 25) {
    status = "Normal";
  } else if (bmi < 30) {
    status = "Fazla kilo";
    statusColor = "#a66a23";
  } else {
    status = "Obezite";
    statusColor = "#aa4d4d";
  }

  elements.bmiValue.textContent = bmi.toFixed(1);
  elements.bmiStatus.textContent = status;
  elements.bmiStatus.style.color = statusColor;
  elements.bmiResult.hidden = false;
});

elements.todayLabel.textContent = `BUGÜN · ${formatDate().toUpperCase()}`;
updateUI();

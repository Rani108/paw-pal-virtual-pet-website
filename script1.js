
const pets = {
  cat: "🐱",
  dog: "🐶",
  bunny: "🐰"
};

const itemNames = {
  treat: "🍰 Cake Treat",
  shampoo: "🧴 Shampoo",
  toy: "🎾 Ball Toy",
  bow: "🎀 Pink Bow",
  crown: "👑 Royal Crown",
  shades: "🕶️ Cool Shades",
  flower: "🌸 Flower Clip",
  cap: "🧢 Cap"
};

let selectedType = "cat";
let bathSteps = [];
let memoryCards = [];
let flippedCards = [];
let memoryLocked = false;
let toastTimer;
let decayTimer;

const defaultPet = {
  adopted: false,
  type: "cat",
  name: "Mochi",
  hunger: 80,
  happiness: 80,
  energy: 80,
  cleanliness: 80,
  coins: 100,
  xp: 0,
  level: 1,
  games: 0,
  care: 0,
  baths: 0,
  accessory: "",
  room: "pink",
  inventory: [],
  achievements: []
};

function loadSavedPet() {
  try {
    const saved = JSON.parse(localStorage.getItem("pawpal_save"));
    if (saved && typeof saved === "object") {
      return {
        ...defaultPet,
        ...saved,
        inventory: Array.isArray(saved.inventory) ? saved.inventory : [],
        achievements: Array.isArray(saved.achievements) ? saved.achievements : [],
        level: Math.max(1, Number(saved.level) || 1)
      };
    }
  } catch (error) {
    console.warn("Save data could not be loaded.", error);
  }
  return { ...defaultPet };
}

let pet = loadSavedPet();

// NAVIGATION
function showPage(id) {
  if (!pet.adopted && id !== "adoption") {
    showToast("Adopt your pet first! 🐾");
    return;
  }

  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.querySelectorAll(".nav-btn").forEach(button => {
    button.classList.remove("active");
  });

  const page = document.getElementById(id);
  if (page) page.classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(button => {
    if (button.getAttribute("onclick") === `showPage('${id}')`) {
      button.classList.add("active");
    }
  });

  updateUI();
}

// ADOPTION
function choosePet(type, event) {
  selectedType = type;

  document.querySelectorAll(".choose-card").forEach(card => {
    card.classList.remove("selected");
  });

  event.currentTarget.classList.add("selected");
}

function adoptPet() {
  const name = document.getElementById("petNameInput").value.trim();

  if (!name) {
    showToast("Please give your pet a name! 💗");
    return;
  }

  pet = {
    ...defaultPet,
    adopted: true,
    type: selectedType,
    name: name,
    level: 1,
    coins: 100
  };

  saveGame();
  checkAchievements();
  updateUI();
  showPage("home");
  showToast(`${name} is now your best friend! 🐾`);
}

// CARE
function feedPet() {
  pet.hunger = Math.min(100, pet.hunger + 25);
  pet.happiness = Math.min(100, pet.happiness + 5);
  pet.coins += 3;
  pet.care++;
  gainXP(5);
  afterCare("Yum! Your pet enjoyed its food 🍓");
}

function playPet() {
  if (pet.energy < 15) {
    showToast("Your pet is tired. Let it rest first! 😴");
    return;
  }

  pet.happiness = Math.min(100, pet.happiness + 20);
  pet.energy = Math.max(0, pet.energy - 15);
  pet.hunger = Math.max(0, pet.hunger - 10);
  pet.coins += 5;
  pet.care++;
  gainXP(10);
  afterCare("That was so much fun! 🎾");
}

function sleepPet() {
  pet.energy = Math.min(100, pet.energy + 35);
  pet.hunger = Math.max(0, pet.hunger - 5);
  pet.care++;
  gainXP(3);
  afterCare("Your pet had a lovely nap 😴");
}

function groomPet() {
  pet.cleanliness = Math.min(100, pet.cleanliness + 20);
  pet.happiness = Math.min(100, pet.happiness + 8);
  pet.care++;
  gainXP(5);
  afterCare("Your pet's fur is looking fluffy! 🪮");
}

function afterCare(message) {
  updateUI();
  checkAchievements();
  saveGame();
  showToast(message);
}

// LEVELS
function gainXP(amount) {
  pet.xp += amount;

  let leveledUp = false;

  while (pet.xp >= pet.level * 100) {
    pet.xp -= pet.level * 100;
    pet.level++;
    pet.coins += 20;
    leveledUp = true;
  }

  if (leveledUp) {
    showToast(`Level ${pet.level}! You earned 20 bonus coins! ⭐`);
  }
}

// BATH
function bathStep(step) {
  const messages = {
    1: "Soap applied! 🧴",
    2: "Scrub scrub! Lots of bubbles! 🫧",
    3: "All rinsed and fresh! 🚿",
    4: "Drying with a fluffy towel! 🧻"
  };

  if (bathSteps.includes(step)) {
    showToast("You already completed this step!");
    return;
  }

  if (step !== bathSteps.length + 1) {
    showToast("Complete the bath steps in order! 🛁");
    return;
  }

  if (step === 1 && !pet.inventory.includes("shampoo")) {
    showToast("Buy shampoo from the Pet Shop first! 🧴");
    return;
  }

  bathSteps.push(step);

  document.getElementById("bathPet").textContent = pets[pet.type];
  document.getElementById("bathMessage").textContent = messages[step];
  document.getElementById("bathProgress").textContent =
    `Bath progress: ${bathSteps.length} / 4`;

  showToast(messages[step]);
}

function finishBath() {
  if (bathSteps.length !== 4) {
    showToast("Complete all 4 bath steps first! 🫧");
    return;
  }

  pet.cleanliness = 100;
  pet.happiness = Math.min(100, pet.happiness + 15);
  pet.coins += 10;
  pet.baths++;
  pet.care++;
  gainXP(15);

  bathSteps = [];

  document.getElementById("bathProgress").textContent = "Bath progress: 0 / 4";
  document.getElementById("bathMessage").textContent = "Your pet is squeaky clean! ✨";

  afterCare("Bath complete! You earned 10 coins 🪙");
}

function resetBath() {
  bathSteps = [];
  document.getElementById("bathProgress").textContent = "Bath progress: 0 / 4";
  document.getElementById("bathMessage").textContent = "Ready for a fresh bath! 🛁";
  showToast("Bath reset!");
}

// ROCK PAPER SCISSORS
function rps(userChoice) {
  const choices = ["rock", "paper", "scissors"];
  const emoji = { rock: "✊", paper: "✋", scissors: "✌️" };
  const computer = choices[Math.floor(Math.random() * 3)];

  let result;

  if (userChoice === computer) {
    result = "It's a tie! 🤝";
  } else if (
    (userChoice === "rock" && computer === "scissors") ||
    (userChoice === "paper" && computer === "rock") ||
    (userChoice === "scissors" && computer === "paper")
  ) {
    result = "You win! +10 coins 🎉";
    pet.coins += 10;
  } else {
    result = "Your pet wins this round! 🐾";
  }

  document.getElementById("rpsResult").textContent =
    `${emoji[userChoice]} vs ${emoji[computer]} — ${result}`;

  pet.games++;
  pet.happiness = Math.min(100, pet.happiness + 5);
  gainXP(5);
  updateUI();
  checkAchievements();
  saveGame();
}

// MEMORY MATCH
function startMemory() {
  const symbols = ["🍓", "🌸", "🐾", "🍰", "🎀", "🦋", "🍀", "🧸"];

  memoryCards = [...symbols, ...symbols].sort(() => Math.random() - 0.5);
  flippedCards = [];
  memoryLocked = false;

  document.getElementById("memoryResult").textContent = "";
  renderMemory();
}

function renderMemory() {
  const board = document.getElementById("memoryBoard");
  board.innerHTML = "";

  memoryCards.forEach((symbol, index) => {
    const button = document.createElement("button");
    button.className = "memory-card";
    button.textContent = "❔";
    button.setAttribute("aria-label", "Hidden memory card");

    button.onclick = () => flipMemory(index, button);

    board.appendChild(button);
  });
}

function flipMemory(index, button) {
  if (
    memoryLocked ||
    button.classList.contains("flipped") ||
    button.classList.contains("matched")
  ) return;

  button.classList.add("flipped");
  button.textContent = memoryCards[index];
  flippedCards.push({ index, button });

  if (flippedCards.length !== 2) return;

  memoryLocked = true;
  const [a, b] = flippedCards;

  if (memoryCards[a.index] === memoryCards[b.index]) {
    a.button.classList.add("matched");
    b.button.classList.add("matched");

    setTimeout(() => {
      a.button.disabled = true;
      b.button.disabled = true;
      flippedCards = [];
      memoryLocked = false;
      checkMemoryWin();
    }, 350);
  } else {
    setTimeout(() => {
      a.button.classList.remove("flipped");
      b.button.classList.remove("flipped");
      a.button.textContent = "❔";
      b.button.textContent = "❔";
      flippedCards = [];
      memoryLocked = false;
    }, 850);
  }
}

function checkMemoryWin() {
  const matched = document.querySelectorAll(".memory-card.matched").length;

  if (matched === 16) {
    document.getElementById("memoryResult").textContent =
      "Amazing! You found every pair! +25 coins 🪙";

    pet.coins += 25;
    pet.games++;
    pet.happiness = Math.min(100, pet.happiness + 15);
    gainXP(20);
    updateUI();
    checkAchievements();
    saveGame();
  }
}

// SHOP
function buyItem(item, price) {
  if (pet.inventory.includes(item)) {
    showToast("You already own this item! 🎒");
    return;
  }

  if (pet.coins < price) {
    showToast("Not enough coins! Play games to earn more 🪙");
    return;
  }

  pet.coins -= price;
  pet.inventory.push(item);

  if (item === "treat") pet.happiness = Math.min(100, pet.happiness + 15);
  if (item === "toy") pet.happiness = Math.min(100, pet.happiness + 5);

  updateUI();
  saveGame();
  checkAchievements();
  showToast(`${itemNames[item]} purchased! 🎁`);
}

// DRESS UP
function wear(emoji, item) {
  if (item && !pet.inventory.includes(item)) {
    showToast("Buy this accessory from the shop first! 🛍️");
    return;
  }

  pet.accessory = emoji;
  updateUI();
  saveGame();
  showToast(emoji ? "New outfit! Looking adorable! 💖" : "Accessory removed!");
}

// ROOMS
function changeRoom(room) {
  const unlocked = ["pink", "garden", "sky", "night"];

  if (!unlocked.includes(room)) return;

  pet.room = room;
  updateUI();
  saveGame();
  showToast("Room makeover complete! 🏡");
}

// ACHIEVEMENTS
function unlock(id) {
  if (pet.achievements.includes(id)) return;

  pet.achievements.push(id);
}

function checkAchievements() {
  if (!pet.adopted) return;

  unlock("achAdopt");

  if (pet.care >= 10) unlock("achCare");
  if (pet.baths >= 1) unlock("achBath");
  if (pet.games >= 5) unlock("achGames");
  if (pet.coins >= 100) unlock("achCoins");
  if (pet.level >= 5) unlock("achLevel");
}

// UI
function updateUI() {
  document.getElementById("coins").textContent = pet.coins;
  document.getElementById("petName").textContent = pet.name;
  document.getElementById("petEmoji").textContent = pets[pet.type];
  document.getElementById("petMessage").textContent = petMessage();
  document.getElementById("mood").textContent = petMood();

  setStat("hungerBar", "hungerText", pet.hunger);
  setStat("happyBar", "happyText", pet.happiness);
  setStat("energyBar", "energyText", pet.energy);
  setStat("cleanBar", "cleanText", pet.cleanliness);

  document.getElementById("level").textContent = pet.level;
  document.getElementById("xp").textContent = pet.xp;
  document.getElementById("gameCount").textContent = pet.games;

  document.getElementById("accessory").textContent = pet.accessory;
  document.getElementById("dressAccessory").textContent = pet.accessory;
  document.getElementById("dressPet").textContent = pets[pet.type];
  document.getElementById("dressName").textContent = pet.name;
  document.getElementById("roomPet").textContent = pets[pet.type];
  document.getElementById("roomPetName").textContent = pet.name;
  document.getElementById("bathPet").textContent = pets[pet.type];

  const room = document.getElementById("roomPreview");
  room.className = "room-preview " + pet.room;

  const petRoom = document.getElementById("petRoom");
  petRoom.className = "pet-room";
  if (pet.room !== "pink") petRoom.classList.add(pet.room);

  updateInventory();
  updateAchievementsUI();
}

function setStat(barId, textId, value) {
  document.getElementById(barId).style.width = value + "%";
  document.getElementById(textId).textContent = value + "%";
}

function petMood() {
  if (pet.hunger < 25) return "Hungry 🥺";
  if (pet.energy < 20) return "Sleepy 😴";
  if (pet.cleanliness < 25) return "Needs a bath 🫧";
  if (pet.happiness < 30) return "A little sad 💕";
  return "Feeling Happy 💖";
}

function petMessage() {
  if (pet.hunger < 25) return "Could I have a snack? 🍓";
  if (pet.energy < 20) return "I need a little nap... 😴";
  if (pet.cleanliness < 25) return "Bubble bath time! 🛁";
  if (pet.happiness < 30) return "Can we play together? 🥺";
  return "You're my favorite human! 💗";
}

function updateInventory() {
  const container = document.getElementById("inventoryDisplay");
  container.innerHTML = "";

  if (pet.inventory.length === 0) {
    container.textContent = "Your inventory is empty. Visit the Pet Shop! 🛍️";
    return;
  }

  pet.inventory.forEach(item => {
    const badge = document.createElement("div");
    badge.className = "inventory-item";
    badge.textContent = itemNames[item] || item;
    container.appendChild(badge);
  });
}

function updateAchievementsUI() {
  pet.achievements.forEach(id => {
    const element = document.getElementById(id);
    if (element) element.classList.add("unlocked");
  });
}

// SAVE / LOAD
function saveGame() {
  try {
    localStorage.setItem("pawpal_save", JSON.stringify(pet));
  } catch (error) {
    console.warn("Unable to save game.", error);
  }
}

// TOAST
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2500);
}

// THEME
function toggleTheme() {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "pawpal_theme",
    document.body.classList.contains("dark") ? "dark" : "light"
  );
}

if (localStorage.getItem("pawpal_theme") === "dark") {
  document.body.classList.add("dark");
}

// PASSIVE STAT DECAY
decayTimer = setInterval(() => {
  if (!pet.adopted) return;

  pet.hunger = Math.max(0, pet.hunger - 2);
  pet.happiness = Math.max(0, pet.happiness - 1);
  pet.cleanliness = Math.max(0, pet.cleanliness - 1);

  updateUI();
  saveGame();
}, 60000);

// INITIALIZATION
if (pet.adopted) {
  document.getElementById("adoption").classList.remove("active");
  document.getElementById("home").classList.add("active");
} else {
  document.getElementById("adoption").classList.add("active");
}

updateUI();
checkAchievements();

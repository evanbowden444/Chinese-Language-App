const STORAGE_KEY = "chinese-flashcards-deck";

const SAMPLE_DECK = [
  { hanzi: "你好", pinyin: "nǐ hǎo", english: "hello" },
  { hanzi: "谢谢", pinyin: "xiè xie", english: "thank you" },
  { hanzi: "再见", pinyin: "zài jiàn", english: "goodbye" },
  { hanzi: "老师", pinyin: "lǎo shī", english: "teacher" },
  { hanzi: "学生", pinyin: "xué sheng", english: "student" }
];

const state = {
  cards: [],
  currentIndex: 0,
  showingBack: false
};

const elements = {
  csvFileInput: document.getElementById("csvFileInput"),
  csvTextInput: document.getElementById("csvTextInput"),
  importTextBtn: document.getElementById("importTextBtn"),
  loadSampleBtn: document.getElementById("loadSampleBtn"),
  clearDeckBtn: document.getElementById("clearDeckBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  exportBtn: document.getElementById("exportBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  flipBtn: document.getElementById("flipBtn"),
  flashcard: document.getElementById("flashcard"),
  flashcardLabel: document.getElementById("flashcardLabel"),
  flashcardSubLabel: document.getElementById("flashcardSubLabel"),
  deckSummary: document.getElementById("deckSummary"),
  cardCount: document.getElementById("cardCount"),
  cardPosition: document.getElementById("cardPosition"),
  cardSide: document.getElementById("cardSide"),
  statusMessage: document.getElementById("statusMessage"),
  deckTableBody: document.getElementById("deckTableBody"),
  autoFlipBackCheckbox: document.getElementById("autoFlipBackCheckbox")
};

function normalizeHeader(header) {
  return header.trim().toLowerCase().replace(/\s+/g, "");
}

function parseCsv(text) {
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }

      currentRow.push(currentField);
      if (currentRow.some((field) => field.trim() !== "")) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  currentRow.push(currentField);
  if (currentRow.some((field) => field.trim() !== "")) {
    rows.push(currentRow);
  }

  return rows;
}

function getColumnIndex(headers, aliases) {
  return headers.findIndex((header) => aliases.includes(header));
}

function mapRowsToCards(rows) {
  if (rows.length < 2) {
    throw new Error("Your CSV needs a header row and at least one vocab row.");
  }

  const headers = rows[0].map(normalizeHeader);
  const hanziIndex = getColumnIndex(headers, ["hanzi", "chinese", "simplified", "traditional"]);
  const pinyinIndex = getColumnIndex(headers, ["pinyin", "pronunciation", "romanization"]);
  const englishIndex = getColumnIndex(headers, ["english", "translation", "meaning", "definition"]);

  if (hanziIndex === -1 || pinyinIndex === -1 || englishIndex === -1) {
    throw new Error(
      "CSV headers must include columns for hanzi, pinyin, and english (or supported aliases)."
    );
  }

  const cards = rows
    .slice(1)
    .map((row) => ({
      hanzi: (row[hanziIndex] || "").trim(),
      pinyin: (row[pinyinIndex] || "").trim(),
      english: (row[englishIndex] || "").trim()
    }))
    .filter((card) => card.hanzi && card.pinyin && card.english);

  if (!cards.length) {
    throw new Error("No valid cards were found. Make sure each row has hanzi, pinyin, and english.");
  }

  return cards;
}

function saveDeck() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cards));
}

function loadSavedDeck() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      state.cards = parsed;
    }
  } catch (error) {
    console.error("Unable to restore saved deck.", error);
  }
}

function setStatus(message, type = "") {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = "status-message";

  if (type) {
    elements.statusMessage.classList.add(type);
  }
}

function renderDeckTable() {
  if (!state.cards.length) {
    elements.deckTableBody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-row">No cards imported yet.</td>
      </tr>
    `;
    return;
  }

  elements.deckTableBody.innerHTML = state.cards
    .map(
      (card) => `
        <tr>
          <td>${escapeHtml(card.hanzi)}</td>
          <td>${escapeHtml(card.pinyin)}</td>
          <td>${escapeHtml(card.english)}</td>
        </tr>
      `
    )
    .join("");
}

function renderFlashcard() {
  const card = state.cards[state.currentIndex];
  const hasCards = Boolean(card);

  elements.flashcard.classList.toggle("is-empty", !hasCards);
  elements.flashcard.classList.toggle("is-back", hasCards && state.showingBack);

  if (!hasCards) {
    elements.flashcardLabel.textContent = "Import a deck to start studying.";
    elements.flashcardSubLabel.textContent = "Your Hanzi will appear on the front of the card.";
    return;
  }

  if (state.showingBack) {
    elements.flashcardLabel.textContent = card.pinyin;
    elements.flashcardSubLabel.textContent = card.english;
  } else {
    elements.flashcardLabel.textContent = card.hanzi;
    elements.flashcardSubLabel.textContent = "Tap to reveal pinyin and English.";
  }
}

function renderMeta() {
  const total = state.cards.length;
  const position = total ? `${state.currentIndex + 1} / ${total}` : "0 / 0";
  const side = state.showingBack ? "Back" : "Front";

  elements.cardCount.textContent = String(total);
  elements.cardPosition.textContent = position;
  elements.cardSide.textContent = total ? side : "Front";
  elements.deckSummary.textContent = total
    ? `Studying ${total} vocabulary card${total === 1 ? "" : "s"}.`
    : "No cards loaded yet.";

  const disableStudyControls = total === 0;
  elements.prevBtn.disabled = disableStudyControls;
  elements.nextBtn.disabled = disableStudyControls;
  elements.flipBtn.disabled = disableStudyControls;
  elements.shuffleBtn.disabled = disableStudyControls;
  elements.exportBtn.disabled = disableStudyControls;
}

function render() {
  renderFlashcard();
  renderMeta();
  renderDeckTable();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function importCards(cards, successMessage) {
  state.cards = cards;
  state.currentIndex = 0;
  state.showingBack = false;
  saveDeck();
  render();
  setStatus(successMessage, "success");
}

function importFromText(text) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Paste some CSV text before importing.");
  }

  const cards = mapRowsToCards(parseCsv(trimmed));
  importCards(cards, `Imported ${cards.length} card${cards.length === 1 ? "" : "s"}.`);
}

function moveCard(direction) {
  if (!state.cards.length) {
    return;
  }

  state.currentIndex = (state.currentIndex + direction + state.cards.length) % state.cards.length;

  if (elements.autoFlipBackCheckbox.checked) {
    state.showingBack = false;
  }

  render();
}

function shuffleCards() {
  if (state.cards.length < 2) {
    return;
  }

  const shuffled = [...state.cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  state.cards = shuffled;
  state.currentIndex = 0;
  state.showingBack = false;
  saveDeck();
  render();
  setStatus("Deck shuffled.", "success");
}

function exportDeck() {
  if (!state.cards.length) {
    return;
  }

  const lines = ["hanzi,pinyin,english"];
  state.cards.forEach((card) => {
    lines.push([card.hanzi, card.pinyin, card.english].map(escapeCsvField).join(","));
  });

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "chinese-flashcards.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvField(value) {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

elements.importTextBtn.addEventListener("click", () => {
  try {
    importFromText(elements.csvTextInput.value);
  } catch (error) {
    setStatus(error.message, "error");
  }
});

elements.csvFileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;

  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    importFromText(text);
    elements.csvTextInput.value = text;
  } catch (error) {
    setStatus(error.message || "Unable to import CSV file.", "error");
  }
});

elements.loadSampleBtn.addEventListener("click", () => {
  importCards(SAMPLE_DECK, "Sample deck loaded.");
  elements.csvTextInput.value = `hanzi,pinyin,english
你好,nǐ hǎo,hello
谢谢,xiè xie,thank you
再见,zài jiàn,goodbye
老师,lǎo shī,teacher
学生,xué sheng,student`;
});

elements.clearDeckBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  state.cards = [];
  state.currentIndex = 0;
  state.showingBack = false;
  render();
  setStatus("Saved deck cleared.", "success");
});

elements.shuffleBtn.addEventListener("click", shuffleCards);
elements.exportBtn.addEventListener("click", exportDeck);
elements.prevBtn.addEventListener("click", () => moveCard(-1));
elements.nextBtn.addEventListener("click", () => moveCard(1));
elements.flipBtn.addEventListener("click", () => {
  if (!state.cards.length) {
    return;
  }

  state.showingBack = !state.showingBack;
  render();
});
elements.flashcard.addEventListener("click", () => {
  if (!state.cards.length) {
    return;
  }

  state.showingBack = !state.showingBack;
  render();
});

loadSavedDeck();
render();

if (state.cards.length) {
  setStatus("Restored your saved deck from this browser.", "success");
}

"use strict";

const browser = globalThis.browser ?? globalThis.chrome;
let selectedLanguage = "auto";
let manualCatalog = null;

const fallbackMessages = {
  popupTitle: "Opções do CheckLingo", replaceWord: "Trocar palavra", replaceWordHelp: "Nos textos de lições e partidas. A fala não muda.",
  interfaceLanguage: "Idioma da interface", languageAuto: "Automático", languageSaved: "Idioma salvo.",
  originalWord: "Palavra original", replacementWord: "Trocar por", saveReplacement: "Salvar troca",
  highlightLastMove: "Destacar última jogada", highlightLastMoveHelp: "Marcar as casas de origem e destino.",
  yourMove: "Sua jogada", opponentMove: "Jogada do adversário", playerPalette: "Cores prontas para sua jogada", opponentPalette: "Cores prontas para a jogada do adversário",
  boardCoordinates: "Coordenadas no tabuleiro", boardCoordinatesHelp: "Mostrar letras e números nas casas da borda.", piecesAtBottom: "Peças na parte de baixo", darkPieces: "Escuras", lightPieces: "Claras",
  planningArrows: "Setas de planejamento", planningArrowsHelp: "Arraste com o botão direito para desenhar. Clique com o direito para limpar.",
  moveHistory: "Histórico das jogadas", moveHistoryHelp: "Mostrar lances confirmados ao lado do tabuleiro, com a peça e as posições.",
  lockBoard: "Fixar o tabuleiro", lockBoardHelp: "Evitar o arrasto nativo do canvas e da imagem de fundo.", createdBy: "Criado por",
  shortcut: "Atalho: $1", shortcutUndefined: "Atalho não definido; configure em about:addons.", shortcutSee: "Atalho: veja em about:addons.",
  colorSaved: "Cor salva.", colorSaveError: "Não foi possível salvar a cor.", waitingChess: "Aguardando uma lição ou partida de xadrez.",
  replacementFeature: "Troca", highlightFeature: "destaque", coordinatesFeature: "coordenadas", arrowsFeature: "setas", historyFeature: "histórico", lockFeature: "fixar",
  enabledFeminine: "ligada", disabledFeminine: "desligada", enabledMasculine: "ligado", disabledMasculine: "desligado", enabledPluralFeminine: "ligadas", disabledPluralFeminine: "desligadas",
  lesson: "Lição", match: "Partida", detected: "detectada", boardDetected: "tabuleiro detectado", waitingBoard: "aguardando tabuleiro", pageSummary: "$1 $2 · $3. $4.",
  pageCheckError: "Não foi possível verificar a página. Recarregue a aba do Duolingo.", invalidWords: "Use uma palavra de 2 a 40 letras em cada campo.", differentWords: "Escolha duas palavras diferentes.",
  replacementSaved: "Troca salva: $1 → $2.", saveError: "Não foi possível salvar. Tente novamente.", optionSaved: "Opção salva.", orientationSaved: "Orientação salva.", orientationSaveError: "Não foi possível salvar a orientação.", readOptionsError: "Não foi possível ler as opções.",
  playerColor: "Sua jogada: $1", opponentColor: "Adversário: $1", yellow: "amarelo", green: "verde", blue: "azul", pink: "rosa", orange: "laranja", purple: "roxo"
};

function t(key, ...substitutions) {
  const entry = manualCatalog?.[key];
  if (entry?.message) {
    return entry.message.replace(/\$([a-z0-9_]+)\$/gi, (token, name) => {
      const content = entry.placeholders?.[name.toLowerCase()]?.content;
      const position = /^\$(\d+)$/.exec(content || "")?.[1];
      return position ? substitutions[Number(position) - 1] ?? "" : token;
    });
  }
  const translated = browser.i18n?.getMessage?.(key, substitutions);
  if (translated) return translated;
  return (fallbackMessages[key] || key).replace(/\$(\d+)/g, (_, number) => substitutions[Number(number) - 1] ?? "");
}

function localizePopup() {
  if (document.documentElement) document.documentElement.lang = selectedLanguage === "auto" ? browser.i18n?.getUILanguage?.() || "pt-BR" : selectedLanguage.replace("_", "-");
  for (const element of document.querySelectorAll("[data-i18n]")) {
    if (element.dataset.i18n) element.textContent = t(element.dataset.i18n);
  }
  const colorNames = { "#ffe36a": "yellow", "#79d84b": "green", "#55c8ff": "blue", "#ff7db8": "pink", "#ff9b49": "orange", "#bd8cff": "purple" };
  for (const swatch of document.querySelectorAll(".swatch")) {
    const prefix = swatch.dataset.setting === "highlightColor" ? "playerColor" : "opponentColor";
    swatch.setAttribute("aria-label", t(prefix, t(colorNames[swatch.dataset.color])));
  }
  document.getElementById("playerPalette")?.setAttribute("aria-label", t("playerPalette"));
  document.getElementById("opponentPalette")?.setAttribute("aria-label", t("opponentPalette"));
}

async function applyLanguage(language) {
  selectedLanguage = ["auto", "pt_BR", "en", "es"].includes(language) ? language : "auto";
  manualCatalog = null;
  if (selectedLanguage !== "auto") {
    try {
      const response = await fetch(browser.runtime.getURL(`_locales/${selectedLanguage}/messages.json`));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      manualCatalog = await response.json();
    } catch {
      selectedLanguage = "auto";
    }
  }
  localizePopup();
}

localizePopup();

const defaults = { language: "auto", replaceEnabled: true, fromWord: "dama", toWord: "rainha", highlightLastMove: true, preventBoardDrag: true, highlightColor: "#ffe36a", opponentHighlightColor: "#ff9b49", coordinatesEnabled: true, coordinateOrientation: "black", arrowsEnabled: true, historyEnabled: true };
const status = document.getElementById("status");
const pageStatus = document.getElementById("pageStatus");
const saveButton = document.getElementById("saveWords");
let currentSettings = { ...defaults };
document.getElementById("version").textContent = `v${browser.runtime.getManifest().version}`;

const validWord = (value) => value.length >= 2 && value.length <= 40 && /^[\p{L}\p{M}]+$/u.test(value);
const validColor = (value) => /^#[0-9a-f]{6}$/i.test(value);
const colorKeys = ["highlightColor", "opponentHighlightColor"];
const colorInputs = Object.fromEntries(colorKeys.map((key) => [key, document.getElementById(key)]));
const swatches = [...document.querySelectorAll(".swatch")];

async function showShortcut() {
  try {
    const commands = await browser.commands.getAll();
    const shortcut = commands.find((command) => command.name === "toggle-highlight")?.shortcut;
    document.getElementById("shortcutLabel").textContent = shortcut
      ? t("shortcut", shortcut) : t("shortcutUndefined");
  } catch {
    document.getElementById("shortcutLabel").textContent = t("shortcutSee");
  }
}

function updateColorUI(key, color) {
  colorInputs[key].value = color;
  for (const swatch of swatches) {
    if (swatch.dataset.setting === key) swatch.setAttribute("aria-pressed", String(swatch.dataset.color === color.toLowerCase()));
  }
}

async function saveColor(key, color) {
  if (!colorKeys.includes(key) || !validColor(color)) return;
  const previous = currentSettings[key];
  updateColorUI(key, color);
  currentSettings[key] = color;
  try {
    await browser.storage.local.set({ [key]: color });
    status.textContent = t("colorSaved");
  } catch {
    currentSettings[key] = previous;
    updateColorUI(key, previous);
    status.textContent = t("colorSaveError");
  }
}

async function showPageStatus() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    const result = await browser.tabs.sendMessage(tab.id, { type: "duolingo-chess-status" });
    if (!result.active) {
      pageStatus.textContent = t("waitingChess");
      return;
    }
    const functions = [
      `${t("replacementFeature")} ${t(currentSettings.replaceEnabled ? "enabledFeminine" : "disabledFeminine")}`,
      `${t("highlightFeature")} ${t(currentSettings.highlightLastMove ? "enabledMasculine" : "disabledMasculine")}`,
      `${t("coordinatesFeature")} ${t(currentSettings.coordinatesEnabled ? "enabledPluralFeminine" : "disabledPluralFeminine")}`,
      `${t("arrowsFeature")} ${t(currentSettings.arrowsEnabled ? "enabledPluralFeminine" : "disabledPluralFeminine")}`,
      `${t("historyFeature")} ${t(currentSettings.historyEnabled ? "enabledMasculine" : "disabledMasculine")}`,
      `${t("lockFeature")} ${t(currentSettings.preventBoardDrag ? "enabledMasculine" : "disabledMasculine")}`
    ];
    pageStatus.textContent = t("pageSummary", t(result.isLesson ? "lesson" : "match"), t("detected"), t(result.boardDetected ? "boardDetected" : "waitingBoard"), functions.join(" · "));
  } catch {
    pageStatus.textContent = t("pageCheckError");
  }
}

saveButton.addEventListener("click", async () => {
  const fromWord = document.getElementById("fromWord").value.trim();
  const toWord = document.getElementById("toWord").value.trim();
  if (!validWord(fromWord) || !validWord(toWord)) {
    status.textContent = t("invalidWords");
    return;
  }
  if (fromWord.toLocaleLowerCase("pt-BR") === toWord.toLocaleLowerCase("pt-BR")) {
    status.textContent = t("differentWords");
    return;
  }
  try {
    await browser.storage.local.set({ fromWord, toWord });
    currentSettings.fromWord = fromWord;
    currentSettings.toWord = toWord;
    status.textContent = t("replacementSaved", fromWord, toWord);
  } catch {
    status.textContent = t("saveError");
  }
});

for (const id of ["fromWord", "toWord"]) {
  document.getElementById(id).addEventListener("keydown", (event) => {
    if (event.key === "Enter") saveButton.click();
  });
}

async function initialize() {
  try {
    const stored = await browser.storage.local.get(null);
    const settings = { ...defaults, ...stored };
    currentSettings = settings;
    if (stored.renameQueen === false && !Object.hasOwn(stored, "replaceEnabled")) settings.replaceEnabled = false;
    const language = document.getElementById("language");
    language.value = ["auto", "pt_BR", "en", "es"].includes(settings.language) ? settings.language : "auto";
    await applyLanguage(language.value);
    language.value = selectedLanguage;
    language.addEventListener("change", async () => {
      const previous = currentSettings.language;
      try {
        await browser.storage.local.set({ language: language.value });
        currentSettings.language = language.value;
        await applyLanguage(language.value);
        language.value = selectedLanguage;
        status.textContent = t("languageSaved");
        showPageStatus();
      } catch {
        language.value = previous;
        status.textContent = t("saveError");
      }
    });
    for (const id of ["fromWord", "toWord"]) document.getElementById(id).value = settings[id];
    for (const id of ["replaceEnabled", "highlightLastMove", "coordinatesEnabled", "arrowsEnabled", "historyEnabled", "preventBoardDrag"]) {
      const input = document.getElementById(id);
      input.checked = settings[id] !== false;
      input.addEventListener("change", async () => {
        try {
          await browser.storage.local.set({ [id]: input.checked });
          currentSettings[id] = input.checked;
          status.textContent = t("optionSaved");
          showPageStatus();
        } catch {
          input.checked = !input.checked;
          status.textContent = t("saveError");
        }
      });
    }
    const orientation = document.getElementById("coordinateOrientation");
    orientation.value = settings.coordinateOrientation === "white" ? "white" : "black";
    orientation.addEventListener("change", async () => {
      const previous = currentSettings.coordinateOrientation;
      try {
        await browser.storage.local.set({ coordinateOrientation: orientation.value });
        currentSettings.coordinateOrientation = orientation.value;
        status.textContent = t("orientationSaved");
      } catch {
        orientation.value = previous;
        status.textContent = t("orientationSaveError");
      }
    });
    for (const key of colorKeys) {
      const input = colorInputs[key];
      updateColorUI(key, validColor(settings[key]) ? settings[key] : defaults[key]);
      input.addEventListener("input", () => saveColor(key, input.value));
      input.addEventListener("change", () => saveColor(key, input.value));
    }
    for (const swatch of swatches) swatch.addEventListener("click", () => saveColor(swatch.dataset.setting, swatch.dataset.color));
  } catch {
    status.textContent = t("readOptionsError");
  }
  showPageStatus();
}

initialize();
showShortcut();
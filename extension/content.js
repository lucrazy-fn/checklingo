"use strict";

const browser = globalThis.browser ?? globalThis.chrome;

(() => {
  if (globalThis.__duolingoChessHelperRefresh) {
    globalThis.__duolingoChessHelperRefresh();
    return;
  }
  const defaults = { language: "auto", theme: "system", pieceNotation: "symbol", replaceEnabled: true, fromWord: "dama", toWord: "rainha", preventBoardDrag: true, highlightLastMove: true, highlightColor: "#ffe36a", opponentHighlightColor: "#ff9b49", coordinatesEnabled: true, coordinateOrientation: "black", arrowsEnabled: true, historyEnabled: true };
  const contentMessages = {
    pt_BR: { moveHistory: "Histórico das jogadas", waitingMoves: "Aguardando jogadas…", movedPiece: "Peça movida", you: "Você", opponent: "Adversário" },
    en: { moveHistory: "Move history", waitingMoves: "Waiting for moves…", movedPiece: "Moved piece", you: "You", opponent: "Opponent" },
    es: { moveHistory: "Historial de jugadas", waitingMoves: "Esperando jugadas…", movedPiece: "Pieza movida", you: "Tú", opponent: "Oponente" }
  };
  let settings = { ...defaults };
  const contentLanguage = () => {
    if (["pt_BR", "en", "es"].includes(settings.language)) return settings.language;
    const locale = browser.i18n?.getUILanguage?.() || "pt-BR";
    return locale.toLowerCase().startsWith("es") ? "es" : locale.toLowerCase().startsWith("en") ? "en" : "pt_BR";
  };
  const t = (key) => contentMessages[contentLanguage()][key] || key;
  let active = false;
  let scanScheduled = false;
  let lastUrl = location.href;
  let chessLessonRoute = false;
  const changedText = new Map();
  const changedAttributes = new Map();
  const changedPseudo = new Map();
  const changedImages = new Map();
  const changedCanvases = new Map();
  let pointerStart = null;
  let selectedSquare = null;
  let selectedCanvas = null;
  let lastPlayerMove = null;
  let queuedMove = null;
  let highlightedMove = null;
  let observedCanvas = null;
  let stableBoardImage = null;
  let candidateBoardImage = null;
  const highlightElements = [];
  const coordinateElements = [];
  let coordinatesCanvas = null;
  let arrowCanvas = null;
  let arrowStart = null;
  let arrowPreview = null;
  let arrowHost = null;
  let arrowSvg = null;
  const arrows = [];
  const moveHistory = [];
  let historyCanvas = null;
  let historyHost = null;
  let historyList = null;
  let historyRenderedCount = -1;
  let historyRenderedOrientation = null;
  let historyRenderedNotation = null;
  let pieceBoard = null;
  let pendingOutcome = null;
  const boardMetrics = new WeakMap();
  const boardCaptureSurfaces = new WeakMap();
  const observedRoots = new WeakSet();
  const styledRoots = new WeakSet();

  const validWord = (value) => typeof value === "string" && value.length >= 2 && value.length <= 40 && /^[\p{L}\p{M}]+$/u.test(value);
  const validColor = (value) => typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value);
  const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wordPattern = () => new RegExp(`(^|[^\\p{L}\\p{N}_])(${escapeRegex(settings.fromWord)})(?=$|[^\\p{L}\\p{N}_])`, "giu");
  const chessWords = /\b(?:xadrez|chess|ajedrez|tabuleiro|board|tablero|pe[çc]a|piece|pieza|captur\w*|capture\w*|mov\w*|move\w*|mover\w*|jogad\w*|play\w*|jugad\w*|rei|king|rey|rainha|queen|reina|dama|torre|rook|bispo|bishop|alfil|cavalo|knight|caballo|pe[aã]o|pawn|pe[oó]n|xeque|check|jaque|roque|castle|enroque|promo[çc]\w*|promotion|promoci[oó]n|diagonal|casas?|squares?|casillas?)\b/iu;
  const nonChessPhrases = /\b(?:primeira dama|primera dama|first lady|dama de honra|dama de honor|maid of honor|dama da corte|lady of the court|dama de companhia|lady in waiting|jogo de damas|juego de damas|checkers)\b/iu;
  const chessLessonPhrase = /\b(?:dama|rainha|queen|reina|rei|king|rey|pe[aã]o|pawn|pe[oó]n|torre|rook|bispo|bishop|alfil|cavalo|knight|caballo)\b[^.!?]{0,90}\b(?:atac\w*|attack\w*|captur\w*|move\w*|mov\w*|mover\w*|xeque|check|jaque|tabuleiro|board|tablero|casas?|squares?|casillas?|diagonal|jogad\w*|play\w*|jugad\w*)\b|\b(?:atac\w*|attack\w*|captur\w*|move\w*|mov\w*|mover\w*|xeque|check|jaque|tabuleiro|board|tablero|casas?|squares?|casillas?|diagonal|jogad\w*|play\w*|jugad\w*)\b[^.!?]{0,90}\b(?:dama|rainha|queen|reina|rei|king|rey|pe[aã]o|pawn|pe[oó]n|torre|rook|bispo|bishop|alfil|cavalo|knight|caballo)\b/iu;
  const boardWords = /(?:chess[\s_-]*board|xadrez|tabuleiro|(?:^|[\s_/-])board(?:$|[\s_/-]))/i;
  const pieceWords = /(?:^|[^a-zà-ÿ])(?:chess[\s_-]*piece|pieza|pe[çc]a|pawn|rook|knight|bishop|queen|king|caballo|alfil|reina|rey|pe[oó]n|cavalo|bispo|rainha|dama|torre|pe[aã]o|rei)(?:$|[^a-zà-ÿ])/i;
  const ignoredSelector = "script, style, noscript, textarea, input, select, option, code, pre, nav, [contenteditable], [role='textbox'], [data-test*='profile' i], [data-testid*='profile' i]";
  const boardSelector = "[data-test*='chess-board' i], [data-testid*='chess-board' i], [aria-label*='chess board' i], [aria-label*='tabuleiro' i], [aria-label*='tablero' i], img[alt*='chess board' i], img[alt*='tabuleiro' i], img[alt*='tablero' i]";
  const textAttributes = ["aria-label", "title", "data-text", "data-content", "data-tooltip"];

  function isChessPath(pathname) {
    return /(?:^|\/)(?:chess|chess-match)(?:\/|$)/i.test(pathname);
  }

  function effectivePathname() {
    if (location.protocol !== "about:") return location.pathname;
    try {
      if (top !== window && /(?:^|\.)duolingo\.com$/i.test(top.location.hostname)) return top.location.pathname;
    } catch { /* iframe de outra origem */ }
    try {
      const referrer = new URL(document.referrer);
      if (/(?:^|\.)duolingo\.com$/i.test(referrer.hostname)) return referrer.pathname;
    } catch { /* sem referência utilizável */ }
    return location.pathname;
  }

  function isChessRoute() {
    return isChessPath(effectivePathname());
  }

  function isLessonRoute() {
    return /(?:^|\/)(?:lesson|practice)(?:\/|$)/i.test(effectivePathname());
  }

  function hasBoardMarker() {
    return Boolean(document.querySelector(boardSelector));
  }

  function hasChessLessonEvidence() {
    if (!isLessonRoute() || !document.body) return false;
    // Nas lições, o tabuleiro é um canvas grande e quadrado. As imagens das
    // peças e o texto do desafio variam entre telas, então não dependemos deles.
    if (findBoardCanvas()) return true;
    if (chessLessonPhrase.test(document.body.textContent)) return true;
    for (const element of document.querySelectorAll("*")) {
      if (element.shadowRoot && chessLessonPhrase.test(element.shadowRoot.textContent)) return true;
    }
    return false;
  }

  function isChessContext() {
    return isChessRoute() || chessLessonRoute || hasBoardMarker();
  }

  function hasChessCue(node) {
    if (isChessRoute() || chessLessonRoute) return true;
    const parent = node.parentElement;
    if (!parent) return false;
    if (chessWords.test(parent.textContent.slice(0, 350))) return true;
    return Boolean(parent.closest(boardSelector));
  }

  function replacementFor(original) {
    return original.replace(wordPattern(), (_, prefix, word) => {
      const replacement = word === word.toUpperCase()
        ? settings.toWord.toUpperCase()
        : word[0] === word[0].toUpperCase()
          ? settings.toWord[0].toUpperCase() + settings.toWord.slice(1).toLowerCase()
          : settings.toWord.toLowerCase();
      return prefix + replacement;
    });
  }

  function shouldSkipPhrase(value) {
    return settings.fromWord.toLowerCase() === "dama" && nonChessPhrases.test(value);
  }

  function updateTextNode(node) {
    if (!node.isConnected || !node.parentElement || node.parentElement.closest(ignoredSelector)) return;
    const prior = changedText.get(node);
    const original = prior && node.data === prior.replaced ? prior.original : node.data;
    if (!original || !wordPattern().test(original) || shouldSkipPhrase(original)) return;
    if (!hasChessCue(node)) return;
    const replaced = replacementFor(original);
    if (replaced !== node.data) {
      changedText.set(node, { original, replaced });
      node.data = replaced;
    }
    updateNearbyPresentation(node.parentElement);
  }

  // O balão animado do Duolingo guarda uma frase oculta e desenha cada letra
  // visível em seu próprio span. Trocar só a frase oculta não muda o balão.
  function updateAnimatedLetterGroups(root) {
    for (const group of root.querySelectorAll("span")) {
      if (group.closest(ignoredSelector) || group.children.length < settings.fromWord.length) continue;
      const letters = [...group.children];
      if (!letters.every((child) => child.tagName === "SPAN" && child.children.length === 0
        && child.childNodes.length === 1 && child.firstChild.nodeType === Node.TEXT_NODE
        && child.textContent.length === 1)) continue;
      const phrase = letters.map((child) => child.textContent).join("");
      if (shouldSkipPhrase(phrase) || !hasChessCue(letters[0].firstChild)) continue;
      for (const match of phrase.matchAll(wordPattern())) {
        const start = match.index + match[1].length;
        const nodes = letters.slice(start, start + match[2].length).map((letter) => letter.firstChild);
        const replacement = replacementFor(match[2]);
        nodes.forEach((node, index) => {
          const replaced = index === 0 ? replacement : "";
          changedText.set(node, { original: node.data, replaced });
          node.data = replaced;
        });
      }
    }
  }

  function updateTextAttributes(element) {
    if (element.closest(ignoredSelector)) return;
    for (const name of textAttributes) {
      const value = element.getAttribute(name);
      const prior = changedAttributes.get(element)?.get(name);
      const original = prior && value === prior.replaced ? prior.original : value;
      if (!original || original.length > 500 || !wordPattern().test(original) || shouldSkipPhrase(original)) continue;
      const replaced = replacementFor(original);
      if (replaced === value) continue;
      if (!changedAttributes.has(element)) changedAttributes.set(element, new Map());
      changedAttributes.get(element).set(name, { original, replaced });
      element.setAttribute(name, replaced);
    }
  }

  function ensurePseudoStyle(element) {
    const root = element.getRootNode();
    if (styledRoots.has(root)) return;
    const style = document.createElement("style");
    style.textContent = "[data-duo-replace-before]::before{content:attr(data-duo-replace-before)!important}[data-duo-replace-after]::after{content:attr(data-duo-replace-after)!important}";
    if (root === document) (document.head || document.documentElement).append(style);
    else root.append(style);
    styledRoots.add(root);
  }

  function updatePseudoContent(element) {
    if (typeof getComputedStyle !== "function") return;
    for (const [pseudo, attribute] of [["::before", "data-duo-replace-before"], ["::after", "data-duo-replace-after"]]) {
      const content = getComputedStyle(element, pseudo).content;
      if (!/^(["']).*\1$/s.test(content)) continue;
      const original = content.slice(1, -1).replace(/\\(["'\\])/g, "$1");
      if (!wordPattern().test(original) || shouldSkipPhrase(original)) continue;
      const replaced = replacementFor(original);
      if (replaced === original) continue;
      ensurePseudoStyle(element);
      if (!changedPseudo.has(element)) changedPseudo.set(element, new Map());
      const previous = changedPseudo.get(element).has(attribute)
        ? changedPseudo.get(element).get(attribute).previous
        : element.getAttribute(attribute);
      changedPseudo.get(element).set(attribute, { previous, replaced });
      element.setAttribute(attribute, replaced);
    }
  }

  function updateNearbyPresentation(element) {
    for (let depth = 0; element && depth < 3; depth++, element = element.parentElement) {
      if (element.closest(ignoredSelector)) return;
      updateTextAttributes(element);
      updatePseudoContent(element);
    }
  }

  function imageDetails(img) {
    return [img.alt, img.getAttribute("aria-label"), img.getAttribute("data-test"),
      img.getAttribute("data-testid"), img.id, img.className,
      img.currentSrc || img.src].filter((value) => typeof value === "string").join(" ");
  }

  function isBoardImage(img) {
    if (!(img instanceof HTMLImageElement)) return false;
    const details = imageDetails(img);
    if (pieceWords.test(details)) return false;
    const width = img.getBoundingClientRect().width;
    const height = img.getBoundingClientRect().height;
    const largeSquare = width >= 160 && height >= 160 && width / height >= 0.72 && width / height <= 1.38;
    if (!largeSquare) return false;
    if (boardWords.test(details)) return true;
    const parent = img.parentElement;
    if (!parent) return false;
    const container = parent.closest(boardSelector + ", [data-test*='board' i], [data-testid*='board' i]");
    return Boolean(container);
  }

  function updateBoardImage(img) {
    if (!isBoardImage(img)) return;
    if (!changedImages.has(img)) {
      changedImages.set(img, { hadAttribute: img.hasAttribute("draggable"), value: img.getAttribute("draggable") });
    }
    if (img.getAttribute("draggable") !== "false") img.setAttribute("draggable", "false");
  }

  function findBoardCanvas() {
    return [...document.querySelectorAll("canvas")]
      .filter((canvas) => canvas.width >= 320 && canvas.height >= 320
        && Math.abs(canvas.width / canvas.height - 1) < 0.12
        && canvas.getBoundingClientRect().width >= 320)
      .sort((a, b) => b.width - a.width)[0] || null;
  }

  function updateBoardCanvas() {
    const canvas = findBoardCanvas();
    if (!canvas) return;
    if (!changedCanvases.has(canvas)) {
      changedCanvases.set(canvas, { hadAttribute: canvas.hasAttribute("draggable"), value: canvas.getAttribute("draggable") });
    }
    if (canvas.getAttribute("draggable") !== "false") canvas.setAttribute("draggable", "false");
  }

  function opaqueSpan(image, horizontal) {
    const length = horizontal ? image.width : image.height;
    const fixed = Math.floor((horizontal ? image.height : image.width) / 2);
    const center = Math.floor(length / 2);
    let start = -1;
    for (let index = 0; index <= length; index++) {
      const offset = horizontal ? (fixed * image.width + index) * 4 : (index * image.width + fixed) * 4;
      const opaque = index < length && image.data[offset + 3] > 200;
      if (opaque && start < 0) start = index;
      if (!opaque && start >= 0) {
        if (start <= center && index > center && index - start > length * 0.68 && index - start < length * 0.93) {
          return { start, end: index };
        }
        start = -1;
      }
    }
    return null;
  }

  function measureBoardPixels(image) {
    if (!image) return null;
    const horizontal = opaqueSpan(image, true);
    const vertical = opaqueSpan(image, false);
    if (!horizontal || !vertical) return null;
    return { x: horizontal.start, y: vertical.start, side: horizontal.end - horizontal.start };
  }

  // Mede a área opaca do tabuleiro no canvas; a margem muda com o tamanho da tela.
  function boardGeometry(canvas) {
    const rect = canvas.getBoundingClientRect();
    let metrics = boardMetrics.get(canvas);
    if (!metrics || metrics.width !== canvas.width || metrics.height !== canvas.height) {
      metrics = measureBoardPixels(captureBoard(canvas)) || { x: canvas.width * 0.09, y: canvas.height * 0.09, side: canvas.width * 0.8 };
      metrics.width = canvas.width;
      metrics.height = canvas.height;
      boardMetrics.set(canvas, metrics);
    }
    return {
      rect,
      left: rect.left + metrics.x * rect.width / canvas.width,
      top: rect.top + metrics.y * rect.height / canvas.height,
      cell: metrics.side * rect.width / canvas.width / 8
    };
  }

  function squareAt(canvas, x, y) {
    const board = boardGeometry(canvas);
    const file = Math.floor((x - board.left) / board.cell);
    const rank = Math.floor((y - board.top) / board.cell);
    return file >= 0 && file < 8 && rank >= 0 && rank < 8 ? { file, rank } : null;
  }

  function sameSquare(a, b) {
    return a && b && a.file === b.file && a.rank === b.rank;
  }

  function captureBoard(canvas) {
    try {
      let surface = boardCaptureSurfaces.get(canvas);
      if (!surface || surface.canvas.width !== canvas.width || surface.canvas.height !== canvas.height) {
        const copy = document.createElement("canvas");
        copy.width = canvas.width;
        copy.height = canvas.height;
        const context = copy.getContext("2d", { willReadFrequently: true });
        if (!context) return null;
        surface = { canvas: copy, context };
        boardCaptureSurfaces.set(canvas, surface);
      }
      surface.context.clearRect(0, 0, canvas.width, canvas.height);
      surface.context.drawImage(canvas, 0, 0);
      return surface.context.getImageData(0, 0, canvas.width, canvas.height);
    } catch { return null; }
  }

  function sampleSquare(image, square) {
    if (!image) return null;
    const board = measureBoardPixels(image) || { x: image.width * 0.09, y: image.height * 0.09, side: image.width * 0.8 };
    const result = [];
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 7; col++) {
        const x = Math.floor(board.x + board.side * (square.file + 0.2 + col * 0.1) / 8);
        const y = Math.floor(board.y + board.side * (square.rank + 0.2 + row * 0.1) / 8);
        const offset = (y * image.width + x) * 4;
        result.push(image.data[offset], image.data[offset + 1], image.data[offset + 2]);
      }
    }
    return result;
  }

  function visualDifference(before, after, square) {
    const a = sampleSquare(before, square);
    const b = sampleSquare(after, square);
    if (!a || !b) return null;
    return a.reduce((sum, value, index) => sum + Math.abs(value - b[index]), 0) / a.length;
  }

  function boardChangeScores(before, after) {
    if (!before || !after || before.width !== after.width || before.height !== after.height) return null;
    const changes = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const square = { file, rank };
        changes.push({ square, score: visualDifference(before, after, square) });
      }
    }
    return changes;
  }

  function resetBoardObservation() {
    observedCanvas = null;
    stableBoardImage = null;
    candidateBoardImage = null;
    queuedMove = null;
  }

  function pollBoard() {
    if (document.visibilityState === "hidden") { resetBoardObservation(); return; }
    if (!active || (!settings.highlightLastMove && !settings.historyEnabled)) { resetBoardObservation(); return; }
    if (pointerStart) return;
    const canvas = findBoardCanvas();
    if (!canvas) { resetBoardObservation(); return; }
    const image = captureBoard(canvas);
    if (!image) { resetBoardObservation(); return; }
    if (canvas !== observedCanvas || !stableBoardImage || stableBoardImage.width !== image.width
      || stableBoardImage.height !== image.height) {
      observedCanvas = canvas;
      stableBoardImage = image;
      candidateBoardImage = null;
      return;
    }
    const comparison = boardChangeScores(candidateBoardImage || stableBoardImage, image);
    if (!comparison) { resetBoardObservation(); return; }
    if (comparison.some(({ score }) => score !== null && score > 3)) {
      candidateBoardImage = image;
      return;
    }
    if (!candidateBoardImage) return;
    const changes = boardChangeScores(stableBoardImage, image)?.filter(({ score }) => score !== null && score > 18) || [];
    let highlightedSquares = changes.map(({ square }) => square);
    if (highlightedSquares.length >= 3 && highlightedSquares.length <= 4
      && lastPlayerMove?.canvas === canvas && Date.now() - lastPlayerMove.at < 2000) {
      highlightedSquares = highlightedSquares.filter((square) => !sameSquare(square, lastPlayerMove.from)
        && !sameSquare(square, lastPlayerMove.to));
    }
    if (highlightedSquares.length === 2) {
      const opponentMove = classifyMove(stableBoardImage, image, highlightedSquares[0], highlightedSquares[1]);
      if (opponentMove && !(lastPlayerMove?.canvas === canvas
        && sameMove(opponentMove.from, opponentMove.to, lastPlayerMove.from, lastPlayerMove.to))) {
        recordMove(canvas, "opponent", opponentMove.from, opponentMove.to, stableBoardImage);
      }
      if (settings.highlightLastMove) showDetectedHighlight(canvas, highlightedSquares[0], highlightedSquares[1]);
    } else if (changes.length > 4) {
      clearMoveHighlight();
    }
    stableBoardImage = image;
    candidateBoardImage = null;
  }

  function clearMoveHighlight() {
    for (const element of highlightElements.splice(0)) element.remove();
    highlightedMove = null;
  }

  function sameMove(a, b, from, to) {
    return (sameSquare(a, from) && sameSquare(b, to)) || (sameSquare(a, to) && sameSquare(b, from));
  }

  function showDetectedHighlight(canvas, from, to) {
    if (lastPlayerMove?.canvas === canvas && sameMove(from, to, lastPlayerMove.from, lastPlayerMove.to)) return;
    const remaining = lastPlayerMove?.canvas === canvas ? 1200 - (Date.now() - lastPlayerMove.at) : 0;
    if (remaining > 0) {
      const move = { canvas, from, to, url: location.href };
      queuedMove = move;
      setTimeout(() => {
        if (queuedMove !== move) return;
        queuedMove = null;
        if (active && settings.highlightLastMove && canvas.isConnected && location.href === move.url) {
          showMoveHighlight(canvas, from, to);
        }
      }, remaining);
    } else {
      queuedMove = null;
      showMoveHighlight(canvas, from, to);
    }
  }

  function paintMoveHighlight() {
    const key = highlightedMove?.kind === "player" ? "highlightColor" : "opponentHighlightColor";
    const color = validColor(settings[key]) ? settings[key] : defaults[key];
    const red = parseInt(color.slice(1, 3), 16);
    const green = parseInt(color.slice(3, 5), 16);
    const blue = parseInt(color.slice(5, 7), 16);
    for (const element of highlightElements) {
      element.style.borderColor = color;
      element.style.backgroundColor = `rgba(${red}, ${green}, ${blue}, .18)`;
    }
  }

  function isSquareVisible(canvas, left, top, size) {
    const rect = canvas.getBoundingClientRect();
    // O Duolingo desenha peças e indicadores em camadas irmãs do canvas.
    // Encontra o contêiner do tabuleiro sem subir até a página inteira.
    let boardLayer = canvas;
    for (let parent = canvas.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
      const bounds = parent.getBoundingClientRect();
      if (bounds.width > rect.width * 1.35 || bounds.height > rect.height * 1.35) break;
      boardLayer = parent;
    }
    // Uma casa parcialmente coberta também não deve pintar sobre a faixa de resultado.
    for (const [fx, fy] of [[0.5, 0.5], [0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92]]) {
      const x = left + size * fx;
      const y = top + size * fy;
      if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom
        || x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) return false;
      const surface = document.elementFromPoint(x, y);
      if (surface !== canvas && !boardLayer.contains(surface)) return false;
    }
    return true;
  }

  function positionMoveHighlight() {
    if (!highlightedMove?.canvas.isConnected) { clearMoveHighlight(); return; }
    const board = boardGeometry(highlightedMove.canvas);
    [highlightedMove.from, highlightedMove.to].forEach((square, index) => {
      const element = highlightElements[index];
      if (!element) return;
      element.style.left = `${board.left + square.file * board.cell}px`;
      element.style.top = `${board.top + square.rank * board.cell}px`;
      element.style.width = `${board.cell}px`;
      element.style.height = `${board.cell}px`;
      element.style.display = isSquareVisible(highlightedMove.canvas,
        board.left + square.file * board.cell, board.top + square.rank * board.cell, board.cell) ? "block" : "none";
    });
  }

  function showMoveHighlight(canvas, from, to, kind = "auto") {
    clearMoveHighlight();
    highlightedMove = { canvas, from, to, kind };
    for (let index = 0; index < 2; index++) {
      const element = document.createElement("div");
      element.setAttribute("aria-hidden", "true");
      element.style.cssText = "position:fixed;z-index:2147483646;pointer-events:none;box-sizing:border-box;border:3px solid;border-radius:5px;";
      document.documentElement.append(element);
      highlightElements.push(element);
    }
    paintMoveHighlight();
    positionMoveHighlight();
  }

  function clearCoordinates() {
    for (const element of coordinateElements.splice(0)) element.remove();
    coordinatesCanvas = null;
  }

  function positionCoordinates() {
    if (!coordinatesCanvas?.isConnected) { clearCoordinates(); return; }
    const board = boardGeometry(coordinatesCanvas);
    const blackAtBottom = settings.coordinateOrientation !== "white";
    const files = blackAtBottom ? "hgfedcba" : "abcdefgh";
    const boardBottom = board.top + 8 * board.cell;
    const filesOutside = boardBottom + 18 <= innerHeight;
    for (let index = 0; index < 8; index++) {
      const file = coordinateElements[index];
      const rank = coordinateElements[index + 8];
      const bottomLeft = board.left + index * board.cell;
      const bottomTop = board.top + 7 * board.cell;
      file.textContent = files[index];
      file.style.left = `${bottomLeft + board.cell / 2 - 8}px`;
      file.style.top = `${filesOutside ? boardBottom + 1 : boardBottom - 17}px`;
      file.style.display = isSquareVisible(coordinatesCanvas, bottomLeft, bottomTop, board.cell) ? "block" : "none";
      const sideTop = board.top + index * board.cell;
      rank.textContent = String(blackAtBottom ? index + 1 : 8 - index);
      rank.style.left = `${board.left - 18}px`;
      rank.style.top = `${sideTop + board.cell / 2 - 8}px`;
      rank.style.display = isSquareVisible(coordinatesCanvas, board.left, sideTop, board.cell) ? "block" : "none";
    }
  }

  function syncCoordinates() {
    if (!active || !settings.coordinatesEnabled) { clearCoordinates(); return; }
    const canvas = findBoardCanvas();
    if (!canvas) { clearCoordinates(); return; }
    if (coordinatesCanvas !== canvas || coordinateElements.length !== 16) {
      clearCoordinates();
      coordinatesCanvas = canvas;
      for (let index = 0; index < 16; index++) {
        const element = document.createElement("span");
        element.setAttribute("aria-hidden", "true");
        element.style.cssText = "position:fixed;z-index:2147483646;pointer-events:none;box-sizing:border-box;min-width:16px;height:16px;padding:2px 3px;border-radius:3px;background:rgba(13,31,38,.72);color:#fff;font:700 12px/12px system-ui,sans-serif;text-align:center;text-shadow:0 1px 1px #000;";
        document.documentElement.append(element);
        coordinateElements.push(element);
      }
    }
    positionCoordinates();
  }

  function pieceScore(image, square) {
    if (!image) return 0;
    const board = measureBoardPixels(image) || { x: image.width * .09, y: image.height * .09, side: image.width * .8 };
    const cell = board.side / 8;
    const x0 = board.x + square.file * cell;
    const y0 = board.y + square.rank * cell;
    const pixel = (fx, fy) => {
      const x = Math.min(image.width - 1, Math.floor(x0 + fx * cell));
      const y = Math.min(image.height - 1, Math.floor(y0 + fy * cell));
      return (y * image.width + x) * 4;
    };
    const corner = pixel(.08, .08);
    let total = 0;
    for (let row = 0; row < 5; row++) for (let col = 0; col < 5; col++) {
      const offset = pixel(.22 + col * .14, .22 + row * .14);
      for (let channel = 0; channel < 4; channel++) total += Math.abs(image.data[offset + channel] - image.data[corner + channel]);
    }
    return total / 100;
  }

  function classifyMove(before, after, first, second) {
    const firstDrop = pieceScore(before, first) - pieceScore(after, first);
    const secondDrop = pieceScore(before, second) - pieceScore(after, second);
    if (firstDrop > 4 && firstDrop > secondDrop + 4) return { from: first, to: second };
    if (secondDrop > 4 && secondDrop > firstDrop + 4) return { from: second, to: first };
    return null;
  }

  function squareIndex(square) { return square.rank * 8 + square.file; }

  function initializePieceBoard(image) {
    if (pieceBoard || !image) return;
    const occupied = Array.from({ length: 64 }, (_, index) => pieceScore(image, { file: index % 8, rank: Math.floor(index / 8) }) > 7);
    const outerCount = [...occupied.slice(0, 16), ...occupied.slice(48)].filter(Boolean).length;
    const middleCount = occupied.slice(16, 48).filter(Boolean).length;
    if (outerCount < 28 || middleCount > 4) return;
    const blackAtBottom = settings.coordinateOrientation !== "white";
    const topBack = blackAtBottom
      ? ["rook", "knight", "bishop", "king", "queen", "bishop", "knight", "rook"]
      : ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
    const bottomBack = [...topBack];
    pieceBoard = Array(64).fill(null);
    topBack.forEach((piece, file) => { pieceBoard[file] = piece; pieceBoard[8 + file] = "pawn"; });
    bottomBack.forEach((piece, file) => { pieceBoard[56 + file] = piece; pieceBoard[48 + file] = "pawn"; });
  }

  function inferPiece(from, to, before) {
    initializePieceBoard(before);
    const known = pieceBoard?.[squareIndex(from)];
    if (known) return known;
    const dx = Math.abs(to.file - from.file);
    const dy = Math.abs(to.rank - from.rank);
    if ((dx === 1 && dy === 2) || (dx === 2 && dy === 1)) return "knight";
    if (Math.max(dx, dy) === 1 || (dy === 0 && dx === 2)) return "king";
    if ((from.rank === 1 || from.rank === 6) && dx <= 1 && dy <= 2) return "pawn";
    if (dx === dy) return "bishop";
    if (dx === 0 || dy === 0) return "rook";
    return "pawn";
  }

  function updatePieceBoard(piece, from, to) {
    if (!pieceBoard) return;
    pieceBoard[squareIndex(to)] = piece;
    pieceBoard[squareIndex(from)] = null;
  }

  function pieceMark(piece) {
    const symbols = { pawn: "♟", knight: "♞", bishop: "♝", rook: "♜", queen: "♛", king: "♚" };
    const letters = {
      pt_BR: { pawn: "P", knight: "C", bishop: "B", rook: "T", queen: "D", king: "R" },
      en: { pawn: "P", knight: "N", bishop: "B", rook: "R", queen: "Q", king: "K" },
      es: { pawn: "P", knight: "C", bishop: "A", rook: "T", queen: "D", king: "R" }
    };
    return settings.pieceNotation === "letter" ? letters[contentLanguage()][piece] : symbols[piece];
  }

  function squareName(square) {
    const blackAtBottom = settings.coordinateOrientation !== "white";
    const file = (blackAtBottom ? "hgfedcba" : "abcdefgh")[square.file];
    return `${file}${blackAtBottom ? square.rank + 1 : 8 - square.rank}`;
  }

  function clearHistory() {
    moveHistory.length = 0;
    historyCanvas = null;
    historyHost?.remove();
    historyHost = null;
    historyList = null;
    historyRenderedCount = -1;
    pieceBoard = null;
  }

  function ensureHistoryPanel() {
    if (historyHost?.isConnected) return;
    historyHost = document.createElement("div");
    historyHost.setAttribute("aria-label", t("moveHistory"));
    historyHost.style.cssText = "position:fixed;z-index:2147483645;pointer-events:auto;width:196px;";
    const shadow = historyHost.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    const dark = settings.theme === "dark" || (settings.theme === "system" && matchMedia("(prefers-color-scheme:dark)").matches);
    style.textContent = `:host{font:12px system-ui,sans-serif}aside{box-sizing:border-box;max-height:inherit;overflow:auto;border:1px solid ${dark ? "#4e6770" : "#cfdbdd"};border-radius:12px;background:${dark ? "#1b2c34" : "#f8fbf6"};color:${dark ? "#edf7f8" : "#173039"};box-shadow:0 8px 24px #0004}h2{position:sticky;top:0;margin:0;padding:10px 12px;background:${dark ? "#243a43" : "#e8f1e4"};font-size:13px}ol{margin:0;padding:6px 8px;list-style:none}li{display:flex;align-items:center;gap:7px;padding:5px 3px;border-bottom:1px solid ${dark ? "#ffffff1c" : "#1730391c"}}li:last-child{border:0}.piece{display:grid;place-items:center;flex:none;width:30px;height:30px;border-radius:8px;background:#10252c;color:#f2f8f5;font-size:21px;font-weight:900}span{line-height:1.3}small{display:block;color:${dark ? "#a7c3ca" : "#617a81"};font-size:10px}.empty{padding:10px;color:${dark ? "#a7c3ca" : "#617a81"}}`;
    const panel = document.createElement("aside");
    const title = document.createElement("h2");
    title.textContent = t("moveHistory");
    historyList = document.createElement("ol");
    historyRenderedCount = -1;
    panel.append(title, historyList);
    shadow.append(style, panel);
    document.documentElement.append(historyHost);
  }

  function renderHistory() {
    if (!active || !settings.historyEnabled) { historyHost?.remove(); historyHost = null; historyList = null; return; }
    const canvas = findBoardCanvas();
    if (!canvas) { historyHost?.remove(); historyHost = null; historyList = null; return; }
    if (historyCanvas && historyCanvas !== canvas) clearHistory();
    historyCanvas = canvas;
    const board = boardGeometry(canvas);
    const right = board.left + 8 * board.cell + 18;
    const left = board.left - 214;
    if (right + 196 <= innerWidth - 8) {
      ensureHistoryPanel();
      historyHost.style.left = `${right}px`;
    } else if (left >= 8) {
      ensureHistoryPanel();
      historyHost.style.left = `${left}px`;
    } else {
      historyHost?.remove(); historyHost = null; historyList = null;
      return;
    }
    const visibleTop = Math.max(8, board.top);
    const visibleBottom = Math.min(innerHeight - 8, board.top + 8 * board.cell);
    if (visibleBottom <= visibleTop) {
      historyHost.remove(); historyHost = null; historyList = null;
      return;
    }
    historyHost.style.top = `${(visibleTop + visibleBottom) / 2}px`;
    historyHost.style.transform = "translateY(-50%)";
    historyHost.style.maxHeight = `${Math.min(420, visibleBottom - visibleTop)}px`;
    if (historyRenderedCount === moveHistory.length && historyRenderedOrientation === settings.coordinateOrientation && historyRenderedNotation === settings.pieceNotation) return;
    historyRenderedCount = moveHistory.length;
    historyRenderedOrientation = settings.coordinateOrientation;
    historyRenderedNotation = settings.pieceNotation;
    historyList.replaceChildren();
    if (!moveHistory.length) {
      const empty = document.createElement("li");
      empty.className = "empty";
      empty.textContent = t("waitingMoves");
      historyList.append(empty);
      return;
    }
    for (let index = 0; index < moveHistory.length; index++) {
      const move = moveHistory[index];
      const row = document.createElement("li");
      const icon = document.createElement("span");
      icon.className = "piece";
      icon.textContent = pieceMark(move.piece);
      icon.setAttribute("aria-label", t("movedPiece"));
      row.append(icon);
      const text = document.createElement("span");
      const side = document.createElement("small");
      side.textContent = `${index + 1}. ${t(move.side === "player" ? "you" : "opponent")}`;
      text.append(side, document.createTextNode(`${squareName(move.from)} → ${squareName(move.to)}${move.suffix || ""}`));
      row.append(text);
      historyList.append(row);
    }
    historyList.parentElement.scrollTop = historyList.parentElement.scrollHeight;
  }

  function recordMove(canvas, side, from, to, before, at = Date.now()) {
    if (!active || !settings.historyEnabled || !canvas.isConnected) return;
    if (historyCanvas && historyCanvas !== canvas) clearHistory();
    historyCanvas = canvas;
    const piece = inferPiece(from, to, before);
    updatePieceBoard(piece, from, to);
    const suffix = pendingOutcome && at - pendingOutcome.at < 2500 ? pendingOutcome.suffix : "";
    pendingOutcome = null;
    moveHistory.push({ side, from, to, piece, suffix, at });
    moveHistory.sort((a, b) => a.at - b.at);
    if (moveHistory.length > 100) moveHistory.shift();
    renderHistory();
  }

  function detectOutcomeText(value) {
    if (!value || value.length > 180 || (!moveHistory.length && !lastPlayerMove)) return;
    const normalized = value.toLocaleLowerCase().replace(/\s+/g, " ");
    const suffix = /xeque[ -]?mate|checkmate|jaque mate/.test(normalized) ? "#"
      : /(?:^|\W)(?:xeque|check|jaque)(?:\W|$)/.test(normalized) ? "+" : "";
    if (!suffix) return;
    const latest = moveHistory.at(-1);
    if (latest && Date.now() - latest.at < 5000) {
      latest.suffix = suffix;
      historyRenderedCount = -1;
      renderHistory();
    } else {
      pendingOutcome = { suffix, at: Date.now() };
    }
  }

  function clearArrows() {
    arrows.length = 0;
    arrowStart = null;
    arrowPreview = null;
    arrowCanvas = null;
    arrowHost?.remove();
    arrowHost = null;
    arrowSvg = null;
  }

  function ensureArrowLayer() {
    if (arrowHost?.isConnected) return;
    arrowHost = document.createElement("div");
    arrowHost.setAttribute("aria-hidden", "true");
    arrowHost.style.cssText = "position:fixed;inset:0;z-index:2147483645;pointer-events:none;overflow:hidden;";
    const shadow = arrowHost.attachShadow({ mode: "closed" });
    arrowSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    arrowSvg.setAttribute("width", "100%");
    arrowSvg.setAttribute("height", "100%");
    arrowSvg.style.cssText = "display:block;width:100%;height:100%;overflow:hidden;pointer-events:none;";
    shadow.append(arrowSvg);
    document.documentElement.append(arrowHost);
  }

  function arrowSquareVisible(canvas, board, square) {
    return isSquareVisible(canvas, board.left + square.file * board.cell,
      board.top + square.rank * board.cell, board.cell);
  }

  function drawArrow(board, from, to, preview) {
    if (sameSquare(from, to)) return;
    const startX = board.left + (from.file + .5) * board.cell;
    const startY = board.top + (from.rank + .5) * board.cell;
    const endX = board.left + (to.file + .5) * board.cell;
    const endY = board.top + (to.rank + .5) * board.cell;
    const distance = Math.hypot(endX - startX, endY - startY);
    const ux = (endX - startX) / distance;
    const uy = (endY - startY) / distance;
    const headLength = Math.min(board.cell * .3, distance * .35);
    const headWidth = board.cell * .18;
    const baseX = endX - ux * headLength;
    const baseY = endY - uy * headLength;
    const color = "#75d22b";
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(startX));
    line.setAttribute("y1", String(startY));
    line.setAttribute("x2", String(baseX));
    line.setAttribute("y2", String(baseY));
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", String(Math.max(5, board.cell * .11)));
    line.setAttribute("stroke-linecap", "round");
    line.setAttribute("opacity", preview ? ".5" : ".72");
    const head = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    head.setAttribute("points", `${endX},${endY} ${baseX - uy * headWidth},${baseY + ux * headWidth} ${baseX + uy * headWidth},${baseY - ux * headWidth}`);
    head.setAttribute("fill", color);
    head.setAttribute("opacity", preview ? ".5" : ".72");
    arrowSvg.append(line, head);
  }

  function renderArrows() {
    if (!active || !settings.arrowsEnabled || !arrowCanvas?.isConnected) { clearArrows(); return; }
    if (!arrows.length && !arrowPreview) { arrowHost?.remove(); arrowHost = null; arrowSvg = null; return; }
    ensureArrowLayer();
    arrowSvg.replaceChildren();
    const board = boardGeometry(arrowCanvas);
    for (const arrow of arrows) {
      if (arrowSquareVisible(arrowCanvas, board, arrow.from) && arrowSquareVisible(arrowCanvas, board, arrow.to)) {
        drawArrow(board, arrow.from, arrow.to, false);
      }
    }
    if (arrowPreview && arrowSquareVisible(arrowCanvas, board, arrowPreview.from)
      && arrowSquareVisible(arrowCanvas, board, arrowPreview.to)) {
      drawArrow(board, arrowPreview.from, arrowPreview.to, true);
    }
  }

  function onArrowPointerDown(event) {
    if (!active || !settings.arrowsEnabled || event.button !== 2 || event.pointerType === "touch") return;
    const canvas = findBoardCanvas();
    if (!canvas) return;
    const square = squareAt(canvas, event.clientX, event.clientY);
    if (!square || !arrowSquareVisible(canvas, boardGeometry(canvas), square)) return;
    if (arrowCanvas && arrowCanvas !== canvas) clearArrows();
    arrowCanvas = canvas;
    arrowStart = { canvas, square, pointerId: event.pointerId };
    arrowPreview = null;
    event.preventDefault();
    event.stopPropagation();
  }

  function onArrowPointerMove(event) {
    if (!arrowStart || event.pointerId !== arrowStart.pointerId) return;
    const end = squareAt(arrowStart.canvas, event.clientX, event.clientY);
    arrowPreview = end && !sameSquare(arrowStart.square, end)
      ? { from: arrowStart.square, to: end } : null;
    renderArrows();
    event.preventDefault();
    event.stopPropagation();
  }

  function onArrowPointerUp(event) {
    if (!arrowStart || event.pointerId !== arrowStart.pointerId) return;
    const { canvas, square: from } = arrowStart;
    const to = squareAt(canvas, event.clientX, event.clientY);
    arrowStart = null;
    arrowPreview = null;
    if (to && sameSquare(from, to)) arrows.length = 0;
    else if (to && arrowSquareVisible(canvas, boardGeometry(canvas), to)) {
      const existing = arrows.findIndex((arrow) => sameSquare(arrow.from, from) && sameSquare(arrow.to, to));
      if (existing >= 0) arrows.splice(existing, 1);
      else arrows.push({ from, to });
    }
    renderArrows();
    event.preventDefault();
    event.stopPropagation();
  }

  function onArrowContextMenu(event) {
    if (!active || !settings.arrowsEnabled) return;
    const canvas = findBoardCanvas();
    if (arrowStart || (canvas && squareAt(canvas, event.clientX, event.clientY))) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function onBoardPointerDown(event) {
    if (!active || (!settings.highlightLastMove && !settings.historyEnabled) || event.button !== 0) return;
    const canvas = findBoardCanvas();
    if (!canvas || (event.target !== canvas && !canvas.contains(event.target)
      && !canvas.parentElement?.contains(event.target))) return;
    if (selectedCanvas !== canvas) selectedSquare = null;
    selectedCanvas = canvas;
    const square = squareAt(canvas, event.clientX, event.clientY);
    if (!square) return;
    pointerStart = { canvas, square, before: captureBoard(canvas) };
  }

  function onBoardPointerUp(event) {
    if (!active || (!settings.highlightLastMove && !settings.historyEnabled) || !pointerStart || event.button !== 0) return;
    const { canvas, square: start, before } = pointerStart;
    pointerStart = null;
    const end = squareAt(canvas, event.clientX, event.clientY);
    if (!end) { selectedSquare = null; return; }
    const from = !sameSquare(start, end) ? start : selectedSquare;
    selectedSquare = sameSquare(start, end) ? end : null;
    if (!from || sameSquare(from, end)) return;
    lastPlayerMove = { canvas, from, to: end, at: Date.now() };
    const moveAt = lastPlayerMove.at;
    queuedMove = null;
    const previousMove = highlightedMove;
    if (settings.highlightLastMove) showMoveHighlight(canvas, from, end, "player");
    setTimeout(() => {
      if (!active || (!settings.highlightLastMove && !settings.historyEnabled) || !canvas.isConnected) return;
      const after = captureBoard(canvas);
      const sourceChange = visualDifference(before, after, from);
      const destinationChange = visualDifference(before, after, end);
      if (sourceChange !== null && destinationChange !== null
        && sourceChange > 8 && destinationChange > 8
        && pieceScore(before, from) - pieceScore(after, from) > 4) {
        recordMove(canvas, "player", from, end, before, moveAt);
      }
      // Um clique sem mudança visual não deve substituir a jogada anterior.
      if (sourceChange !== null && destinationChange !== null
        && sourceChange < 8 && destinationChange < 8
        && highlightedMove?.kind === "player" && sameMove(highlightedMove.from, highlightedMove.to, from, end)) {
        if (lastPlayerMove?.canvas === canvas && sameMove(lastPlayerMove.from, lastPlayerMove.to, from, end)) lastPlayerMove = null;
        if (previousMove?.canvas.isConnected) showMoveHighlight(previousMove.canvas, previousMove.from, previousMove.to, previousMove.kind);
        else clearMoveHighlight();
      }
    }, 650);
  }

  function scan(root) {
    if (settings.replaceEnabled && validWord(settings.fromWord) && validWord(settings.toWord)) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) updateTextNode(node);
      updateAnimatedLetterGroups(root);
      for (const element of root.querySelectorAll("[aria-label], [title], [data-text], [data-content], [data-tooltip]")) {
        updateTextAttributes(element);
      }
    }
    if (settings.preventBoardDrag) {
      updateBoardCanvas();
      for (const img of root.querySelectorAll("img")) updateBoardImage(img);
    }
    for (const element of root.querySelectorAll("*")) {
      if (!element.shadowRoot) continue;
      observeRoot(element.shadowRoot);
      scan(element.shadowRoot);
    }
  }

  function restoreText() {
    for (const [node, previous] of changedText) {
      if (node.isConnected && node.data === previous.replaced) node.data = previous.original;
    }
    changedText.clear();
  }

  function restorePresentation() {
    for (const [element, attributes] of changedAttributes) {
      if (!element.isConnected) continue;
      for (const [name, previous] of attributes) {
        if (element.getAttribute(name) === previous.replaced) element.setAttribute(name, previous.original);
      }
    }
    changedAttributes.clear();
    for (const [element, attributes] of changedPseudo) {
      if (!element.isConnected) continue;
      for (const [name, previous] of attributes) {
        if (element.getAttribute(name) !== previous.replaced) continue;
        if (previous.previous === null) element.removeAttribute(name);
        else element.setAttribute(name, previous.previous);
      }
    }
    changedPseudo.clear();
  }

  function restoreImages() {
    for (const [img, previous] of changedImages) {
      if (!img.isConnected || img.getAttribute("draggable") !== "false") continue;
      if (previous.hadAttribute) img.setAttribute("draggable", previous.value);
      else img.removeAttribute("draggable");
    }
    changedImages.clear();
    for (const [canvas, previous] of changedCanvases) {
      if (!canvas.isConnected || canvas.getAttribute("draggable") !== "false") continue;
      if (previous.hadAttribute) canvas.setAttribute("draggable", previous.value);
      else canvas.removeAttribute("draggable");
    }
    changedCanvases.clear();
  }

  function refresh() {
    scanScheduled = false;
    if (location.href !== lastUrl) {
      const previousPath = new URL(lastUrl).pathname;
      chessLessonRoute = isLessonRoute() && (isChessPath(previousPath) || chessLessonRoute);
      pointerStart = null;
      selectedSquare = null;
      selectedCanvas = null;
      lastPlayerMove = null;
      queuedMove = null;
      clearMoveHighlight();
      clearCoordinates();
      clearArrows();
      clearHistory();
      resetBoardObservation();
    }
    lastUrl = location.href;
    if (!isLessonRoute()) chessLessonRoute = false;
    if (isLessonRoute() && (hasBoardMarker() || hasChessLessonEvidence())) chessLessonRoute = true;
    for (const node of changedText.keys()) if (!node.isConnected) changedText.delete(node);
    for (const element of changedAttributes.keys()) if (!element.isConnected) changedAttributes.delete(element);
    for (const element of changedPseudo.keys()) if (!element.isConnected) changedPseudo.delete(element);
    for (const img of changedImages.keys()) if (!img.isConnected) changedImages.delete(img);
    for (const canvas of changedCanvases.keys()) if (!canvas.isConnected) changedCanvases.delete(canvas);
    active = isChessContext();
    if (!active || !settings.replaceEnabled || !validWord(settings.fromWord) || !validWord(settings.toWord)) {
      restoreText();
      restorePresentation();
    }
    if (!active || !settings.preventBoardDrag) restoreImages();
    if (!active || !settings.highlightLastMove) clearMoveHighlight();
    if (!active || (!settings.highlightLastMove && !settings.historyEnabled)) resetBoardObservation();
    if (!active) clearHistory();
    if (!active || !settings.arrowsEnabled) clearArrows();
    if (active && document.body) scan(document.body);
    if (highlightedMove) { paintMoveHighlight(); positionMoveHighlight(); }
    syncCoordinates();
    if (arrowCanvas && arrowCanvas !== findBoardCanvas()) clearArrows();
    else if (arrowCanvas) renderArrows();
    renderHistory();
  }

  function scheduleRefresh() {
    if (scanScheduled) return;
    scanScheduled = true;
    setTimeout(refresh, 80);
  }

  globalThis.__duolingoChessHelperRefresh = refresh;

  browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "duolingo-chess-status") {
      refresh();
    } else {
      return undefined;
    }
    const response = {
      active,
      isLesson: isLessonRoute(),
      boardDetected: Boolean(findBoardCanvas()),
      replaced: [...changedText].filter(([node, previous]) => node.isConnected && node.data === previous.replaced).length
        + [...changedAttributes].reduce((total, [element, attributes]) => total + (element.isConnected ? attributes.size : 0), 0)
        + [...changedPseudo].reduce((total, [element, attributes]) => total + (element.isConnected ? attributes.size : 0), 0),
      highlighted: Boolean(highlightedMove)
    };
    if (typeof sendResponse === "function") {
      sendResponse(response);
      return false;
    }
    return Promise.resolve(response);
  });

  // Só cancela o dragstart nativo do fundo do tabuleiro ou do canvas.
  // Eventos de mouse, ponteiro e toque das peças continuam com o Duolingo.
  function preventNativeBoardDrag(event) {
    if (!active || !settings.preventBoardDrag) return;
    const target = event.target;
    if (target === findBoardCanvas() || (target instanceof HTMLImageElement && isBoardImage(target))) event.preventDefault();
  }

  document.addEventListener("dragstart", preventNativeBoardDrag, true);
  document.addEventListener("pointerdown", onArrowPointerDown, true);
  document.addEventListener("pointermove", onArrowPointerMove, true);
  document.addEventListener("pointerup", onArrowPointerUp, true);
  document.addEventListener("contextmenu", onArrowContextMenu, true);
  document.addEventListener("pointerdown", onBoardPointerDown, true);
  document.addEventListener("pointerup", onBoardPointerUp, true);
  document.addEventListener("pointercancel", () => { pointerStart = null; arrowStart = null; arrowPreview = null; renderArrows(); }, true);

  browser.storage.local.get(null).then((stored) => {
    settings = { ...defaults, ...stored };
    if (stored.renameQueen === false && !Object.hasOwn(stored, "replaceEnabled")) settings.replaceEnabled = false;
    scheduleRefresh();
  }).catch((error) => console.error("CheckLingo: falha ao ler opções", error));

  browser.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    let relevant = false;
    let replacementChanged = false;
    let languageChanged = false;
    for (const key of Object.keys(defaults)) {
      if (!changes[key]) continue;
      settings[key] = changes[key].newValue;
      relevant = true;
      if (["replaceEnabled", "fromWord", "toWord"].includes(key)) replacementChanged = true;
      if (key === "language") languageChanged = true;
    }
    if (replacementChanged) { restoreText(); restorePresentation(); }
    if (languageChanged || changes.theme) {
      historyHost?.remove();
      historyHost = null;
      historyList = null;
      historyRenderedCount = -1;
    }
    if (changes.pieceNotation) historyRenderedCount = -1;
    if (relevant) scheduleRefresh();
  });

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") detectOutcomeText(record.target.parentElement?.textContent || record.target.data);
      for (const node of record.addedNodes || []) detectOutcomeText(node.textContent);
    }
    scheduleRefresh();
  });
  function observeRoot(root) {
    if (observedRoots.has(root)) return;
    observer.observe(root, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ["src", "alt", "aria-label", "title", "data-text", "data-content", "data-tooltip", "data-test", "data-testid"]
    });
    observedRoots.add(root);
  }
  observeRoot(document.documentElement);
  addEventListener("popstate", scheduleRefresh);
  addEventListener("hashchange", scheduleRefresh);
  document.addEventListener("load", (event) => {
    if (event.target instanceof HTMLImageElement) scheduleRefresh();
  }, true);
  addEventListener("resize", scheduleRefresh);
  addEventListener("scroll", () => { positionMoveHighlight(); positionCoordinates(); renderArrows(); renderHistory(); }, true);
  // Algumas rotas SPA mudam por history.pushState sem disparar popstate.
  setInterval(() => { if (location.href !== lastUrl) scheduleRefresh(); }, 1000);
  setInterval(pollBoard, 350);
  setInterval(() => { if (active && settings.coordinatesEnabled) syncCoordinates(); }, 500);
  setInterval(() => { if (arrowCanvas) renderArrows(); }, 500);
  setInterval(() => { if (active && settings.historyEnabled) renderHistory(); }, 500);
})();


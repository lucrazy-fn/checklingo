"use strict";

const board = document.getElementById("demoBoard");
const pill = document.getElementById("movePill");
const pieces = {
  0: "♜", 1: "♞", 2: "♝", 3: "♛", 4: "♚", 5: "♝", 6: "♞", 7: "♜",
  8: "♟", 9: "♟", 10: "♟", 11: "♟", 12: "♟", 13: "♟", 14: "♟", 15: "♟",
  48: "♙", 49: "♙", 50: "♙", 51: "♙", 52: "♙", 53: "♙", 54: "♙", 55: "♙",
  56: "♖", 57: "♘", 58: "♗", 59: "♕", 60: "♔", 61: "♗", 62: "♘", 63: "♖"
};

const moves = [
  { from: 62, to: 45, label: "g1 → f3", side: "Você" },
  { from: 6, to: 21, label: "g8 → f6", side: "Adversário", opponent: true },
  { from: 52, to: 36, label: "e2 → e4", side: "Você" },
  { from: 11, to: 27, label: "d7 → d5", side: "Adversário", opponent: true }
];
let moveIndex = 0;
let position = { ...pieces };

function renderBoard(move) {
  board.replaceChildren();
  for (let index = 0; index < 64; index++) {
    const square = document.createElement("span");
    square.className = "square";
    if (move && (index === move.from || index === move.to)) square.classList.add(move.opponent ? "opponent-highlight" : "highlight");
    if (position[index]) {
      const piece = document.createElement("span");
      piece.textContent = position[index];
      if (move?.to === index) piece.className = "moving";
      square.append(piece);
    }
    board.append(square);
  }
}

function playMove() {
  const move = moves[moveIndex];
  if (!position[move.from]) position = { ...pieces };
  position[move.to] = position[move.from];
  delete position[move.from];
  renderBoard(move);
  pill.innerHTML = `<b>${move.side}</b><span>${move.label}</span>`;
  moveIndex = (moveIndex + 1) % moves.length;
  if (moveIndex === 0) setTimeout(() => { position = { ...pieces }; renderBoard(); }, 1600);
}

renderBoard();
setTimeout(playMove, 700);
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!reduceMotion) setInterval(playMove, 2600);

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  }
}, { threshold: .12 });

document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  observer.observe(element);
});
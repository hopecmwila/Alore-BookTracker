import confetti from "canvas-confetti";

/** A short, celebratory burst when a book crosses 100%. */
export function celebrate() {
  const colors = ["#B3D4F0", "#E1447E", "#2C4A6B", "#FFFFFF"];
  confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors });
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 60,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 60,
      origin: { x: 1 },
      colors,
    });
  }, 200);
}

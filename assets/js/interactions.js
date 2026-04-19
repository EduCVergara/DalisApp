const INTERACTIVE_SELECTOR = [
  "button",
  "a",
  "[data-pressable]",
  "article",
  "section.rounded-\\[1\\.75rem\\]",
  "section.rounded-\\[1\\.7rem\\]",
  "div.rounded-2xl",
].join(", ");

let styleInstalled = false;

function getPressPoint(event, target) {
  const rect = target.getBoundingClientRect();
  const clientX = typeof event.clientX === "number" ? event.clientX : rect.left + rect.width / 2;
  const clientY = typeof event.clientY === "number" ? event.clientY : rect.top + rect.height / 2;

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

function spawnTouchSpark(event, target) {
  if (!target || target.dataset.noPressFx === "true") return;

  const { x, y } = getPressPoint(event, target);
  const baseAngle = Math.random() * Math.PI * 2;
  const radialOffsets = [
    { radius: 0, angleOffset: 0 },
    { radius: 12, angleOffset: (Math.PI * 2) / 3 },
    { radius: 20, angleOffset: (Math.PI * 4) / 3 },
  ];

  [
    { size: 18, delay: 0, opacity: 1 },
    { size: 14, delay: 40, opacity: 0.82 },
    { size: 10, delay: 75, opacity: 0.7 },
  ].forEach(({ size, delay, opacity }, index) => {
    const offset = radialOffsets[index] || radialOffsets[0];
    const angle = baseAngle + offset.angleOffset + (Math.random() - 0.5) * 0.45;
    const radius = offset.radius + (Math.random() - 0.5) * 1.8;
    const offsetX = Math.cos(angle) * radius;
    const offsetY = Math.sin(angle) * radius;
    const spark = document.createElement("span");
    spark.className = "dalis-touch-spark";
    spark.style.left = `${x + offsetX}px`;
    spark.style.top = `${y + offsetY}px`;
    spark.style.setProperty("--spark-size", `${size}px`);
    spark.style.setProperty("--spark-delay", `${delay}ms`);
    spark.style.setProperty("--spark-opacity", String(opacity));
    target.appendChild(spark);

    spark.addEventListener(
      "animationend",
      () => {
        spark.remove();
      },
      { once: true },
    );
  });
}

function installInteractionStyles() {
  if (styleInstalled || document.getElementById("dalisapp-interactions-style")) return;

  const style = document.createElement("style");
  style.id = "dalisapp-interactions-style";
  style.textContent = `
    .dalis-pressable {
      transition:
        transform 180ms ease,
        box-shadow 180ms ease,
        filter 180ms ease,
        background-color 180ms ease,
        border-color 180ms ease;
      transform-origin: center;
      -webkit-tap-highlight-color: transparent;
    }

    .dalis-pressable {
      position: relative;
      overflow: hidden;
    }

    .dalis-pressable:hover {
      filter: saturate(1.04);
    }

    .dalis-pressable.is-pressed {
      transform: scale(0.985) translateY(1px);
      filter: saturate(1.08);
    }

    .dalis-pressable.is-burst {
      animation: dalis-burst 280ms ease-out;
    }

    .dalis-touch-spark {
      position: absolute;
      width: var(--spark-size, 18px);
      height: var(--spark-size, 18px);
      pointer-events: none;
      z-index: 2;
      border-radius: 999px;
      transform: translate(-50%, -50%) scale(0.3);
      opacity: 0;
      background:
        radial-gradient(circle, rgba(255, 255, 255, 0.98) 0%, rgba(240, 244, 248, 0.95) 34%, rgba(226, 232, 240, 0.55) 56%, rgba(226, 232, 240, 0) 78%);
      box-shadow:
        0 0 10px rgba(255, 255, 255, 0.9),
        0 0 18px rgba(226, 232, 240, 0.65),
        0 0 30px rgba(255, 255, 255, 0.32);
      animation: dalis-touch-spark 360ms ease-out forwards;
      animation-delay: var(--spark-delay, 0ms);
    }

    .dalis-touch-spark::before,
    .dalis-touch-spark::after {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(226, 232, 240, 0.14));
      opacity: 0.94;
    }

    .dalis-touch-spark::before {
      width: 2px;
      height: calc(var(--spark-size, 18px) * 1.45);
    }

    .dalis-touch-spark::after {
      width: calc(var(--spark-size, 18px) * 1.45);
      height: 2px;
    }

    @keyframes dalis-burst {
      0% {
        transform: scale(1);
      }
      40% {
        transform: scale(1.02);
      }
      100% {
        transform: scale(1);
      }
    }

    @keyframes dalis-touch-spark {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.2) rotate(0deg);
      }
      25% {
        opacity: calc(var(--spark-opacity, 1) * 0.96);
        transform: translate(-50%, -50%) scale(0.95) rotate(70deg);
      }
      60% {
        opacity: calc(var(--spark-opacity, 1) * 0.68);
        transform: translate(-50%, -50%) scale(1.22) rotate(150deg);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.72) rotate(220deg);
      }
    }
  `;

  document.head.appendChild(style);
  styleInstalled = true;
}

function markPressables(root = document) {
  root.querySelectorAll(INTERACTIVE_SELECTOR).forEach((element) => {
    if (element.dataset.noPressFx === "true") return;
    element.classList.add("dalis-pressable");
  });
}

function attachPressFeedback(root = document) {
  markPressables(root);

  const startPress = (event) => {
    const target = event.target.closest(".dalis-pressable");
    if (!target) return;
    target.classList.add("is-pressed");
    spawnTouchSpark(event, target);
  };

  const endPress = (event) => {
    const target = event.target.closest(".dalis-pressable");
    if (!target) return;
    target.classList.remove("is-pressed");
    target.classList.remove("is-burst");
    void target.offsetWidth;
    target.classList.add("is-burst");
  };

  const cancelPress = (event) => {
    const target = event.target.closest(".dalis-pressable");
    if (!target) return;
    target.classList.remove("is-pressed");
  };

  root.addEventListener("pointerdown", startPress);
  root.addEventListener("pointerup", endPress);
  root.addEventListener("pointercancel", cancelPress);
  root.addEventListener("pointerleave", cancelPress, true);
}

export function setupInteractiveFeedback(root = document) {
  installInteractionStyles();
  attachPressFeedback(root);
}

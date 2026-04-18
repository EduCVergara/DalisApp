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

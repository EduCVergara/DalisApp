import { getCurrentUser, signIn } from "/assets/js/pocketbase.js";

document.addEventListener("DOMContentLoaded", () => {
  const existingUser = getCurrentUser();
  if (existingUser) {
    window.location.replace("/dashboard.html");
    return;
  }

  const form = document.querySelector("#login-form");
  const status = document.querySelector("#login-status");
  setupPandaBadge();
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = form.email.value;
    const password = form.password.value;

    try {
      const result = await signIn(email, password);
      status.hidden = false;
      status.className =
        "mt-4 rounded-[1.4rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700";
      status.textContent =
        result.mode === "pocketbase"
          ? "Sesion iniciada con PocketBase."
          : "PocketBase no respondio o aun no tiene usuarios creados. Entraste en modo demo.";

      window.setTimeout(() => {
        window.location.replace("/dashboard.html");
      }, 700);
    } catch (error) {
      status.hidden = false;
      status.className =
        "mt-4 rounded-[1.4rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700";
      status.textContent = error.message || "No fue posible iniciar sesion.";
    }
  });
});

function setupPandaBadge() {
  const badge = document.querySelector("[data-panda-badge]");
  if (!badge) return;

  const animationClasses = [
    "is-anim-pop",
    "is-anim-bounce",
    "is-anim-wiggle",
    "is-anim-glow",
  ];

  let animationIndex = 0;

  const playNextAnimation = () => {
    const nextClass = animationClasses[animationIndex % animationClasses.length];
    animationIndex += 1;

    badge.classList.remove(...animationClasses);
    void badge.offsetWidth;
    badge.classList.add(nextClass);
  };

  badge.addEventListener("click", playNextAnimation);
  badge.addEventListener("animationend", () => {
    badge.classList.remove(...animationClasses);
  });
}

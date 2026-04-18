import { getCurrentUser, signIn } from "/assets/js/pocketbase.js";

document.addEventListener("DOMContentLoaded", () => {
  const existingUser = getCurrentUser();
  if (existingUser) {
    window.location.replace("/dashboard.html");
    return;
  }

  const form = document.querySelector("#login-form");
  const status = document.querySelector("#login-status");
  if (!form || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = form.email.value;
    const password = form.password.value;

    try {
      const result = await signIn(email, password);
      status.hidden = false;
      status.className = "status-card success";
      status.textContent =
        result.mode === "pocketbase"
          ? "Sesion iniciada con PocketBase."
          : "PocketBase no respondio o aun no tiene usuarios creados. Entraste en modo demo.";

      window.setTimeout(() => {
        window.location.replace("/dashboard.html");
      }, 700);
    } catch (error) {
      status.hidden = false;
      status.className = "status-card error";
      status.textContent = error.message || "No fue posible iniciar sesion.";
    }
  });
});

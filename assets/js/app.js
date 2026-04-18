import { getCurrentUser, listExtraHours, signOut } from "/assets/js/pocketbase.js";
import { formatDate, formatMinutesLabel, getMonthLabel, summarizeRecords } from "/assets/js/utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  hydrateShell();
  await renderSummaryPage();
});

export function hydrateShell() {
  const user = getCurrentUser();
  if (!user && !window.location.pathname.endsWith("/login.html")) {
    window.location.replace("/login.html");
    return;
  }

  document.querySelectorAll("[data-user-name]").forEach((node) => {
    node.textContent = user?.name || "Dalia";
  });

  const page = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) {
      link.classList.add("is-active");
    }
  });

  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      signOut();
      window.location.replace("/login.html");
    });
  });
}

async function renderSummaryPage() {
  const monthInput = document.querySelector("#month-filter");
  const tableBody = document.querySelector("[data-summary-table-body]");
  if (!monthInput || !tableBody) return;

  monthInput.value = "2026-04";
  const paint = async () => {
    const records = await listExtraHours(monthInput.value);
    const summary = summarizeRecords(records);
    const title = document.querySelector("[data-table-title]");

    document.querySelector("[data-summary-earned]").textContent = formatMinutesLabel(summary.earned);
    document.querySelector("[data-summary-used]").textContent = formatMinutesLabel(summary.used);
    document.querySelector("[data-summary-balance]").textContent = formatMinutesLabel(summary.balance);
    title.textContent = getMonthLabel(monthInput.value);

    if (records.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Todavia no hay registros para este mes.</td></tr>`;
      return;
    }

    tableBody.innerHTML = records
      .map(
        (record) => `
          <tr>
            <td>${formatDate(record.date)}</td>
            <td>${record.start_time}</td>
            <td>${record.end_time}</td>
            <td><strong>${formatMinutesLabel(record.total_minutes)}</strong></td>
            <td><span class="type-pill ${record.type}">${record.type === "earned" ? "Ganadas" : "Usadas"}</span></td>
            <td>${record.notes || "-"}</td>
          </tr>
        `,
      )
      .join("");
  };

  monthInput.addEventListener("change", paint);
  await paint();
}

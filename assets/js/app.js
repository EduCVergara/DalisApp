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

  const page = document.body?.dataset?.page || "";
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) {
      link.classList.add("bg-dali-100", "text-dali-700", "shadow-sm");
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
  const cardsContainer = document.querySelector("[data-summary-cards]");
  if (!monthInput || !tableBody || !cardsContainer) return;

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
      tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-6 text-center font-bold text-slate-500">Todavia no hay registros para este mes.</td></tr>`;
      cardsContainer.innerHTML = `<div class="rounded-[1.35rem] border border-rose-100 bg-white/80 px-5 py-6 text-center font-bold text-slate-500">Todavia no hay registros para este mes.</div>`;
      return;
    }

    tableBody.innerHTML = records
      .map(
        (record) => `
          <tr>
            <td class="border-t border-rose-100 px-4 py-3">${formatDate(record.date)}</td>
            <td class="border-t border-rose-100 px-4 py-3">${record.start_time}</td>
            <td class="border-t border-rose-100 px-4 py-3">${record.end_time}</td>
            <td class="border-t border-rose-100 px-4 py-3"><strong>${formatMinutesLabel(record.total_minutes)}</strong></td>
            <td class="border-t border-rose-100 px-4 py-3"><span class="${record.type === "earned" ? "bg-dali-100 text-dali-700" : "bg-orange-100 text-orange-800"} inline-flex items-center rounded-full px-3 py-1 text-xs font-black">${record.type === "earned" ? "Ganadas" : "Usadas"}</span></td>
            <td class="border-t border-rose-100 px-4 py-3">${record.notes || "-"}</td>
          </tr>
        `,
      )
      .join("");

    cardsContainer.innerHTML = records
      .map(
        (record) => `
          <article class="grid gap-3 rounded-[1.35rem] border border-rose-100 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(252,231,243,0.95))] p-4">
            <div class="flex items-center justify-between gap-3">
              <span class="text-base font-black text-slate-900">${formatDate(record.date)}</span>
              <span class="${record.type === "earned" ? "bg-dali-100 text-dali-700" : "bg-orange-100 text-orange-800"} inline-flex items-center rounded-full px-3 py-1 text-xs font-black">${record.type === "earned" ? "Ganadas" : "Usadas"}</span>
            </div>
            <div class="flex items-center justify-between gap-3 rounded-[1.1rem] bg-dali-100/80 px-4 py-3 font-extrabold text-slate-500">
              <span>${record.start_time}</span>
              <span>a</span>
              <span>${record.end_time}</span>
            </div>
            <div class="flex items-start justify-between gap-3">
              <span class="text-sm leading-6 text-slate-700"><strong class="text-dali-700">Nota:</strong> ${record.notes || "Sin observacion."}</span>
              <strong class="font-title text-[1.7rem] leading-none text-dali-700">${formatMinutesLabel(record.total_minutes)}</strong>
            </div>
          </article>
        `,
      )
      .join("");
  };

  monthInput.addEventListener("change", paint);
  await paint();
}

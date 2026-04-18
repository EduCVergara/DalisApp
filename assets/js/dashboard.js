import { hydrateShell } from "/assets/js/app.js";
import { listExtraHours } from "/assets/js/pocketbase.js";
import {
  buildYearHistory,
  formatDate,
  formatMinutesLabel,
  getAvailableYears,
  getCurrentMonthKey,
  getMonthLabel,
  getYearKey,
  sortByNewest,
  summarizeRecords,
} from "/assets/js/utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  hydrateShell();
  await renderDashboard();
});

async function renderDashboard() {
  const currentMonthKey = getCurrentMonthKey();
  const currentYear = getYearKey(currentMonthKey);
  const [monthRecords, allRecords] = await Promise.all([
    listExtraHours(currentMonthKey),
    listExtraHours(),
  ]);
  const summary = summarizeRecords(monthRecords);
  const recentRecords = sortByNewest(allRecords).slice(0, 4);
  const availableYears = getAvailableYears(allRecords);
  const selectedYear = availableYears.includes(currentYear) ? currentYear : availableYears[0];
  const yearHistory = buildYearHistory(allRecords, selectedYear);
  const annualBalance = yearHistory.at(-1)?.cumulativeBalance || 0;

  document.querySelector("[data-earned-total]").textContent = formatMinutesLabel(summary.earned).replace(" hrs", "");
  document.querySelector("[data-used-total]").textContent = formatMinutesLabel(summary.used).replace(" hrs", "");
  document.querySelector("[data-balance-total]").textContent = formatMinutesLabel(summary.balance).replace(" hrs", "");
  document.querySelector("[data-summary-earned]").textContent = formatMinutesLabel(summary.earned);
  document.querySelector("[data-summary-used]").textContent = formatMinutesLabel(summary.used);
  document.querySelector("[data-summary-balance]").textContent = formatMinutesLabel(summary.balance);
  document.querySelector("[data-current-month-label]").textContent = getMonthLabel(currentMonthKey);
  document.querySelector("[data-year-balance]").textContent = formatMinutesLabel(annualBalance);
  document.querySelector("[data-year-label]").textContent = selectedYear;
  paintAnnualHistory(yearHistory);

  paintChart(summary);
  paintTimeline(recentRecords);
}

function paintChart(summary) {
  const maxValue = Math.max(summary.earned, summary.used, 60);
  const earnedPercent = Math.max(10, Math.round((summary.earned / maxValue) * 100));
  const usedPercent = Math.max(10, Math.round((summary.used / maxValue) * 100));

  document.querySelector("[data-chart-earned]").textContent = `${Math.round(summary.earned / 60)}h`;
  document.querySelector("[data-chart-used]").textContent = `${Math.round(summary.used / 60)}h`;
  document.querySelector("[data-chart-earned-bar]").style.height = `${earnedPercent}%`;
  document.querySelector("[data-chart-used-bar]").style.height = `${usedPercent}%`;
}

function paintTimeline(records) {
  const container = document.querySelector("[data-recent-records]");
  if (!container) return;

  if (records.length === 0) {
    container.innerHTML = `<div class="rounded-[1.35rem] border border-rose-100 bg-white/80 px-5 py-6 text-center font-bold text-slate-500">No hay movimientos recientes todavía.</div>`;
    return;
  }

  container.innerHTML = records
    .map(
      (record) => `
        <article class="grid gap-1.5 rounded-[1.2rem] bg-dali-100/80 px-4 py-3">
          <strong>${record.type === "earned" ? "Horas realizadas" : "Horas usadas"} - ${formatMinutesLabel(record.total_minutes)}</strong>
          <span class="text-sm text-slate-500">${formatDate(record.date)} · ${record.start_time} a ${record.end_time}</span>
          <span class="text-sm text-slate-700">${record.notes || "Sin observación."}</span>
        </article>
      `,
    )
    .join("");
}

function paintAnnualHistory(history) {
  const container = document.querySelector("[data-annual-history]");
  if (!container) return;

  if (history.length === 0) {
    container.innerHTML = `
      <div class="rounded-[1.2rem] border border-rose-100 bg-white/80 px-4 py-4 text-sm font-bold text-slate-500">
        Aun no hay acumulado anual para mostrar.
      </div>
    `;
    return;
  }

  container.innerHTML = history
    .map(
      (item) => `
        <article class="grid gap-3 rounded-[1.25rem] border border-rose-100 bg-white/82 px-4 py-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-black text-slate-900">${item.label}</p>
              <p class="text-xs font-bold text-slate-500">${item.count} movimiento${item.count === 1 ? "" : "s"}</p>
            </div>
            <span class="rounded-full bg-dali-100 px-3 py-1 text-xs font-black text-dali-700">Acumulado ${formatMinutesLabel(item.cumulativeBalance)}</span>
          </div>
          <div class="grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-500">
            <div class="rounded-2xl bg-dali-100/80 px-3 py-2">
              <span class="block text-[0.7rem] uppercase tracking-[0.14em]">Trabajadas</span>
              <strong class="mt-1 block text-sm text-dali-700">${formatMinutesLabel(item.earned)}</strong>
            </div>
            <div class="rounded-2xl bg-orange-50 px-3 py-2">
              <span class="block text-[0.7rem] uppercase tracking-[0.14em]">Usadas</span>
              <strong class="mt-1 block text-sm text-orange-700">${formatMinutesLabel(item.used)}</strong>
            </div>
            <div class="rounded-2xl bg-rose-50 px-3 py-2">
              <span class="block text-[0.7rem] uppercase tracking-[0.14em]">Saldo mes</span>
              <strong class="mt-1 block text-sm text-slate-900">${formatMinutesLabel(item.balance)}</strong>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

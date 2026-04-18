import { hydrateShell } from "/assets/js/app.js";
import { listExtraHours } from "/assets/js/pocketbase.js";
import { formatDate, formatMinutesLabel, getMonthLabel, summarizeRecords } from "/assets/js/utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  hydrateShell();
  await renderDashboard();
});

async function renderDashboard() {
  const records = await listExtraHours("2026-04");
  const summary = summarizeRecords(records);
  const recentRecords = records.slice(0, 4);

  document.querySelector("[data-earned-total]").textContent = formatMinutesLabel(summary.earned).replace(" hrs", "");
  document.querySelector("[data-used-total]").textContent = formatMinutesLabel(summary.used).replace(" hrs", "");
  document.querySelector("[data-balance-total]").textContent = formatMinutesLabel(summary.balance).replace(" hrs", "");
  document.querySelector("[data-summary-earned]").textContent = formatMinutesLabel(summary.earned);
  document.querySelector("[data-summary-used]").textContent = formatMinutesLabel(summary.used);
  document.querySelector("[data-summary-balance]").textContent = formatMinutesLabel(summary.balance);
  document.querySelector("[data-current-month-label]").textContent = getMonthLabel("2026-04");

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
    container.innerHTML = `<div class="empty-state">No hay movimientos recientes todavia.</div>`;
    return;
  }

  container.innerHTML = records
    .map(
      (record) => `
        <article class="timeline-item">
          <strong>${record.type === "earned" ? "Horas ganadas" : "Horas usadas"} - ${formatMinutesLabel(record.total_minutes)}</strong>
          <span class="timeline-meta">${formatDate(record.date)} · ${record.start_time} a ${record.end_time}</span>
          <span>${record.notes || "Sin observacion."}</span>
        </article>
      `,
    )
    .join("");
}

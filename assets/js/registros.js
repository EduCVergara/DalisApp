import { hydrateShell } from "/assets/js/app.js";
import { createExtraHour } from "/assets/js/pocketbase.js";
import { DEFAULT_MONTH, calculateWorkedMinutes, formatMinutesLabel, getMonthKey } from "/assets/js/utils.js";

document.addEventListener("DOMContentLoaded", () => {
  hydrateShell();
  setupForm();
});

function setupForm() {
  const form = document.querySelector("#record-form");
  const dateInput = document.querySelector("#date");
  const startInput = document.querySelector("#start_time");
  const endInput = document.querySelector("#end_time");
  const totalInput = document.querySelector("#total_display");
  const status = document.querySelector("#record-status");

  if (!form || !dateInput || !startInput || !endInput || !totalInput || !status) return;

  dateInput.value = `${DEFAULT_MONTH}-18`;

  const recalculate = () => {
    const totalMinutes = calculateWorkedMinutes(startInput.value, endInput.value);
    if (!startInput.value || !endInput.value) {
      totalInput.value = "00:00 hrs";
      return 0;
    }

    if (totalMinutes <= 0) {
      totalInput.value = "Horario invalido";
      return -1;
    }

    totalInput.value = formatMinutesLabel(totalMinutes);
    return totalMinutes;
  };

  startInput.addEventListener("input", recalculate);
  endInput.addEventListener("input", recalculate);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const totalMinutes = recalculate();

    if (totalMinutes <= 0) {
      status.hidden = false;
      status.className = "status-card error";
      status.textContent = "Revisa las horas de inicio y termino antes de guardar.";
      return;
    }

    const payload = {
      type: form.type.value,
      date: form.date.value,
      start_time: form.start_time.value,
      end_time: form.end_time.value,
      total_minutes: totalMinutes,
      notes: form.notes.value.trim(),
      month_key: getMonthKey(form.date.value),
    };

    await createExtraHour(payload);
    status.hidden = false;
    status.className = "status-card success";
    status.textContent = "Registro guardado correctamente.";
    form.reset();
    dateInput.value = `${DEFAULT_MONTH}-18`;
    totalInput.value = "00:00 hrs";
  });
}

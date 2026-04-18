export const DEFAULT_MONTH = "2026-04";

export const DEMO_RECORDS = [
  {
    id: "seed-1",
    user: "demo-user",
    date: "2026-04-05",
    start_time: "18:00",
    end_time: "22:30",
    total_minutes: 270,
    type: "earned",
    notes: "Cierre de inventario",
    month_key: "2026-04",
  },
  {
    id: "seed-2",
    user: "demo-user",
    date: "2026-04-10",
    start_time: "09:00",
    end_time: "11:00",
    total_minutes: 120,
    type: "used",
    notes: "Permiso medico corto",
    month_key: "2026-04",
  },
  {
    id: "seed-3",
    user: "demo-user",
    date: "2026-04-12",
    start_time: "17:30",
    end_time: "20:00",
    total_minutes: 150,
    type: "earned",
    notes: "Soporte de despacho",
    month_key: "2026-04",
  },
  {
    id: "seed-4",
    user: "demo-user",
    date: "2026-04-15",
    start_time: "16:30",
    end_time: "18:00",
    total_minutes: 90,
    type: "earned",
    notes: "Reunion extendida",
    month_key: "2026-04",
  },
];

export function parseTimeToMinutes(value) {
  if (!value || !value.includes(":")) return 0;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function diffMinutes(startTime, endTime) {
  return parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
}

export function applyMealBreak(totalMinutes) {
  const normalized = Number(totalMinutes) || 0;
  if (normalized >= 9 * 60) {
    return normalized - 60;
  }
  return normalized;
}

export function calculateWorkedMinutes(startTime, endTime) {
  const rawMinutes = diffMinutes(startTime, endTime);
  if (rawMinutes <= 0) return rawMinutes;
  return applyMealBreak(rawMinutes);
}

export function formatMinutes(totalMinutes) {
  const safeMinutes = Math.max(0, Number(totalMinutes) || 0);
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function formatMinutesLabel(totalMinutes) {
  return `${formatMinutes(totalMinutes)} hrs`;
}

export function getMonthKey(dateValue) {
  if (!dateValue) return DEFAULT_MONTH;
  return String(dateValue).slice(0, 7);
}

export function getYearKey(value) {
  if (!value) return String(new Date().getFullYear());
  return String(value).slice(0, 4);
}

export function getCurrentMonthKey() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

export function formatDate(dateValue) {
  if (!dateValue) return "--/--/----";
  const [year, month, day] = String(dateValue).split("-");
  return `${day}/${month}/${year}`;
}

export function getMonthLabel(monthKey) {
  if (!monthKey) return "Sin mes";
  const [year, month] = monthKey.split("-");
  const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });
  return monthName.charAt(0).toUpperCase() + monthName.slice(1);
}

export function summarizeRecords(records) {
  const earned = records
    .filter((record) => record.type === "earned")
    .reduce((total, record) => total + Number(record.total_minutes || 0), 0);

  const used = records
    .filter((record) => record.type === "used")
    .reduce((total, record) => total + Number(record.total_minutes || 0), 0);

  return {
    earned,
    used,
    balance: earned - used,
  };
}

export function sortByNewest(records) {
  return [...records].sort((a, b) => {
    const left = `${a.date || ""} ${a.start_time || ""}`;
    const right = `${b.date || ""} ${b.start_time || ""}`;
    return right.localeCompare(left);
  });
}

export function sortByOldest(records) {
  return [...records].sort((a, b) => {
    const left = `${a.date || ""} ${a.start_time || ""}`;
    const right = `${b.date || ""} ${b.start_time || ""}`;
    return left.localeCompare(right);
  });
}

export function getAvailableYears(records) {
  const years = new Set(
    records
      .map((record) => getYearKey(record.month_key || record.date))
      .filter(Boolean),
  );

  if (years.size === 0) {
    years.add(getYearKey(DEFAULT_MONTH));
  }

  return [...years].sort((left, right) => right.localeCompare(left));
}

export function filterRecordsByYear(records, yearKey) {
  return records.filter((record) => getYearKey(record.month_key || record.date) === String(yearKey));
}

export function buildYearHistory(records, yearKey) {
  const yearlyRecords = sortByOldest(filterRecordsByYear(records, yearKey));
  const monthsMap = new Map();

  yearlyRecords.forEach((record) => {
    const monthKey = getMonthKey(record.month_key || record.date);
    if (!monthsMap.has(monthKey)) {
      monthsMap.set(monthKey, []);
    }
    monthsMap.get(monthKey).push(record);
  });

  let runningBalance = 0;

  return [...monthsMap.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([monthKey, monthRecords]) => {
      const summary = summarizeRecords(monthRecords);
      runningBalance += summary.balance;

      return {
        monthKey,
        label: getMonthLabel(monthKey),
        earned: summary.earned,
        used: summary.used,
        balance: summary.balance,
        cumulativeBalance: runningBalance,
        count: monthRecords.length,
      };
    });
}

export function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

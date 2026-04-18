import { DEFAULT_MONTH, DEMO_RECORDS, getMonthKey, sortByNewest, uid } from "/assets/js/utils.js";

const AUTH_KEY = "dalisapp.auth";
const RECORDS_KEY = "dalisapp.records";
const PB_URL_KEY = "dalisapp.pb.url";
const DEFAULT_PB_URL = "http://127.0.0.1:8090";

function getPbUrl() {
  return localStorage.getItem(PB_URL_KEY) || DEFAULT_PB_URL;
}

function getPbClient() {
  if (!window.PocketBase) return null;

  try {
    return new window.PocketBase(getPbUrl());
  } catch {
    return null;
  }
}

function readJson(key, fallback) {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureSeedRecords() {
  const existing = readJson(RECORDS_KEY, null);
  if (!existing || !Array.isArray(existing) || existing.length === 0) {
    writeJson(RECORDS_KEY, DEMO_RECORDS);
  }
}

export function getCurrentUser() {
  return readJson(AUTH_KEY, null);
}

export function signOut() {
  localStorage.removeItem(AUTH_KEY);
}

export async function signIn(email, password) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "").trim();

  if (!cleanEmail || cleanPassword.length < 4) {
    throw new Error("Ingresa un correo valido y una contrasena de al menos 4 caracteres.");
  }

  const pb = getPbClient();
  if (pb) {
    try {
      const authData = await pb.collection("users").authWithPassword(cleanEmail, cleanPassword);
      const user = {
        id: authData.record?.id || "pb-user",
        name: authData.record?.name || cleanEmail.split("@")[0],
        email: cleanEmail,
        mode: "pocketbase",
      };
      writeJson(AUTH_KEY, user);
      return { user, mode: "pocketbase" };
    } catch {
      // Falls through to demo mode so the MVP remains testable visually.
    }
  }

  ensureSeedRecords();
  const user = {
    id: "demo-user",
    name: cleanEmail.split("@")[0] || "Dalia",
    email: cleanEmail,
    mode: "demo",
  };
  writeJson(AUTH_KEY, user);
  return { user, mode: "demo" };
}

export async function listExtraHours(monthKey = "") {
  ensureSeedRecords();
  const user = getCurrentUser();
  const selectedMonth = monthKey || DEFAULT_MONTH;
  const pb = getPbClient();

  if (pb && user?.mode === "pocketbase") {
    try {
      const records = await pb.collection("extra_hours").getFullList({
        sort: "-date,-start_time",
        filter: monthKey
          ? `user="${pb.authStore.model?.id}" && month_key="${selectedMonth}"`
          : `user="${pb.authStore.model?.id}"`,
      });

      return records.map((record) => ({
        id: record.id,
        user: record.user,
        date: record.date?.slice(0, 10),
        start_time: record.start_time,
        end_time: record.end_time,
        total_minutes: Number(record.total_minutes || 0),
        type: record.type,
        notes: record.notes || "",
        month_key: record.month_key || getMonthKey(record.date),
      }));
    } catch {
      // Fall back to local demo store if PocketBase is unavailable or collections are not ready.
    }
  }

  const allRecords = readJson(RECORDS_KEY, DEMO_RECORDS);
  const filtered = monthKey ? allRecords.filter((record) => record.month_key === selectedMonth) : allRecords;
  return sortByNewest(filtered);
}

export async function createExtraHour(payload) {
  ensureSeedRecords();
  const user = getCurrentUser();
  const normalizedRecord = {
    id: uid("record"),
    user: user?.id || "demo-user",
    date: payload.date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    total_minutes: Number(payload.total_minutes || 0),
    type: payload.type,
    notes: payload.notes || "",
    month_key: payload.month_key || getMonthKey(payload.date),
  };

  const pb = getPbClient();
  if (pb && user?.mode === "pocketbase") {
    try {
      const saved = await pb.collection("extra_hours").create({
        user: pb.authStore.model?.id,
        date: normalizedRecord.date,
        start_time: normalizedRecord.start_time,
        end_time: normalizedRecord.end_time,
        total_minutes: normalizedRecord.total_minutes,
        type: normalizedRecord.type,
        notes: normalizedRecord.notes,
        month_key: normalizedRecord.month_key,
      });

      return { ...normalizedRecord, id: saved.id };
    } catch {
      // Continue with local persistence.
    }
  }

  const records = readJson(RECORDS_KEY, DEMO_RECORDS);
  records.push(normalizedRecord);
  writeJson(RECORDS_KEY, records);
  return normalizedRecord;
}

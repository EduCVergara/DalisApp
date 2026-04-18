import { DEFAULT_MONTH, getMonthKey } from "/assets/js/utils.js";

const AUTH_KEY = "dalisapp.auth";
const PB_URL_KEY = "dalisapp.pb.url";
const ENV_PB_URL = String(import.meta.env.VITE_POCKETBASE_URL || "").trim();
const ENV_APP_URL = String(import.meta.env.VITE_APP_URL || window.location.origin || "").trim();
const DEFAULT_PB_URL = ENV_PB_URL || "http://127.0.0.1:8090";
const DEFAULT_APP_URL = ENV_APP_URL || window.location.origin;

export const APP_CONFIG = {
  appUrl: DEFAULT_APP_URL,
  pocketbaseUrl: DEFAULT_PB_URL,
  mode: import.meta.env.MODE,
};

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

function getPbAuthRecord() {
  const pb = getPbClient();
  return pb?.authStore?.model || null;
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

function normalizePocketBaseError(error, fallbackMessage) {
  const status = Number(error?.status || error?.response?.status || 0);
  const rawMessage = String(
    error?.response?.message ||
      error?.data?.message ||
      error?.message ||
      "",
  ).toLowerCase();

  if (status === 0 || rawMessage.includes("failed to fetch") || rawMessage.includes("networkerror")) {
    return "No fue posible conectar con el servidor. Revisa tu conexion o intenta nuevamente.";
  }

  if (status === 400 || status === 401 || rawMessage.includes("invalid") || rawMessage.includes("auth")) {
    return "Correo o contrasena incorrectos.";
  }

  if (rawMessage.includes("something went wrong while processing your request")) {
    return "No fue posible procesar tu solicitud. Intenta nuevamente en unos segundos.";
  }

  if (rawMessage.includes("not found")) {
    return "No se encontro la cuenta solicitada.";
  }

  if (rawMessage.includes("too many requests")) {
    return "Se alcanzó el limite de intentos. Espera un momento antes de volver a intentar.";
  }

  return fallbackMessage;
}

function requirePbClient() {
  const pb = getPbClient();
  if (!pb) {
    throw new Error("PocketBase no esta disponible en este navegador.");
  }
  return pb;
}

function requireAuthenticatedUser() {
  const user = getCurrentUser();
  if (!user) {
    throw new Error("Tu sesion expiró. Vuelve a iniciar sesion.");
  }
  return user;
}

export function getCurrentUser() {
  const storedUser = readJson(AUTH_KEY, null);
  const authRecord = getPbAuthRecord();

  if (!authRecord && !storedUser) {
    return null;
  }

  const resolvedUser = {
    id: authRecord?.id || storedUser?.id || null,
    name:
      authRecord?.name ||
      storedUser?.name ||
      authRecord?.email?.split("@")?.[0] ||
      storedUser?.email?.split("@")?.[0] ||
      "Dalia",
    email: authRecord?.email || storedUser?.email || null,
    mode: "pocketbase",
  };

  writeJson(AUTH_KEY, resolvedUser);
  return resolvedUser;
}

export function signOut() {
  const pb = getPbClient();
  pb?.authStore?.clear();
  localStorage.removeItem(AUTH_KEY);
}

export async function signIn(email, password) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPassword = String(password || "").trim();

  if (!cleanEmail || cleanPassword.length < 4) {
    throw new Error("Ingresa un correo valido y una contrasena de al menos 4 caracteres.");
  }

  const pb = requirePbClient();

  try {
    const authData = await pb.collection("users").authWithPassword(cleanEmail, cleanPassword);
    const user = {
      id: authData.record?.id || pb.authStore.model?.id || "pb-user",
      name: authData.record?.name || pb.authStore.model?.name || cleanEmail.split("@")[0],
      email: cleanEmail,
      mode: "pocketbase",
    };
    writeJson(AUTH_KEY, user);
    return { user, mode: "pocketbase" };
  } catch (error) {
    throw new Error(
      normalizePocketBaseError(
        error,
        "No fue posible iniciar sesion. Verifica tu correo, contrasena o el estado de PocketBase.",
      ),
    );
  }
}

export async function listExtraHours(monthKey = "") {
  requireAuthenticatedUser();
  const pb = requirePbClient();
  const selectedMonth = monthKey || DEFAULT_MONTH;
  const authUserId = pb.authStore.model?.id;

  if (!authUserId) {
    throw new Error("No hay una sesion valida en PocketBase.");
  }

  try {
    const records = await pb.collection("extra_hours").getFullList({
      sort: "-date,-start_time",
      filter: monthKey
        ? `user="${authUserId}" && month_key="${selectedMonth}"`
        : `user="${authUserId}"`,
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
  } catch (error) {
    throw new Error(
      normalizePocketBaseError(error, "No fue posible cargar los registros de horas extra."),
    );
  }
}

export async function createExtraHour(payload) {
  requireAuthenticatedUser();
  const pb = requirePbClient();
  const authUserId = pb.authStore.model?.id;

  if (!authUserId) {
    throw new Error("No hay una sesion valida en PocketBase.");
  }

  const normalizedRecord = {
    date: payload.date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    total_minutes: Number(payload.total_minutes || 0),
    type: payload.type,
    notes: payload.notes || "",
    month_key: payload.month_key || getMonthKey(payload.date),
  };

  try {
    const saved = await pb.collection("extra_hours").create({
      user: authUserId,
      date: normalizedRecord.date,
      start_time: normalizedRecord.start_time,
      end_time: normalizedRecord.end_time,
      total_minutes: normalizedRecord.total_minutes,
      type: normalizedRecord.type,
      notes: normalizedRecord.notes,
      month_key: normalizedRecord.month_key,
    });

    return { ...normalizedRecord, id: saved.id, user: authUserId };
  } catch (error) {
    throw new Error(normalizePocketBaseError(error, "No fue posible guardar el registro."));
  }
}

export const ADMIN_USERS_LIMITS = [20, 50, 100];

export function parseAdminUsersQuery(params) {
  const number = (key, fallback, max) => {
    const raw = params.get(key);
    return /^\d+$/.test(raw || "") && Number(raw) >= 1 && Number(raw) <= max
      ? Number(raw) : fallback;
  };
  const limit = number("limit", 20, 100);
  const banned = params.get("isBanned");
  return {
    page: number("page", 1, 1_000_000),
    limit: ADMIN_USERS_LIMITS.includes(limit) ? limit : 20,
    search: (params.get("search") || "").trim().replace(/\s+/g, " ").slice(0, 200),
    ...(banned === "true" || banned === "false" ? { isBanned: banned === "true" } : {}),
  };
}

export function nextAdminUsersSearch(current, changes) {
  const params = new URLSearchParams(current);
  if (Object.keys(changes).some((key) => key !== "page")) params.delete("page");
  for (const [key, value] of Object.entries(changes)) {
    params.delete(key);
    if (value !== undefined && value !== "" && !(key === "page" && value === 1)) {
      params.set(key, String(value));
    }
  }
  return params.toString();
}

export function userAccountStatus(status) {
  return ({ banned: "مسدود", verified: "فعال — احراز شده", active: "فعال — احراز نشده" })[status] || "نامشخص";
}

export function canChangeUserBan(user, actorId) {
  return user?.id !== actorId && user?.role !== "admin";
}

export function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function getUsername(user) {
  if (!user) return "user";
  if (user.username) {
    const trimmed = String(user.username).trim();
    if (trimmed && !trimmed.includes("@")) {
      return trimmed;
    }
  }
  if (user.name) {
    const trimmed = user.name.trim();
    if (!trimmed) return "user";
    if (trimmed.includes("@")) {
      return "user";
    }
    return trimmed.replace(/\s+/g, "").toLowerCase();
  }
  return "user";
}

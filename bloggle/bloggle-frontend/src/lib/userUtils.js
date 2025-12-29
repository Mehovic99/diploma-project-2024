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
  if (user.username) return user.username;
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

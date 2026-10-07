export function toLocalDateString(date) {
  const options = {
    month: "long",
    day: "numeric",
    // weekday: "long",
    year: "numeric",
  };
  return new Date(date).toLocaleDateString("fa-IR", options);
}

export function toLocalTimeString(date) {
  const options = {
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(date).toLocaleTimeString("fa-IR", options);
}

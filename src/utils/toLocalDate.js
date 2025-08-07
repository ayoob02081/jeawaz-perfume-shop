export function toLocalDateString(date) {
  const options = {
    month: "long",
    day: "numeric",
    // weekday: "long",
    year: "numeric",
  };
  return new Date(date).toLocaleDateString("fa-IR", options);
}

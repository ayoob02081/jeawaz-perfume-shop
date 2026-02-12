export function scrollTo(ref, type, value) {
  //  const handeleScroll = (e) => {
  //   e.preventDefault();
  if (!ref.current) return;
  if (type === "y") {
    ref.current.scrollBy({ top: value, behavior: "smooth" });
  } else {
    ref.current.scrollBy({ left: value, behavior: "smooth" });
  }
  //   };
}

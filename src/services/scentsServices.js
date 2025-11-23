export async function fetchScents() {
  // شبیه‌سازی API call
  await new Promise((r) => setTimeout(r, 300));

  return [
    {
      id: "sweetScents",
      src: "/images/perfume-1.svg",
      alt: "perfume-1 image",
      scent: "sweet",
      label: "رایحه شیرین",
      value: 150,
    },
    {
      id: "spicyScents",
      src: "/images/perfume-5.svg",
      alt: "perfume-5 image",
      scent: "spicy",
      label: "رایحه تند",
      value: 120,
    },
    {
      id: "bitterScents",
      src: "/images/perfume-3.svg",
      alt: "perfume-3 image",
      scent: "bitter",
      label: "رایحه تلخ",
      value: 150,
    },
    {
      id: "sourScents",
      src: "/images/perfume-4.svg",
      alt: "perfume-4 image",
      scent: "sour",
      label: "رایحه ترش",
      value: 180,
    },
  ];
}

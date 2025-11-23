
export async function fetchCategories() {
  // شبیه‌سازی API call
  await new Promise((r) => setTimeout(r, 300));

  return [
    {
      id: "womenProducts",
      src: "/images/perfume-1.svg",
      alt: "perfume-1 image",
      gender: "women",
      label: "عطر های زنانه",
      value: 180,
    },
    {
      id: "menProducts",
      src: "/images/perfume-5.svg",
      alt: "perfume-5 image",
      gender: "men",
      label: "عطر های مردانه",
      value: 160,
    },
    {
      id: "unisexProducts",
      src: "/images/perfume-3.svg",
      alt: "perfume-3 image",
      gender: "unisex",
      label: "عطر های مشترک",
      value: 200,
    },
  ];
}
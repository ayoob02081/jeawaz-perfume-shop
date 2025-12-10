import http from "./httpService";

export function getAllCategoriesApi() {
  return http.get(`/categories`).then(({ data }) => data);
}

export async function fetchGenderCategories() {
  // شبیه‌سازی API call
  await new Promise((r) => setTimeout(r, 200));

  return [
    {
      id: 1,
      gender: "men",
      title: "مردانه",
      description: "عطرهای مردانه",
      value: 160,
      iconUrl: "/images/gendersIcon/men.PNG",
      imageUrl: "/images/perfume-5.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 2,
      gender: "women",
      title: "زنانه",
      description: "عطرهای زنانه",
      value: 180,
      iconUrl: "/images/gendersIcon/women.png",
      imageUrl: "/images/perfume-2.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 3,
      gender: "unisex",
      title: "مشترک",
      description: "عطرهای مشترک",
      value: 200,
      iconUrl: "/images/gendersIcon/unisex.png",
      imageUrl: "/images/perfume-3.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
  ];
}

export async function fetchAccordCategories() {
  // شبیه‌سازی API call
  await new Promise((r) => setTimeout(r, 200));

  return [
    {
      id: 1,
      accord: "floral",
      title: "گلی",
      description: "رایحه گلی",
      iconUrl: "/images/accordIcons/flower.png",
      imageUrl: "/images/perfume-1.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 2,
      accord: "woody",
      title: "چوبی",
      description: "رایحه چوبی",
      iconUrl: "/images/accordIcons/wood.png",
      imageUrl: "/images/perfume-2.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 3,
      accord: "citrus",
      title: "مرکباتی",
      description: "رایحه مرکباتی",
      iconUrl: "/images/accordIcons/citrus.png",
      imageUrl: "/images/perfume-3.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 4,
      accord: "aromatic",
      title: "گیاهی",
      description: "رایحه گیاهی",
      iconUrl: "/images/accordIcons/aromatic.png",
      imageUrl: "/images/perfume-4.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 5,
      accord: "leather",
      title: "چرمی",
      description: "رایحه چرمی",
      iconUrl: "/images/accordIcons/leather.png",
      imageUrl: "/images/perfume-5.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 6,
      accord: "chypre",
      title: "شیپره",
      description: "رایحه شیپره",
      iconUrl: "/images/accordIcons/chypre.png",
      imageUrl: "/images/perfume-1.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 7,
      accord: "amber",
      title: "عنبری",
      description: "رایحه عنبری",
      iconUrl: "/images/accordIcons/amber.png",
      imageUrl: "/images/perfume-1.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
  ];
}

export async function fetchBrandCategories() {
  // شبیه‌سازی API call
  await new Promise((r) => setTimeout(r, 200));

  return [
    {
      id: 1,
      brand: "Chanel",
      title: "شنل",
      iconUrl: "/images/brands/Chanel_Logo.webp",
    },
    {
      id: 2,
      brand: "Dior",
      title: "دیور",
      iconUrl: "/images/brands/Dior_Logo.webp",
    },
    {
      id: 3,
      brand: "Yves Saint Laurent",
      title: "ایو سن لوران",
      iconUrl: "/images/brands/Yves_Saint_Laurent_Logo.webp",
    },
    {
      id: 4,
      brand: "Gucci",
      title: "گوچی",
      iconUrl: "/images/brands/Gucci_Logo.webp",
    },
    {
      id: 5,
      brand: "Tom Ford",
      title: "تام فورد",
      iconUrl: "/images/brands/Tom_Ford_Logo.webp",
    },
    {
      id: 6,
      brand: "Versace",
      title: "ورساچه",
      iconUrl: "/images/brands/Versace_Logo.webp",
    },
    {
      id: 7,
      brand: "Emporio Armani",
      title: "آرمانی",
      iconUrl: "/images/brands/Emporio_Armani_Logo.webp",
    },
    {
      id: 8,
      brand: "Prada",
      title: "پرادا",
      iconUrl: "/images/brands/Prada_Logo.webp",
    },
    {
      id: 9,
      brand: "Calvin Klein",
      title: "کلوین کلاین",
      iconUrl: "/images/brands/Calvin_Klein_Logo.webp",
    },
    {
      id: 10,
      brand: "Burberry",
      title: "باربری",
      iconUrl: "/images/brands/Burberry_Logo.webp",
    },
    {
      id: 11,
      brand: "Hugo Boss",
      title: "هوگو باس",
      iconUrl: "/images/brands/Hugo_Boss_Logo.webp",
    },
    {
      id: 12,
      brand: "Givenchy",
      title: "ژیوانشی",
      iconUrl: "/images/brands/Givenchy_Logo.webp",
    },
    {
      id: 13,
      brand: "Creed",
      title: "کرید",
      iconUrl: "/images/brands/Creed_logo.webp",
    },
    {
      id: 14,
      brand: "Montblanc",
      title: "مونت بلانک",
      iconUrl: "/images/brands/Montblanc_Logo.webp",
    },
    {
      id: 15,
      brand: "Maison Francis Kurkdjian",
      title: "فرانسیس کرکجان",
      iconUrl: "/images/brands/Maison_Francis_Kurkdjian_Logo.webp",
    },
    {
      id: 16,
      brand: "Jo Malone",
      title: "جو مالون",
      iconUrl: "/images/brands/Jo_Malone_Logo.webp",
    },
    {
      id: 17,
      brand: "Lancome",
      title: "لانکوم",
      iconUrl: "/images/brands/Lancôme_Logo.webp",
    },
    {
      id: 18,
      brand: "Hermès",
      title: "هرمس",
      iconUrl: "/images/brands/Hermes_Logo.webp",
    },
    {
      id: 19,
      brand: "Paco Rabanne",
      title: "پاکو رابان",
      iconUrl: "/images/brands/Paco_Rabanne_Logo.webp",
    },
    {
      id: 20,
      brand: "Carolina Herrera",
      title: "کارولینا هررا",
      iconUrl: "/images/brands/Carolina_Herrera_logo.webp",
    },
    {
      id: 21,
      brand: "Azzaro",
      title: "آزارو",
      iconUrl: "/images/brands/Azzaro_Logo.webp",
    },
    {
      id: 22,
      brand: "Narciso Rodriguez",
      title: "نارسيسو رودریگز",
      iconUrl: "/images/brands/Narciso_Rodriguez_Logo.webp",
    },
    {
      id: 23,
      brand: "Bvlgari",
      title: "بولگاری",
      iconUrl: "/images/brands/Bvlgari_Logo.webp",
    },
    {
      id: 24,
      brand: "Valentino",
      title: "ولنتینو",
      iconUrl: "/images/brands/Valentino_Logo.webp",
    },
    {
      id: 25,
      brand: "Dolce & Gabbana",
      title: "دلچه گابانا",
      iconUrl: "/images/brands/Dolce_&_Gabbana_Logo.webp",
    },

    {
      id: 26,
      brand: "Le Labo",
      title: "للابو",
      iconUrl: "/images/brands/Le_Labo_Logo.webp",
    },
    {
      id: 27,
      brand: "Killian",
      title: "کیلیان",
      iconUrl: "/images/brands/Killian_Logo.webp",
    },
  ];
}

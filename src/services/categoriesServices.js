import http from "./httpService";

export function getAllCategoriesApi() {
  return http.get(`/categories`).then(({ data }) => data);
}
export function getAllBrandsApi() {
  return http.get(`/brands`).then(({ data }) => data);
}

export async function fetchGenderCategories() {
  // شبیه‌سازی API call
  await new Promise((r) => setTimeout(r, 200));

  return [
    {
      id: 1,
      value: "men",
      title: "مردانه",
      description: "عطرهای مردانه",
      quantity: 160,
      iconUrl: "/images/gendersIcon/men.PNG",
      imageUrl: "/images/perfume-5.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 2,
      value: "women",
      title: "زنانه",
      description: "عطرهای زنانه",
      quantity: 180,
      iconUrl: "/images/gendersIcon/women.png",
      imageUrl: "/images/perfume-2.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 3,
      value: "unisex",
      title: "مشترک",
      description: "عطرهای مشترک",
      quantity: 200,
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
      value: "floral",
      title: "گلی",
      quantity: 54,
      description: "رایحه گلی",
      iconUrl: "/images/accordIcons/flower.png",
      imageUrl: "/images/perfume-1.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 2,
      value: "woody",
      title: "چوبی",
      quantity: 34,
      description: "رایحه چوبی",
      iconUrl: "/images/accordIcons/wood.png",
      imageUrl: "/images/perfume-2.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 3,
      value: "citrus",
      title: "مرکباتی",
      quantity: 52,
      description: "رایحه مرکباتی",
      iconUrl: "/images/accordIcons/citrus.png",
      imageUrl: "/images/perfume-3.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 4,
      value: "aromatic",
      title: "گیاهی",
      quantity: 75,
      description: "رایحه گیاهی",
      iconUrl: "/images/accordIcons/aromatic.png",
      imageUrl: "/images/perfume-4.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 5,
      value: "leather",
      title: "چرمی",
      quantity: 56,
      description: "رایحه چرمی",
      iconUrl: "/images/accordIcons/leather.png",
      imageUrl: "/images/perfume-5.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 6,
      value: "chypre",
      title: "شیپره",
      quantity: 47,
      description: "رایحه شیپره",
      iconUrl: "/images/accordIcons/chypre.png",
      imageUrl: "/images/perfume-1.svg",
      createdAt: "2025-12-01T13:21:20.548Z",
      updatedAt: "2025-12-01T13:21:58.573Z",
    },
    {
      id: 7,
      value: "amber",
      title: "عنبری",
      quantity: 15,
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
      value: "Chanel",
      title: "شنل",
      iconUrl: "/images/brands/Chanel_Logo.webp",
    },
    {
      id: 2,
      value: "Dior",
      title: "دیور",
      iconUrl: "/images/brands/Dior_Logo.webp",
    },
    {
      id: 3,
      value: "Yves Saint Laurent",
      title: "ایو سن لوران",
      iconUrl: "/images/brands/Yves_Saint_Laurent_Logo.webp",
    },
    {
      id: 4,
      value: "Gucci",
      title: "گوچی",
      iconUrl: "/images/brands/Gucci_Logo.webp",
    },
    {
      id: 5,
      value: "Tom Ford",
      title: "تام فورد",
      iconUrl: "/images/brands/Tom_Ford_Logo.webp",
    },
    {
      id: 6,
      value: "Versace",
      title: "ورساچه",
      iconUrl: "/images/brands/Versace_Logo.webp",
    },
    {
      id: 7,
      value: "Emporio Armani",
      title: "آرمانی",
      iconUrl: "/images/brands/Emporio_Armani_Logo.webp",
    },
    {
      id: 8,
      value: "Prada",
      title: "پرادا",
      iconUrl: "/images/brands/Prada_Logo.webp",
    },
    {
      id: 9,
      value: "Calvin Klein",
      title: "کلوین کلاین",
      iconUrl: "/images/brands/Calvin_Klein_Logo.webp",
    },
    {
      id: 10,
      value: "Burberry",
      title: "باربری",
      iconUrl: "/images/brands/Burberry_Logo.webp",
    },
    {
      id: 11,
      value: "Hugo Boss",
      title: "هوگو باس",
      iconUrl: "/images/brands/Hugo_Boss_Logo.webp",
    },
    {
      id: 12,
      value: "Givenchy",
      title: "ژیوانشی",
      iconUrl: "/images/brands/Givenchy_Logo.webp",
    },
    {
      id: 13,
      value: "Creed",
      title: "کرید",
      iconUrl: "/images/brands/Creed_logo.webp",
    },
    {
      id: 14,
      value: "Montblanc",
      title: "مونت بلانک",
      iconUrl: "/images/brands/Montblanc_Logo.webp",
    },
    {
      id: 15,
      value: "Maison Francis Kurkdjian",
      title: "فرانسیس کرکجان",
      iconUrl: "/images/brands/Maison_Francis_Kurkdjian_Logo.webp",
    },
    {
      id: 16,
      value: "Jo Malone",
      title: "جو مالون",
      iconUrl: "/images/brands/Jo_Malone_Logo.webp",
    },
    {
      id: 17,
      value: "Lancome",
      title: "لانکوم",
      iconUrl: "/images/brands/Lancôme_Logo.webp",
    },
    {
      id: 18,
      value: "Hermès",
      title: "هرمس",
      iconUrl: "/images/brands/Hermes_Logo.webp",
    },
    {
      id: 19,
      value: "Paco Rabanne",
      title: "پاکو رابان",
      iconUrl: "/images/brands/Paco_Rabanne_Logo.webp",
    },
    {
      id: 20,
      value: "Carolina Herrera",
      title: "کارولینا هررا",
      iconUrl: "/images/brands/Carolina_Herrera_logo.webp",
    },
    {
      id: 21,
      value: "Azzaro",
      title: "آزارو",
      iconUrl: "/images/brands/Azzaro_Logo.webp",
    },
    {
      id: 22,
      value: "Narciso Rodriguez",
      title: "نارسيسو رودریگز",
      iconUrl: "/images/brands/Narciso_Rodriguez_Logo.webp",
    },
    {
      id: 23,
      value: "Bvlgari",
      title: "بولگاری",
      iconUrl: "/images/brands/Bvlgari_Logo.webp",
    },
    {
      id: 24,
      value: "Valentino",
      title: "ولنتینو",
      iconUrl: "/images/brands/Valentino_Logo.webp",
    },
    {
      id: 25,
      value: "Dolce & Gabbana",
      title: "دلچه گابانا",
      iconUrl: "/images/brands/Dolce_&_Gabbana_Logo.webp",
    },

    {
      id: 26,
      value: "Le Labo",
      title: "للابو",
      iconUrl: "/images/brands/Le_Labo_Logo.webp",
    },
    {
      id: 27,
      value: "Killian",
      title: "کیلیان",
      iconUrl: "/images/brands/Killian_Logo.webp",
    },
  ];
}

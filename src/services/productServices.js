// import http from "./httpService";

// export function getAllProductsApi(qs, cookies) {
//   return http
//     .get(`/product/list?${qs}`, {
//       headers: {
//         Cookie: cookies,
//       },
//     })
//     .then(({ data }) => data.data);
// }

// export function getProductBySlugApi(slug) {
//   return http.get(`/product/slug/${slug}`).then(({ data }) => data.data);
// }

// export function getProductByIdApi(id) {
//   return http.get(`/product/${id}`).then(({ data }) => data.data);
// }

// export function likeProductApi(id) {
//   return http.post(`/product/like/${id}`).then(({ data }) => data.data);
// }
// export function updateProductApi({ productId, data }) {
//   return http
//     .patch(`/admin/product/update/${productId}`, data)
//     .then(({ data }) => data.data);
// }

// export function removeProductApi(id) {
//   return http
//     .delete(`/admin/product/remove/${id}`)
//     .then(({ data }) => data.data);
// }

// export function addProductApi(data) {
//   return http.post("/admin/product/add", data).then(({ data }) => data.data);
// }

// src,
// alt,
// scent,
// gender,
// brand,
// enTitle,
// perTitle,
// price,
// offValue,

// bitter talkh -scent
// spicy tond -scent
// sweet shirin -scent

// sour torsh -scent

export async function fetchProducts(type) {
  // شبیه‌سازی API call
  await new Promise((r) => setTimeout(r, 300));

  return [
    {
      id: "1",
      src: "/images/perfume-1.svg",
      alt: "perfume-1 image",
      scent: "sweet",
      gender: "woman",
      brand: "Channel",
      enTitle: "Tiziana Terenzi",
      perTitle: "تیزیانا ترنزی",
      price: 1200000,
      offValue: 5,
      images: [
        "/images/perfume-1.svg",
        "/images/perfume-1.svg",
        "/images/perfume-1.svg",
        "/images/perfume-1.svg",
        "/images/perfume-1.svg",
      ],
    },
    {
      id: "2",
      src: "/images/perfume-2.svg",
      alt: "perfume-2 image",
      scent: "spicy",
      gender: "man",
      brand: "Channel",
      enTitle: "Tiziana Terenzi",
      perTitle: "شنل اگویست پلاتینیوم",
      price: 1500000,
      offValue: 12,
      images: [
        "/images/perfume-2.svg",
        "/images/perfume-2.svg",
        "/images/perfume-2.svg",
        "/images/perfume-2.svg",
        "/images/perfume-2.svg",
      ],
    },
    {
      id: "3",
      src: "/images/perfume-3.svg",
      alt: "perfume-3 image",
      scent: "bitter",
      gender: "woman",
      brand: "Channel",
      enTitle: "Tiziana Terenzi",
      perTitle: "تیزیانا ترنزی",
      price: 3000000,
      offValue: 24,
      images: [
        "/images/perfume-3.svg",
        "/images/perfume-3.svg",
        "/images/perfume-3.svg",
        "/images/perfume-3.svg",
        "/images/perfume-3.svg",
      ],
    },
    {
      id: "4",
      src: "/images/perfume-4.svg",
      alt: "perfume-4 image",
      scent: "sweet",
      gender: "woman",
      brand: "Channel",
      enTitle: "Tiziana Terenzi",
      perTitle: "شنل اگویست پلاتینیوم",
      price: 2500000,
      offValue: 20,
      images: [
        "/images/perfume-4.svg",
        "/images/perfume-4.svg",
        "/images/perfume-4.svg",
        "/images/perfume-4.svg",
        "/images/perfume-4.svg",
      ],
    },
    {
      id: "5",
      src: "/images/perfume-5.svg",
      alt: "perfume-5 image",
      scent: "bitter",
      gender: "man",
      brand: "Channel",
      enTitle: "Tiziana Terenzi",
      perTitle: "تیزیانا ترنزی",
      price: 2900000,
      offValue: 10,
      images: [
        "/images/perfume-5.svg",
        "/images/perfume-5.svg",
        "/images/perfume-5.svg",
        "/images/perfume-5.svg",
        "/images/perfume-5.svg",
      ],
    },
    {
      id: "6",
      src: "/images/perfume-1.svg",
      alt: "perfume-1 image",
      scent: "sweet",
      gender: "woman",
      brand: "Channel",
      enTitle: "Tiziana Terenzi",
      perTitle: "شنل اگویست پلاتینیوم",
      price: 1200000,
      offValue: 5,
      images: [
        "/images/perfume-1.svg",
        "/images/perfume-1.svg",
        "/images/perfume-1.svg",
        "/images/perfume-1.svg",
        "/images/perfume-1.svg",
      ],
    },
    {
      id: "7",
      src: "/images/perfume-2.svg",
      alt: "perfume-2 image",
      scent: "spicy",
      gender: "man",
      brand: "Channel",
      enTitle: "Tiziana Terenzi",
      perTitle: "تیزیانا ترنزی",
      price: 1500000,
      offValue: 12,
      images: [
        "/images/perfume-2.svg",
        "/images/perfume-2.svg",
        "/images/perfume-2.svg",
        "/images/perfume-2.svg",
        "/images/perfume-2.svg",
      ],
    },
    {
      id: "8",
      src: "/images/perfume-3.svg",
      alt: "perfume-3 image",
      scent: "bitter",
      gender: "woman",
      brand: "Channel",
      enTitle: "Tiziana Terenzi",
      perTitle: "شنل اگویست پلاتینیوم",
      price: 3000000,
      offValue: 24,
      images: [
        "/images/perfume-3.svg",
        "/images/perfume-3.svg",
        "/images/perfume-3.svg",
        "/images/perfume-3.svg",
        "/images/perfume-3.svg",
      ],
    },
    {
      id: "9",
      src: "/images/perfume-4.svg",
      alt: "perfume-4 image",
      scent: "sweet",
      gender: "woman",
      brand: "Channel",
      enTitle: "Tiziana Terenzi",
      perTitle: "تیزیانا ترنزی",
      price: 2500000,
      offValue: 20,
      images: [
        "/images/perfume-4.svg",
        "/images/perfume-4.svg",
        "/images/perfume-4.svg",
        "/images/perfume-4.svg",
        "/images/perfume-4.svg",
      ],
    },
  ];
}

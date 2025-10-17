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

export async function fetchOrders(status) {
  // شبیه‌سازی API call
  await new Promise((r) => setTimeout(r, 300));

  return [
    {
      id: "123445",
      date: "1404/07/15",
      price: 1250000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
    {
      id: "123446",
      date: "1404/07/16",
      price: 1000000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
    {
      id: "123447",
      date: "1404/07/18",
      price: 1100000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
    {
      id: "123448",
      date: "1404/07/22",
      price: 1000000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
    {
      id: "123449",
      date: "1404/07/22",
      price: 1000000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
    {
      id: "123450",
      date: "1404/07/22",
      price: 1000000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
    {
      id: "123451",
      date: "1404/07/22",
      price: 1000000,
      items: [
        { src: "/images/perfume-1.svg", alt: "perfume image" },
        { src: "/images/perfume-2.svg", alt: "perfume image" },
        { src: "/images/perfume-3.svg", alt: "perfume image" },
      ],
    },
  ];
}

export default function findCategories(data) {
  const product = data.product;
  const brands = data.brands;
  const categories = data.categories;
  const genderCategories = categories?.filter((c) => c.type === "gender");
  const accordCategories = categories?.filter((c) => c.type === "accord");

  const productBrand = brands?.find(
    (brand) => brand.title === product?.categories?.brand,
  );

  const productGender = genderCategories?.find(
    (gender) => gender.value === product?.categories?.gender,
  );

  const productAccords = accordCategories?.filter((accord) =>
    product?.categories?.accords.includes(accord.value),
  );

  return { productBrand, productGender, productAccords };
}

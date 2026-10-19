import { ADMIN_PRODUCTS_LIMITS } from "@/utils/adminProductsListContract.mjs";
import { toPersianNumbers } from "@/utils/toPersianNumbers";

// Rows per page. The value is the URL's `limit` (the list's only state);
// a change is applied at once, like paging, and returns to page 1.
function ProductsPageSize({ limit, onChange }) {
  return (
    <label className="flex items-center gap-2 ms-auto">
      <span className="font-bold text-nowrap">تعداد در صفحه</span>
      <select
        name="limit"
        className="textField__input rounded-xl py-1 px-2"
        value={String(limit)}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {ADMIN_PRODUCTS_LIMITS.map((value) => (
          <option key={value} value={String(value)}>
            {toPersianNumbers(value)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default ProductsPageSize;

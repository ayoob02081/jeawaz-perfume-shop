import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const pagesNumber = [
  { id: 1, value: 1, description: "صفحه یک", url: "/products" },
  { id: 2, value: 2, description: "صفحه دو", url: "/products" },
  { id: 3, value: 3, description: "صفحه سه", url: "/products" },
  { id: 4, value: 4, description: "صفحه چهار", url: "/products" },
  { id: 5, value: 5, description: "صفحه پنج", url: "/products" },
];

function PagesNumber() {
  return (
    <section className="flex items-center justify-between flex-row-reverse gap-4 overflow-auto scrollbar-none">
      <div>
        <ArrowLeftIcon className="size-6 text-stroke-800 hover:text-shadow-primary" />
      </div>
      {pagesNumber.map((item) => (
        <Link key={item.id} href={item.url} className="pages--btn">
          <p>{toPersianNumbers(item.value)}</p>
        </Link>
      ))}
      <div>
        <ArrowRightIcon className="size-6 text-stroke-800 hover:text-primary" />
      </div>
    </section>
  );
}

export default PagesNumber;

import { campaignTHeads, couponTHeads } from "@/constants/tableHeads";
import Table from "@/ui/Table";
import { toLocalDateString } from "@/utils/toLocalDate";
import {
  toPersianNumbers,
  toPersianNumbersWithComma,
} from "@/utils/toPersianNumbers";
import { PencilIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

function CampaignsListTable({ campaigns }) {
  return (
    <div className="w-full overflow-auto max-h-screen pb-0.5 rounded-xl shadow-xl scrollbar-none">
      <Table className="overflow-auto">
        <Table.Header className="">
          {campaignTHeads.map((item) => (
            <th className="whitespace-nowrap table__th" key={item.id}>
              {item.label}
            </th>
          ))}
        </Table.Header>
        <Table.body>
          {campaigns &&
            campaigns?.map((campaign, index) => {
              const {
                title,
                discountPercent,
                scope,
                createdAt,
                updatedAt,
                startsAt,
                endsAt,
                status,
                products,
              } = campaign || {};
              return (
                <Table.Row key={campaign.id} className="even:bg-primary/5">
                  <td className="table__td px-3 font-bold rounded-r-full">
                    <p>{toPersianNumbers(index + 1)}</p>
                  </td>
                  <td className="table__td px-2 max-w-70 truncate">
                    <p className="font-bold">{title}</p>
                  </td>
                  <td className="table__td px-2 max-w-70 truncate">
                    <p
                      className={`badge border ${status === "active" ? " bg-success/10 text-success border-success" : "bg-orange/10 text-orange border-orange"} font-bold`}
                    >
                      {status === "active" ? "فعال" : "غیر فعال"}
                    </p>
                  </td>
                  <td className="table__td px-2">
                    <p className=" badge badge--secondary--2 border border-stroke-800 font-bold">
                      {toPersianNumbersWithComma(discountPercent)} درصد
                    </p>
                  </td>
                  <td className="table__td px-2 overflow-auto ">
                    <p className="badge border border-blue bg-blue/10 text-blue font-bold">
                      {scope === "decant" && "دکانت"}
                      {scope === "sealed" && "پلمپ"}
                      {scope === "product" && "هر دو"}
                    </p>
                  </td>
                  <td className="table__td px-2">
                    <div className="flex items-center justify-center w-full">
                      <p className="badge badge--secondary--2 px-4 font-bold w-fit">
                        {toPersianNumbersWithComma(products?.length || 0)}
                      </p>
                    </div>
                  </td>
                  <td className="table__td px-2 overflow-auto ">
                    <p className="badge badge--secondary bg-success/10 text-success font-bold">
                      {toLocalDateString(startsAt)}
                    </p>
                  </td>
                  <td className="table__td px-2 overflow-auto ">
                    <p className="badge badge--secondary bg-primary/10 text-primary font-bold">
                      {toLocalDateString(endsAt)}
                    </p>
                  </td>
                  <td className="table__td px-2 rounded-l-full">
                    <div className="flex justify-center items-center w-full">
                      <Link
                        href={`/admin/campaigns/edit/${campaign.id}`}
                        className="text-stroke-450 hover:text-success duration-200 w-fit"
                      >
                        <PencilIcon className=" size-5" />
                      </Link>
                    </div>
                  </td>
                </Table.Row>
              );
            })}
        </Table.body>
      </Table>
    </div>
  );
}

export default CampaignsListTable;

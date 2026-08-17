import { bannerTHeads } from "@/constants/tableHeads";
import { useRemoveBanner, useToggleBanner } from "@/hooks/useBanners";
import ConfirmModal from "@/ui/ConfirmModal";
import Table from "@/ui/Table";
import { toLocalDateString } from "@/utils/toLocalDate";
import { toPersianNumbers } from "@/utils/toPersianNumbers";
import { EyeIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import React, { useState } from "react";

function BannersListTable({ banners }) {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [banner, setBanner] = useState(false);
  const { removeBanner, isDeleting } = useRemoveBanner();
  const { toggleBanner, isToggling } = useToggleBanner();

  const removeBannerHandler = async () => {
    const { id } = banner;

    await removeBanner(id);

    setConfirmModalOpen(false);
  };

  const handleModal = (data) => {
    if (!data.id) {
      setConfirmModalOpen(false);
    }
    if (data?.id) {
      setConfirmModalOpen(true);
      setBanner(data);
    }
  };
  return (
    <div className="w-full overflow-auto max-h-screen pb-0.5 rounded-xl shadow-xl scrollbar-none">
      <Table className="overflow-auto">
        <Table.Header className="">
          {bannerTHeads.map((item) => (
            <th className="whitespace-nowrap table__th" key={item.id}>
              {item.label}
            </th>
          ))}
        </Table.Header>
        <Table.body>
          {banners &&
            banners?.map((banner, index) => {
              return (
                <Table.Row key={banner.id} className="even:bg-primary/5">
                  <td className="table__td px-3 font-bold rounded-r-full">
                    <p>{toPersianNumbers(index + 1)}</p>
                  </td>
                  <td className="table__td px-6 max-w-70 truncate">
                    <p className="font-bold">{banner.title}</p>
                  </td>
                  <td className="table__td px-6 max-w-70 truncate">
                    <Link
                      href={`/${banner.link}`}
                      className="font-bold hover:text-primary transition-all duration-200"
                    >
                      {banner.link}/
                    </Link>
                  </td>
                  <td className="table__td max-w-70 truncate">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleBanner(banner.id);
                      }}
                      className="flex items-center justify-between flex-row-revers size-full"
                    >
                      <div
                        className={`relative flex items-center gap-2 rounded-full p-0.5 w-11 h-6 
                         ${banner.isActive === true ? "bg-success justify-start" : "bg-stroke-200 dark:bg-stroke-50 transition-all duration-200"}`}
                      >
                        <div
                          className={`absolute flex items-center justify-center h-5 aspect-square rounded-full bg-stroke-0 ${
                            banner.isActive !== true && "-translate-x-full"
                          } shadow transition-all duration-200`}
                        />
                      </div>
                      <div>
                        <p
                          className={`badge ${banner.isActive === true ? "text-success" : "text-stroke-400"} font-bold`}
                        >
                          {banner.isActive === true ? "فعال" : "غیر فعال"}
                        </p>
                      </div>
                    </button>
                  </td>
                  <td className="table__td px-4 max-w-70 truncate">
                    <p
                      className={`badge border ${banner.type === "primary" ? "text-blue border-blue bg-blue/5" : "text-warning border-warning bg-warning/5"} font-bold`}
                    >
                      {banner.type === "primary" ? "اصلی" : "ثانویه"}
                    </p>
                  </td>
                  <td className="table__td px-2">
                    {banner?.startsAt
                      ? toLocalDateString(banner?.startsAt)
                      : "بدون محدودیت"}
                  </td>
                  <td className="table__td px-2">
                    {banner?.endsAt
                      ? toLocalDateString(banner?.endsAt)
                      : "بدون محدودیت"}
                  </td>
                  <td className="table__td px-2">
                    <p className="badge badge--primary font-bold">
                      {toPersianNumbers(banner?.sortOrder)}
                    </p>
                  </td>

                  <td className="table__td px-3 rounded-l-full">
                    <div className="flex gap-2 items-center">
                      <Link
                        href={`/admin/banners/${banner.id}`}
                        className="text-stroke-450 hover:text-blue duration-200"
                      >
                        <EyeIcon className=" size-5" />
                      </Link>
                      <Link
                        href={`/admin/banners/edit/${banner.id}`}
                        className="text-stroke-450 hover:text-success duration-200"
                      >
                        <PencilIcon className=" size-5" />
                      </Link>
                      <button
                        onClick={() => handleModal(banner)}
                        className="text-stroke-450 hover:text-primary duration-200"
                      >
                        <TrashIcon className="size-5" />
                      </button>
                    </div>
                  </td>
                </Table.Row>
              );
            })}
        </Table.body>
      </Table>
      {confirmModalOpen && (
        <ConfirmModal
          cancellBtn={handleModal}
          confirmBtn={removeBannerHandler}
          isOpen={confirmModalOpen}
          onClose={setConfirmModalOpen}
        >
          <span className="flex flex-wrap items-center justify-center gap-2 text-stroke-800 max-md:text-xl md:text-2xl">
            <p>بنر</p>
            <p>"{banner.title}"</p>
            <p>حذف شود؟</p>
          </span>
        </ConfirmModal>
      )}
    </div>
  );
}

export default BannersListTable;

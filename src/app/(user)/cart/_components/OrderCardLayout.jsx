import CardEvents from "@/components/CardEvents";
import AppImage from "@/components/AppImage";
import PriceSection from "@/components/PriceSection";
import Table from "@/ui/Table";
import { toPersianNumbers } from "@/utils/toPersianNumbers";

function OrderCardLayout() {}

export default OrderCardLayout;

function Title({
  enTitle,
  perTitle,
  FirstClassName = "text-base",
  SecondClassName = "text-sm",
  brand,
  volume,
  type,
  location = "public",
}) {
  return (
    <div className="size-full">
      {location === "public" && (
        <div className="flex items-start justify-between size-full flex-col gap-1">
          {brand && <p className="text-stroke-600 text-xs">Versace</p>}
          <span className={`text-stroke-800 ${FirstClassName} font-bold`}>
            {enTitle}
          </span>
          <p className={`text-stroke-800 ${SecondClassName} font-semibold`}>
            {perTitle}
          </p>
        </div>
      )}
      {location === "summeryCardTwo" && (
        <div className="flex items-start justify-between size-full flex-col gap-1">
          <div className="flex items-start justify-between size-full">
            <span className="flex flex-col items-start gap-2">
              <p className="text-stroke-800 text-sm font-bold">{enTitle}</p>
              <p className="text-stroke-800 text-xs font-semibold">
                {perTitle}
              </p>
            </span>
            <div className="flex flex-col items-center gap-2 ">
              <p className="badge badge--primary w-fit">
                {type === "decant" ? "دکانت" : "پلمپ"}
              </p>
              <span className="flex items-center justify-end gap-0.5">
                <p className="text-stroke-800">{toPersianNumbers(volume)}</p>
                <p className="text-stroke-600 text-sm">میل</p>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CardLayoutMobile({
  src,
  price,
  offValue,
  enTitle,
  perTitle,
  type,
  volume,
}) {
  return (
    <div className="flex items-center justify-center p-3 gap-4 border-[0.094rem] border-stroke-200 shadow-xs rounded-2xl w-full ">
      <div className="flex items-center justify-start gap-4 size-full">
        <div className="flex items-start justify-center h-full">
          <AppImage
            src={src}
            alt={enTitle + "-image"}
            width="size-16"
            sizes="30vw"
          />
        </div>
        <div className="flex flex-col gap-3 size-full">
          <Title
            enTitle={enTitle}
            perTitle={perTitle}
            brand
            volume={volume}
            type={type}
          />
          <div className="badge badge--secondary w-max h-6">
            {toPersianNumbers(volume)} میل
          </div>
          <div className="max-sm:relative flex flex-co max-sm:justify-end items-center justify-between size-full">
            <div className="max-sm:absolute -right-11">
              <PriceSection offValue={offValue} price={price} />
            </div>
            <div className="flex items-center justify-center">
              <CardEvents
                BtnBackgroundColor="bg-stroke-100 dark:bg-stroke-50"
                className="lg:*:*:size-5 *:*:size-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardLayouteDesktop({
  src,
  price,
  offValue,
  enTitle,
  perTitle,
  type,
  volume,
}) {
  return (
    <Table.Row border className="*:py-6">
      <td className="text-right">
        <div className="tdBase">
          <div className="flex items-start justify-center h-full">
            <AppImage
              src={src}
              alt={enTitle + "-image"}
              width="size-[5.65rem]"
              sizes="30vw"
            />
          </div>
          <Title
            enTitle={enTitle}
            perTitle={perTitle}
            volume={volume}
            type={type}
          />
        </div>
      </td>
      <td className="flex flex-col gap-2 items-center justify-center size-full text-stroke-800">
        <p className="badge badge--primary w-fit">
          {type === "decant" ? "دکانت" : "پلمپ"}
        </p>
        <p className="badge badge--secondary w-fit">
          {toPersianNumbers(volume)} میل
        </p>
      </td>
      <td className="text-center">
        <CardEvents BtnBackgroundColor="bg-stroke-100 dark:bg-stroke-50" />
      </td>
      <td className="text-center w-ful">
        <PriceSection
          offValue={offValue}
          price={price}
          className="w-full"
          justify="justify-end"
        />
      </td>
    </Table.Row>
  );
}

function SuccessedOrderCard({
  src,
  price,
  offValue,
  enTitle,
  perTitle,
  type,
  volume,
}) {
  return (
    <div
      className={`flex items-center justify-between w-full sm:max-w-max sm:min-w-96 max-md:p-3 md:p-4 !pr-0 max-md:gap-4 md:gap-5 max-md:border md:border-[1.5px] border-stroke-300 shadow-xs rounded-2xl`}
    >
      <DeskSuccessedOrderCard
        src={src}
        enTitle={enTitle}
        perTitle={perTitle}
        price={price}
        offValue={offValue}
        type={type}
        volume={volume}
      />
      <div className="max-md:flex md:hidden items-center justify-start gap-4 size-full">
        <div className="flex items-start justify-center h-full">
          <AppImage
            src={src}
            alt={enTitle + "-image"}
            width="size-16"
            sizes="20vw"
          />
        </div>
        <div className="flex flex-col gap-3 size-full">
          <Title
            enTitle={enTitle}
            perTitle={perTitle}
            volume={volume}
            type={type}
          />
          <div className="flex items-center justify-between size-full">
            <div className="badge badge--secondary w-max h-6">
              {toPersianNumbers(volume)} میل
            </div>
            <PriceSection offValue={offValue} price={price} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeskSuccessedOrderCard({
  src,
  price,
  offValue,
  enTitle,
  perTitle,
  type,
  volume,
}) {
  return (
    <div className="md:flex max-md:hidden items-center justify-between gap-1 w-full">
      <div className="flex items-start justify-center h-full">
        <AppImage src={src} alt={enTitle + "-image"} width="size-24" />
      </div>
      <div className="flex flex-col gap-3 size-full">
        <Title
          enTitle={enTitle}
          perTitle={perTitle}
          volume={volume}
          type={type}
        />
        <div className="flex items-center justify-between size-full gap-4 text-stroke-800">
          <div className="flex items-center justify-between gap-1 text-sm">
            <p className="text-stroke-600">تعداد:</p>
            <span className="flex items-center justify-between">
              <p>{toPersianNumbers(1)}</p>
              <p>عدد</p>
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 text-sm">
            <p className="text-stroke-600">حجم:</p>
            <span className="flex items-center justify-between">
              <p>{toPersianNumbers(volume)}</p>
              <p>میل</p>
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end justify-center gap-4 size-full">
        <p className="text-sm text-stroke-600">مبلغ پرداختی</p>
        <PriceSection offValue={offValue} price={price} />
      </div>
    </div>
  );
}

function SummeryCard({
  src,
  price,
  offValue,
  enTitle,
  perTitle,
  type,
  volume,
}) {
  return (
    <div className="flex items-center justify-center p-3 gap-4 border-t border-stroke-200 shadow-xs w-full h-fit">
      <div className="flex items-center justify-center md:gap-2 lg:gap-4 size-full">
        <div className="flex items-start h-36">
          <div className="flex items-center justify-center md:h-auto lg:h-full aspect-square rounded-xl bg-stroke-0">
            <AppImage
              src={src}
              alt={enTitle + "-image"}
              width="max-lg:size-20 lg:size-[5.65rem]"
              sizes="20vw"
            />
          </div>
        </div>
        <div className="flex flex-col gap-3 size-full">
          <Title
            enTitle={enTitle}
            perTitle={perTitle}
            location="summeryCardTwo"
            volume={volume}
            type={type}
          />

          <div className="flex items-center justify-between size-full">
            <div>
              <PriceSection
                offValue={offValue}
                price={price}
                priceClassName="text-xl"
                textClassName="text-[10px]"
              />
            </div>
            <div className="flex items-center justify-center">
              <CardEvents
                BtnBackgroundColor="bg-stroke-0"
                className="lg:*:*:size-5 *:*:size-4 h-10"
              />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

OrderCardLayout.Mobile = CardLayoutMobile;
OrderCardLayout.Desktop = CardLayouteDesktop;
OrderCardLayout.Summery = SummeryCard;
OrderCardLayout.Success = SuccessedOrderCard;

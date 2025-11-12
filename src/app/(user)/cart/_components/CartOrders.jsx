import CardEvents from "@/components/CardEvents";
import ImageFrame from "@/components/ImageFrame";
import PriceSection from "@/components/PriceSection";
import Table from "@/ui/Table";
import { toPersianNumbers } from "@/utils/toPersianNumbers";

function CartOrders() {
  // return <div>CartOrders</div>;
}

export default CartOrders;
function CardTitle({
  enTitle,
  perTitle,
  FirstClassName = "text-base",
  SecondClassName = "text-sm",
  brand,
  location = "public",
}) {
  return (
    <div className="size-full">
      {location === "public" && (
        <div className="flex items-start justify-between size-full flex-col gap-1">
          {brand && <p className="text-text-secondary text-xs">Versace</p>}
          <span className={`text-text-primary ${FirstClassName} font-bold`}>
            {enTitle}
          </span>
          <span
            className={`text-text-primary ${SecondClassName} font-semibold`}
          >
            {perTitle}
          </span>
        </div>
      )}
      {location === "summeryCardTwo" && (
        <div className="flex items-start justify-between size-full flex-col gap-1">
          <div className="flex items-center justify-between size-full">
            <span className="text-text-primary text-sm font-bold">
              Hugo Just Different
            </span>
            <span className="flex items-center justify-end gap-0.5">
              <p className="text-text-primary">{toPersianNumbers(100)}</p>
              <p className="text-text-secondary text-sm">میل</p>
            </span>
          </div>
          <span className="text-text-primary text-xs font-semibold">
            هوگو بوس جاست دیفرنت
          </span>
        </div>
      )}
    </div>
  );
}

function MobileCard({ src, alt, price, offValue, enTitle, perTitle }) {
  return (
    <div className="flex items-center justify-center p-3 gap-4 border-[0.094rem] border-stroke shadow-xs rounded-2xl w-full ">
      <div className="flex items-center justify-start gap-4 size-full">
        <div className="flex items-start justify-center h-full">
          <ImageFrame src={src} alt={alt} className="size-16" />
        </div>
        <div className="flex flex-col gap-3 size-full">
          <CardTitle enTitle={enTitle} perTitle={perTitle} brand />
          <div className="badge badge--secondary w-max h-6">
            {toPersianNumbers(100)} میل
          </div>
          <div className="max-sm:relative flex flex-co max-sm:justify-end items-center justify-between size-full">
            <div className="max-sm:absolute -right-11">
              <PriceSection offValue={offValue} price={price} />
            </div>
            <div className="flex items-center justify-center">
              <CardEvents
                BtnBackgroundColor="bg-grey"
                strokeColor="stroke"
                className="lg:*:*:size-5 *:*:size-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeskCard({ src, alt, price, offValue, enTitle, perTitle }) {
  return (
    <Table.Row border className="*:py-6">
      <td className="text-right">
        <div className="tdBase">
          <div className="flex items-start justify-center h-full">
            <ImageFrame src={src} alt={alt} className="size-[5.65rem]" />
          </div>
          <CardTitle enTitle={enTitle} perTitle={perTitle} />
        </div>
      </td>
      <td className="text-center">{toPersianNumbers(100)} میل</td>
      <td className="text-center">
        <CardEvents BtnBackgroundColor="bg-grey" strokeColor="stroke" />
      </td>
      <td className="text-center w-full">
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

function SuccessedOrderCard({ src, alt, price, offValue, enTitle, perTitle }) {
  return (
    <div
      className={`flex items-center justify-between w-full sm:max-w-max sm:min-w-96 max-md:p-3 md:p-4 max-md:gap-4 md:gap-5 max-md:border md:border-[0.094rem] border-stroke-2 shadow-xs rounded-2xl`}
    >
      <DeskSuccessedOrderCard
        src={src}
        alt={alt}
        enTitle={enTitle}
        perTitle={perTitle}
        price={price}
        offValue={offValue}
      />
      <div className="max-md:flex md:hidden items-center justify-start gap-4 size-full">
        <div className="flex items-start justify-center h-full">
          <ImageFrame src={src} alt={alt} className="size-16" />
        </div>
        <div className="flex flex-col gap-3 size-full">
          <CardTitle enTitle={enTitle} perTitle={perTitle} />
          <div className="flex items-center justify-between size-full">
            <div className="badge badge--secondary w-max h-6">
              {toPersianNumbers(100)} میل
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
  alt,
  price,
  offValue,
  enTitle,
  perTitle,
}) {
  return (
    <div className="md:flex max-md:hidden items-center justify-between w-full">
      <div className="flex items-start justify-center h-full">
        <ImageFrame src={src} alt={alt} className="size-24" />
      </div>
      <div className="flex flex-col gap-3 size-full">
        <CardTitle enTitle={enTitle} perTitle={perTitle} />
        <div className="flex items-center justify-between size-full gap-4">
          <span className="flex items-center justify-between gap-1 text-sm">
            <p className="text-text-secondary">تعداد:</p>
            <span className="flex items-center justify-between">
              <p>{toPersianNumbers(1)}</p>
              <p>عدد</p>
            </span>
          </span>
          <span className="flex items-center justify-between gap-1 text-sm">
            <p className="text-text-secondary">حجم:</p>
            <span className="flex items-center justify-between">
              <p>{toPersianNumbers(100)}</p>
              <p>میل</p>
            </span>
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end justify-center gap-4 size-full">
        <p className="text-sm text-text-secondary">مبلغ پرداختی</p>
        <PriceSection offValue={offValue} price={price} />
      </div>
    </div>
  );
}

function SummeryCard({ src, alt, price, offValue, enTitle, perTitle }) {
  return (
    <div className="flex items-center justify-center p-3 gap-4 border-t border-stroke shadow-xs w-full ">
      <div className="flex items-center justify-start md:gap-2 lg:gap-4 size-full">
        <div className="flex items-center justify-center md:size-28 lg:size-[7.5rem] rounded-xl bg-white">
          <ImageFrame
            src={src}
            alt={alt}
            className="max-lg:size-20 lg:size-[5.65rem]"
          />
        </div>
        <div className="flex flex-col gap-3 size-full">
          <CardTitle
            enTitle={enTitle}
            perTitle={perTitle}
            location="summeryCardTwo"
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
                BtnBackgroundColor="bg-white"
                className="lg:*:*:size-5 *:*:size-4 h-10"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

CartOrders.Mobile = MobileCard;
CartOrders.Desk = DeskCard;
CartOrders.Summery = SummeryCard;
CartOrders.Success = SuccessedOrderCard;

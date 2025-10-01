import CartEvents from "@/components/CartEvents";
import ImageFrame from "@/components/ImageFrame";
import PriceSection from "@/components/PriceSection";
import Table from "@/ui/Table";
import { toPersianNumbers } from "@/utils/toPersianNumbers";

function CartOrders() {
  // return <div>CartOrders</div>;
}

export default CartOrders;
function CardTitle({
  FirstClassName = "text-base",
  SecondClassName = "text-sm",
  brand,
}) {
  return (
    <div className="flex items-start justify-between size-full flex-col gap-1">
      {brand && <p className="text-text-secondary text-xs">Versace</p>}
      <span className={`text-text-primary ${FirstClassName} font-bold`}>
        Hugo Just Different
      </span>
      <span className={`text-text-primary ${SecondClassName} font-semibold`}>
        هوگو بوس جاست دیفرنت
      </span>
    </div>
  );
}

function MobileCard() {
  return (
    <div className="flex items-center justify-center p-3 gap-4 border-[0.094rem] border-stroke shadow-xs rounded-2xl w-full ">
      <div className="flex items-center justify-start gap-4 size-full">
        <div className="flex items-start justify-center h-full">
          <ImageFrame
            src="/images/perfume2.svg"
            alt="perfume"
            className="size-16"
          />
        </div>
        <div className="flex flex-col gap-3 size-full">
          <CardTitle brand />
          <div className="badge badge--secondary w-max h-6">
            {toPersianNumbers(100)} میل
          </div>
          <div className="flex items-center justify-between size-full">
            <div>
              <PriceSection offPrice={1450000} offValue={40} price={1550000} />
            </div>
            <div className="flex items-center justify-center">
              <CartEvents
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

function DeskCard() {
  return (
    <Table.Row border className="*:py-6">
      <td className="text-right">
        <div className="tdBase">
          <div className="flex items-start justify-center h-full">
            <ImageFrame
              src="/images/perfume2.svg"
              alt="perfume"
              className="size-[5.65rem]"
            />
          </div>
          <CardTitle />
        </div>
      </td>
      <td className="text-center">{toPersianNumbers(100)} میل</td>
      <td className="text-center">
        <CartEvents BtnBackgroundColor="bg-grey" strokeColor="stroke" />
      </td>
      <td className="text-center w-full">
        <PriceSection
          offPrice={1450000}
          offValue={40}
          price={1550000}
          className="w-full"
          justify="end"
        />
      </td>
    </Table.Row>
  );
}

function MobileSuccessedOrderCard() {
  return (
    <div
      className={`max-md:flex md:hidden items-center justify-between w-full max-w-xl min-w-96 p-3 gap-4 border border-stroke-2 shadow-xs rounded-2xl`}
    >
      <div className="flex items-center justify-start gap-4 size-full">
        <div className="flex items-start justify-center h-full">
          <ImageFrame
            src="/images/perfume2.svg"
            alt="perfume"
            className="size-16"
          />
        </div>
        <div className="flex flex-col gap-3 size-full">
          <CardTitle />
          <div className="flex items-center justify-between size-full">
            <div className="badge badge--secondary w-max h-6">
              {toPersianNumbers(100)} میل
            </div>
            <PriceSection offPrice={1450000} offValue={40} price={1550000} />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeskSuccessedOrderCard() {
  return (
    <div
      className={`md:flex max-md:hidden items-center justify-between w-full max-w-max min-w-96 p-4 gap-5 border-[0.094rem] border-stroke-2 shadow-xs rounded-2xl`}
    >
      <div className="flex items-start justify-center h-full">
        <ImageFrame
          src="/images/perfume2.svg"
          alt="perfume"
          className="size-24"
        />
      </div>
      <div className="flex flex-col gap-3 size-full">
        <CardTitle />
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
        <PriceSection offPrice={0} offValue={0} price={1550000} />
      </div>
    </div>
  );
}

function SummeryCard() {
  return (
    <div className="flex items-center justify-center p-3 gap-4 border-t border-stroke shadow-xs w-full ">
      <div className="flex items-center justify-start md:gap-2 lg:gap-4 size-full">
        <div className="flex items-center justify-center md:size-28 lg:size-[7.5rem] rounded-xl bg-white">
          <ImageFrame
            src="/images/perfume2.svg"
            alt="perfume"
            className="md:size-20 lg:size-[5.65rem]"
          />
        </div>
        <div className="flex flex-col gap-3 size-full">
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

          <div className="flex items-center justify-between size-full">
            <div>
              <PriceSection
                offPrice={1450000}
                offValue={0}
                price={1550000}
                priceClassName="text-xl"
                textClassName="text-[10px]"
              />
            </div>
            <div className="flex items-center justify-center">
              <CartEvents
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
CartOrders.SuccessMobile = MobileSuccessedOrderCard;
CartOrders.SuccessDesk = DeskSuccessedOrderCard;

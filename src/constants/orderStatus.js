export const orderStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  //   RETURNED: "RETURNED",
  CANCELED: "CANCELED",
};

export const statusConfig = [
  {
    id: 1,
    value: "PENDING",
    label: "pending",
    title: "در حال پردازش",
    des: "تاریخ ثبت سفارش:",
    color: "bg-blue/15",
    textColor: "text-blue",
    src: "/images/processing-icon.svg",
  },
  {
    id: 2,
    value: "PAID",
    label: "paid",
    title: "ارسال شده",
    des: "تاریخ ارسال سفارش:",
    color: "bg-green/10",
    textColor: "text-green",
    src: "/images/delivered-icon.svg",
  },
  //    {
  //     id: 3,
  //     value: "RETURNED",
  //     label: "returned",
  //     title: "مرجوعی",
  //     des:"تاریخ ارسال سفارش:",
  //     color: "bg-stroke-800/10",
  //     textColor:"text-stroke-800",
  //     src: "/images/returned-icon.svg",
  //   },
  {
    id: 4,
    value: "CANCELED",
    label: "canceled",
    title: "لغو شده",
    des: "تاریخ لغو سفارش:",
    color: "bg-red/10",
    textColor: "text-red",
    src: "/images/canceled-icon.svg",
  },
];

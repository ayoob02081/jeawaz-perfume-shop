import {
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  XCircleIcon,
  PrinterIcon,
  ExclamationCircleIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

import {
  ClockIcon as ClockSolidIcon,
  CheckCircleIcon as CheckCircleSolidIcon,
  TruckIcon as TruckSolidIcon,
  XCircleIcon as XCircleSolidIcon,
  PrinterIcon as PrinterSolidIcon,
  ExclamationCircleIcon as ExclamationCircleSolidIcon,
  ClipboardDocumentCheckIcon as ClipboardDocumentCheckSolidIcon,
} from "@heroicons/react/24/solid";

const USER_STATUS_MAP = {
  PENDING: "PENDING",
  PAID: "PENDING",

  READY_TO_PRINT: "CONFIRMED",
  PRINTED: "CONFIRMED",

  SHIPPED: "SHIPPED",

  CANCELLED: "CANCELLED",
  EXPIRED: "CANCELLED",
};

export const renderUserStatuses = (status) => {
  return USER_STATUS_MAP[status] || "PENDING";
};

export const userStatusConfig = [
  {
    id: 1,
    value: "PENDING",
    title: "در حال پردازش",
    des: "ثبت سفارش",
    color: "bg-blue/15",
    textColor: "text-blue",
    icon: ClockIcon,
    solidIcon: ClockSolidIcon,
  },
  {
    id: 2,
    value: "CONFIRMED",
    title: "تایید شده",
    des: "تایید سفارش",
    color: "bg-green/10",
    textColor: "text-green",
    icon: CheckCircleIcon,
    solidIcon: CheckCircleSolidIcon,
  },
  {
    id: 3,
    value: "SHIPPED",
    title: "ارسال شده",
    des: "ارسال سفارش",
    color: "bg-green/10",
    textColor: "text-green",
    icon: TruckIcon,
    solidIcon: TruckSolidIcon,
  },
  {
    id: 4,
    value: "CANCELLED",
    title: "لغو شده",
    des: "لغو سفارش",
    color: "bg-red/10",
    textColor: "text-red",
    icon: XCircleIcon,
    solidIcon: XCircleSolidIcon,
  },
];

export const adminStatusConfig = [
  {
    id: 1,
    title: "همه",
    des: "ثبت",
    color: "bg-primary/15",
    textColor: "text-primary",
    icon: ClockIcon,
    solidIcon: ClockSolidIcon,
  },
  {
    id: 2,
    value: "PENDING",
    title: "در حال پردازش",
    des: "ثبت سفارش",
    color: "bg-blue/15",
    textColor: "text-blue",
    icon: ClockIcon,
    solidIcon: ClockSolidIcon,
  },
  {
    id: 3,
    value: "PAID",
    title: "پرداخت شده",
    des: "پرداختن سفارش",
    color: "bg-violet-600/10",
    textColor: "text-violet-600",
    icon: CheckCircleIcon,
    solidIcon: CheckCircleSolidIcon,
  },
  {
    id: 4,
    value: "READY_TO_PRINT",
    title: "آماده چاپ",
    des: "چاپ",
    color: "bg-green/10",
    textColor: "text-green",
    icon: PrinterIcon,
    solidIcon: PrinterSolidIcon,
  },
  {
    id: 5,
    value: "PRINTED",
    title: "چاپ شده",
    des: "چاپ شدن",
    color: "bg-warning/15",
    textColor: "text-orange",
    icon: ClipboardDocumentCheckIcon,
    solidIcon: ClipboardDocumentCheckSolidIcon,
  },
  {
    id: 6,
    value: "SHIPPED",
    title: "ارسال شده",
    des: "تغییر به ارسال شده",
    color: "bg-green/10",
    textColor: "text-green",
    icon: TruckIcon,
    solidIcon: TruckSolidIcon,
  },
  {
    id: 8,
    value: "CANCELLED",
    title: "لغو شده",
    des: "حذف کردن",
    color: "bg-red/10",
    textColor: "text-red",
    icon: XCircleIcon,
    solidIcon: XCircleSolidIcon,
  },
  {
    id: 9,
    value: "EXPIRED",
    title: "منقضی شده",
    des: "انقضای سفارش",
    color: "bg-stroke-800/10",
    textColor: "text-stroke-800",
    icon: ExclamationCircleIcon,
    solidIcon: ExclamationCircleSolidIcon,
  },
];

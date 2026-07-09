"use client";

import Loading from "@/components/Loading";
import { useParams } from "next/navigation";
import CouponForm from "../../../_components/CouponForm";
import { useGetCouponById } from "@/hooks/useCoupons";

function EditCouponPage() {
  const { id } = useParams();
  const { data, isLoading } = useGetCouponById(id);
  const coupon = data || {};

  if (isLoading) return <Loading />;

  return <CouponForm couponToEdit={coupon} />;
}

export default EditCouponPage;

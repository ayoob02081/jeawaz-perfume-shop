import { fetchOrders } from "@/services/orderServices";
import { useQuery } from "@tanstack/react-query";

export const useGetAllOrdersByStatus = (status) =>
  useQuery({
    queryKey: ["orders", status],
    queryFn: () => fetchOrders(status),
    retry: false,
    refetchOnWindowFocus: true,
  });

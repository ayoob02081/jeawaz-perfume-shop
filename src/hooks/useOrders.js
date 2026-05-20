import { fetchOrders } from "@/services/orderServices";
import { useQuery } from "@tanstack/react-query";

export const useGetAllOrdersByStatus = (status) =>
  useQuery({
    queryKey: ["orders-by-status", status],
    queryFn: () => fetchOrders(status),
    retry: false,
     staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

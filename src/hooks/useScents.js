import { fetchScents } from "@/services/scentsServices";
import { useQuery } from "@tanstack/react-query";

export const useGetAllScents = () =>
  useQuery({
    queryKey: ["get-scents"],
    queryFn: fetchScents,
    retry: false,
    refetchOnWindowFocus: true,
  });

import { useMutation } from "@tanstack/react-query";

export function useMutate() {
  const { data, error, isPending, mutateAsync } = useMutation({
    mutationFn: getOtpApi,
  });
  return { data, error, isPending, mutateAsync };
}

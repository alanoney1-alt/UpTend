import { useQuery } from "@tanstack/react-query";

export function useJobStatus(jobId: string | number | null | undefined) {
  const { data, error, isLoading } = useQuery<{
    id: string;
    status: string;
    assignedHaulerId?: string;
    pickupAddress?: string;
    priceEstimate?: number;
  }>({
    queryKey: ["/api/service-requests", jobId],
    enabled: !!jobId,
    refetchInterval: 5000,
  });

  return {
    status: data?.status || "loading",
    assignedHaulerId: data?.assignedHaulerId,
    data,
    error,
    isLoading,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import type { Signal, Strategy, Settings } from "@shared/schema";

export function useSignals() {
  return useQuery({
    queryKey: ["signals"],
    queryFn: api.fetchSignals,
  });
}

export function useStrategies() {
  return useQuery({
    queryKey: ["strategies"],
    queryFn: api.fetchStrategies,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: api.fetchSettings,
  });
}

export function useBalanceHistory() {
  return useQuery({
    queryKey: ["balanceHistory"],
    queryFn: api.fetchBalanceHistory,
  });
}

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: api.fetchUser,
  });
}

export function useUpdateStrategy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Strategy> }) =>
      api.updateStrategy(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<Settings>) => api.updateSettings(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}

export function useUpdateSignalStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.updateSignalStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["signals"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type BrowserActionInput } from "@shared/routes";
import { browserStateSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useBrowserStatus() {
  return useQuery({
    queryKey: [api.browser.status.path],
    queryFn: async () => {
      const res = await fetch(api.browser.status.path);
      if (!res.ok) throw new Error("Failed to fetch status");
      return api.browser.status.responses[200].parse(await res.json());
    },
    refetchInterval: 1000, // Poll every second for updates
  });
}

export function useBrowserAction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: BrowserActionInput) => {
      const res = await fetch(api.browser.action.path, {
        method: api.browser.action.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        // Try to parse error message if available
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || "Action failed");
        } catch {
          throw new Error("Action failed");
        }
      }
      
      return api.browser.action.responses[200].parse(await res.json());
    },
    onSuccess: (newData) => {
      queryClient.setQueryData([api.browser.status.path], newData);
    },
    onError: (error) => {
      toast({
        title: "Browser Action Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useLaunchBrowser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.browser.launch.path, {
        method: api.browser.launch.method,
      });
      if (!res.ok) throw new Error("Failed to launch browser");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.browser.status.path] });
      toast({
        title: "Browser Launched",
        description: "Scout is ready for stealth browsing.",
      });
    },
  });
}

export function useStopBrowser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.browser.stop.path, {
        method: api.browser.stop.method,
      });
      if (!res.ok) throw new Error("Failed to stop browser");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.browser.status.path] });
    },
  });
}

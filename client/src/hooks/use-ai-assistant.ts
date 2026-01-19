import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { type ChatRequest } from "@shared/schema";

export function useAICommand() {
  return useMutation({
    mutationFn: async (data: ChatRequest) => {
      const res = await fetch(api.ai.command.path, {
        method: api.ai.command.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("AI command failed");
      return api.ai.command.responses[200].parse(await res.json());
    },
  });
}

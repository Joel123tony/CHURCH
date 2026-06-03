import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";

type PrayerRequest = {
  id: string;
  name?: string;
  email?: string;
  message: string;
  status: "pending" | "archived" | "completed";
  notes?: string;
};

export function PrayerRequestsManager() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["prayer-requests"],
    queryFn: () => apiFetch<PrayerRequest[]>("/api/requests")
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: Partial<PrayerRequest> & { id: string }) =>
      apiFetch(`/api/requests/${payload.id}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["prayer-requests"] });
    }
  });

  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <p className="text-sm uppercase tracking-[0.35em] text-gold/80">Prayer Requests</p>
      <h2 className="mt-3 text-3xl font-semibold">Requests and Follow-Up</h2>
      <div className="mt-6 grid gap-4">
        {(data ?? []).map((item) => (
          <article key={item.id} className="rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-gold/80">{item.status}</p>
                <h3 className="mt-2 text-lg font-semibold">{item.name ?? "Anonymous"}</h3>
                <p className="mt-2 text-sm text-white/70">{item.message}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["pending", "archived", "completed"] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => updateMutation.mutate({ id: item.id, status })}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold"
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}


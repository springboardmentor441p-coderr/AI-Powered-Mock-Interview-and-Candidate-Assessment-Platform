import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authApi, type LoginPayload, type RegisterPayload, type ChangePasswordPayload } from "@/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiError } from "@/api/client";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useMe(enabled = true) {
  const setUser = useAuthStore((s) => s.setUser);
  const isAuthed = useAuthStore((s) => Boolean(s.accessToken));
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const user = await authApi.me();
      setUser(user);
      return user;
    },
    enabled: enabled && isAuthed,
    staleTime: 60_000,
  });
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setSession({ access: data.access, refresh: data.refresh }, data.user);
    },
    onError: (error: ApiError) => {
      toast.error(error.message || "Couldn't sign in. Check your credentials.");
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onError: (error: ApiError) => {
      let msg = error.message;
      if (error.details && typeof error.details === "object") {
        const firstErr = Object.values(error.details).flat()[0];
        if (firstErr) msg = String(firstErr);
      }
      toast.error(msg || "Couldn't create your account.");
    },
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (refreshToken) {
        try {
          await authApi.logout(refreshToken);
        } catch {
          // Token may already be expired/blacklisted — logging out locally still succeeds.
        }
      }
    },
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authApi.changePassword(payload),
    onSuccess: () => toast.success("Password updated."),
    onError: (error: ApiError) => toast.error(error.message || "Couldn't change your password."),
  });
}

export function useUpdateMe() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: authApi.updateMe,
    onSuccess: (user) => {
      setUser(user);
      toast.success("Profile updated.");
    },
    onError: (error: ApiError) => toast.error(error.message || "Couldn't update your profile."),
  });
}

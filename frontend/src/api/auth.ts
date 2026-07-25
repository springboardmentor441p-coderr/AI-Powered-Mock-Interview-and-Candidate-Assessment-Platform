import { httpClient, post } from "@/api/client";
import type { LoginResponse, User } from "@/types/api";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  password_confirm: string;
  role: "candidate" | "recruiter";
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export const authApi = {
  // simplejwt's TokenObtainPairView — raw payload, not the envelope.
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const res = await httpClient.post("/auth/login/", payload);
    return res.data as LoginResponse;
  },
  async register(payload: RegisterPayload): Promise<User> {
    return post<User>("/auth/register/", payload);
  },
  async logout(refresh: string): Promise<void> {
    await httpClient.post("/auth/logout/", { refresh });
  },
  // MeView is a plain DRF generic view — raw payload, no envelope.
  async me(): Promise<User> {
    const res = await httpClient.get("/auth/me/");
    return res.data as User;
  },
  async updateMe(payload: Partial<Pick<User, "first_name" | "last_name" | "phone_number">>): Promise<User> {
    const res = await httpClient.patch("/auth/me/", payload);
    return res.data as User;
  },
  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await post("/auth/change-password/", payload);
  },
};

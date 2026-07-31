import { get, getList, post } from "@/api/client";
import type { Paginated } from "@/api/client";
import type { Resume } from "@/types/api";

export const resumesApi = {
  async list(): Promise<Paginated<Resume>> {
    return getList<Resume>("/resumes/");
  },
  async detail(resumeId: string): Promise<Resume> {
    return get<Resume>(`/resumes/${resumeId}/`);
  },
  async upload(file: File, makePrimary = true): Promise<Resume> {
    const form = new FormData();
    form.append("file", file);
    form.append("make_primary", String(makePrimary));
    return post<Resume>("/resumes/upload/", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  async reprocess(resumeId: string): Promise<void> {
    await post(`/resumes/${resumeId}/reprocess/`);
  },
  async setPrimary(resumeId: string): Promise<void> {
    await post(`/resumes/${resumeId}/set-primary/`);
  },
};

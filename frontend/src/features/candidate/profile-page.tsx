import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "react-router-dom";
import { KeyRound, UserCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth-store";
import { useChangePassword, useUpdateMe } from "@/features/auth/hooks";
import { useCandidateProfile, useUpdateCandidateProfile } from "@/features/candidate/hooks";
import { candidateProfileSchema, type CandidateProfileFormValues } from "@/features/candidate/schemas";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/features/auth/schemas";
import { EXPERIENCE_LEVELS } from "@/lib/constants";

export default function ProfilePage() {
  const [params] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const defaultTab = params.get("tab") === "security" ? "security" : "profile";

  return (
    <div>
      <PageHeader eyebrow="Green Room" title="Your profile" description="Keep your details current so interviews stay relevant." />

      <Tabs defaultValue={defaultTab} className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="profile">
            <UserCircle className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <KeyRound className="h-4 w-4" /> Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <AccountForm />
          {user?.role === "candidate" && <CandidateProfileForm />}
        </TabsContent>

        <TabsContent value="security">
          <PasswordForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AccountForm() {
  const user = useAuthStore((s) => s.user);
  const updateMe = useUpdateMe();
  const form = useForm({
    defaultValues: {
      first_name: user?.first_name ?? "",
      last_name: user?.last_name ?? "",
      phone_number: user?.phone_number ?? "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>{user?.email}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => updateMe.mutate(values))}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">First name</label>
              <Input {...form.register("first_name")} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Last name</label>
              <Input {...form.register("last_name")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone number</label>
            <Input {...form.register("phone_number")} placeholder="Optional" />
          </div>
          <Button type="submit" disabled={updateMe.isPending}>
            {updateMe.isPending && <Spinner />}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function CandidateProfileForm() {
  const { data: profile } = useCandidateProfile();
  const updateProfile = useUpdateCandidateProfile();

  const form = useForm<CandidateProfileFormValues>({
    resolver: zodResolver(candidateProfileSchema),
    values: {
      headline: profile?.headline ?? "",
      target_role: profile?.target_role ?? "",
      experience_level: profile?.experience_level ?? "",
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview preferences</CardTitle>
        <CardDescription>Helps tailor questions to your career stage and goals.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => updateProfile.mutate(values))}>
            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headline</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Backend Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="target_role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target role</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Staff Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="experience_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Experience level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || undefined}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPERIENCE_LEVELS.map((lvl) => (
                        <SelectItem key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending && <Spinner />}
              Save preferences
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const changePassword = useChangePassword();
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { old_password: "", new_password: "", confirm_password: "" },
  });

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) =>
              changePassword.mutate(
                { old_password: values.old_password, new_password: values.new_password },
                { onSuccess: () => form.reset() },
              ),
            )}
          >
            <FormField
              control={form.control}
              name="old_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm new password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending && <Spinner />}
              Update password
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

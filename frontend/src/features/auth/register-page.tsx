import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { registerSchema, type RegisterFormValues } from "@/features/auth/schemas";
import { useLogin, useRegister } from "@/features/auth/hooks";
import type { RegisterPayload } from "@/api/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const login = useLogin();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      role: "candidate",
      password: "",
      password_confirm: "",
    },
  });

  function onSubmit(values: RegisterFormValues) {
    const payload: RegisterPayload = {
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      role: values.role,
      password: values.password,
      password_confirm: values.password_confirm,
    };

    registerMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Account created — signing you in…");
        login.mutate(
          { email: payload.email, password: payload.password },
          { onSuccess: () => navigate("/app", { replace: true }) },
        );
      },
      onError: (err) => {
        if (err.details && typeof err.details === "object" && !Array.isArray(err.details)) {
          for (const [field, msgs] of Object.entries(err.details)) {
            const message = Array.isArray(msgs) ? msgs.join(" ") : String(msgs);
            if (field in values) {
              form.setError(field as keyof RegisterFormValues, { message });
            }
          }
        }
      },
    });
  }

  const pending = registerMutation.isPending || login.isPending;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-medium text-foreground">Get on the roster</h2>
        <p className="text-sm text-muted-foreground">Create an account to start practicing or hiring.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl>
                    <Input placeholder="Ada" autoComplete="given-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl>
                    <Input placeholder="Lovelace" autoComplete="family-name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="you@company.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>I am a</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an account type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="candidate">Candidate — practicing interviews</SelectItem>
                    <SelectItem value="recruiter">Recruiter — reviewing candidates</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="At least 8 characters" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password_confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Repeat your password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" size="lg" disabled={pending}>
            {pending && <Spinner />}
            Create account
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

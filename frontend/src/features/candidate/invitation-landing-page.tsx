import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Clock, Disc3, Mail, Play, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { interviewsApi } from "@/api/interviews";
import { useAuthStore } from "@/stores/auth-store";
import { formatDateTime, titleCase } from "@/lib/utils";
import type { PublicInvitation } from "@/types/api";

export default function InvitationLandingPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, accessToken } = useAuthStore();

  const [invitation, setInvitation] = useState<PublicInvitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("No invitation token provided.");
      setLoading(false);
      return;
    }

    interviewsApi
      .verifyInvitation(token)
      .then((data) => {
        setInvitation(data);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Could not verify your invitation. It may have expired or been revoked.";
        setError(msg);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  async function handleAccept() {
    if (!invitation) return;
    setAccepting(true);
    try {
      const session = await interviewsApi.acceptInvitation(invitation.id);
      navigate(`/room/${session.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Could not accept invitation. Please ensure you are logged into the invited account.";
      setError(msg);
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="font-display text-lg text-foreground">Verifying interview invitation…</p>
          <p className="text-sm text-muted-foreground">Checking link security and interview readiness</p>
        </div>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="max-w-md border-border/60 bg-card shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle className="font-display text-xl text-foreground" data-testid="invitation-error-title">Invitation Unavailable</CardTitle>
            <CardDescription className="text-muted-foreground" data-testid="invitation-error-desc">
              {error || "This interview invitation is invalid, expired, or has been revoked."}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isExpired = invitation.is_expired || invitation.status === "expired";
  const isRevoked = invitation.status === "revoked";
  const isCandidateLoggedIn = Boolean(accessToken && user?.role === "candidate");
  const isAcceptedWithSession = Boolean(invitation.session_id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border/40 px-6 py-4">
        <div className="flex items-center gap-2.5">
          <Disc3 className="h-5 w-5 text-primary animate-reel-spin" />
          <span className="font-display text-base font-semibold text-foreground">SmartHire AI</span>
        </div>
        {user ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>Signed in as <strong className="text-foreground">{user.email}</strong></span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
          </div>
        )}
      </header>

      <main className="flex flex-1 items-center justify-center p-6">
        <Card className="w-full max-w-xl border-border/60 bg-card/90 shadow-2xl backdrop-blur">
          <CardHeader className="space-y-3 pb-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="gap-1 border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="h-3.5 w-3.5" /> AI Interview Invitation
              </Badge>
              {isExpired ? (
                <Badge variant="outline" className="border-destructive text-destructive">
                  Expired
                </Badge>
              ) : isRevoked ? (
                <Badge variant="outline" className="border-destructive text-destructive">
                  Revoked
                </Badge>
              ) : isAcceptedWithSession ? (
                <Badge variant="outline" className="border-emerald-500/40 text-emerald-400">
                  Accepted
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-500/40 text-amber-400">
                  Ready to Start
                </Badge>
              )}
            </div>

            <CardTitle className="font-display text-2xl text-foreground">
              {invitation.template ? invitation.template.title : "Technical Mock Interview"}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              You have been invited by <strong className="text-foreground">{invitation.recruiter_name}</strong> to complete an AI-powered voice interview.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {invitation.template && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{titleCase(invitation.template.interview_type)}</Badge>
                <Badge variant="outline">{titleCase(invitation.template.difficulty)}</Badge>
                <span className="text-sm text-muted-foreground">
                  Domain: <span className="text-foreground">{invitation.template.domain}</span>
                </span>
              </div>
            )}

            {invitation.message && (
              <div className="rounded-lg border border-border bg-secondary/20 p-4 text-sm text-foreground/90 italic">
                "{invitation.message}"
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-lg border border-border/50 bg-secondary/10 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>Invited: <strong className="text-foreground">{invitation.candidate_email}</strong></span>
              </div>
              {invitation.expires_at && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-400" />
                  <span>Expires: {formatDateTime(invitation.expires_at)}</span>
                </div>
              )}
            </div>

            {isExpired && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" data-testid="invitation-expired-alert">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">This invitation has expired</p>
                  <p className="text-xs text-destructive/80 mt-1">
                    Please contact {invitation.recruiter_name} to request a new invitation link.
                  </p>
                </div>
              </div>
            )}

            {isRevoked && (
              <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">This invitation was revoked</p>
                  <p className="text-xs text-destructive/80 mt-1">
                    The recruiter has cancelled this interview invitation.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            {!isExpired && !isRevoked && (
              <>
                {isCandidateLoggedIn ? (
                  isAcceptedWithSession ? (
                    <Button
                      size="lg"
                      onClick={() => navigate(`/room/${invitation.session_id}`)}
                      data-testid="resume-interview-btn"
                    >
                      <Play className="h-4 w-4" />
                      Resume Interview
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={handleAccept}
                      disabled={accepting}
                      data-testid="accept-invitation-btn"
                    >
                      {accepting ? <Spinner /> : <Play className="h-4 w-4" />}
                      Accept & Begin Interview
                    </Button>
                  )
                ) : (
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-muted-foreground">
                      Please sign in to your candidate account to proceed.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" asChild>
                        <Link to={`/login?redirect=/invite/${invitation.token}`}>
                          Log In
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link to={`/register?email=${encodeURIComponent(invitation.candidate_email)}&redirect=/invite/${invitation.token}`}>
                          Register <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

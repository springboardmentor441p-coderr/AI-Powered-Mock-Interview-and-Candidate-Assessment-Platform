import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Mic,
  History,
  UserCircle,
  Gauge,
  ListOrdered,
  ClipboardList,
  Radar,
  BellRing,
  Send,
  Inbox,
} from "lucide-react";
import type { Role } from "@/types/api";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export const CANDIDATE_NAV: NavItem[] = [
  { label: "Dashboard", to: "/app", icon: LayoutDashboard, end: true },
  { label: "Résumés", to: "/app/resumes", icon: FileText },
  { label: "New Interview", to: "/app/interviews/new", icon: Mic },
  { label: "Session History", to: "/app/interviews", icon: History },
  { label: "Invitations", to: "/app/invitations", icon: Inbox },
  { label: "Profile", to: "/app/profile", icon: UserCircle },
  { label: "Notifications", to: "/notifications", icon: BellRing },
];

export const RECRUITER_NAV: NavItem[] = [
  { label: "Dashboard", to: "/app", icon: Gauge, end: true },
  { label: "Rankings", to: "/app/rankings", icon: ListOrdered },
  { label: "Templates", to: "/app/templates", icon: ClipboardList },
  { label: "Send Interview", to: "/app/send-interview", icon: Send },
  { label: "Interview History", to: "/app/interview-history", icon: History },
  { label: "Brief Review", to: "/app/brief-review", icon: Radar },
  { label: "Notifications", to: "/notifications", icon: BellRing },
];

export function navForRole(role: Role | undefined): NavItem[] {
  if (role === "candidate") return CANDIDATE_NAV;
  if (role === "recruiter" || role === "admin") return RECRUITER_NAV;
  return [];
}
import { NavLink } from "react-router-dom";
import { Disc3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { navForRole } from "@/components/layout/nav-config";
import { useAuthStore } from "@/stores/auth-store";

export function Sidebar() {
  const role = useAuthStore((s) => s.user?.role);
  const items = navForRole(role);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card/60 md:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <Disc3 className="h-6 w-6 text-primary animate-reel-spin" />
        <span className="font-display text-lg font-medium tracking-tight text-foreground">AI Interviewr</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground",
                isActive && "bg-primary/10 text-primary",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-border px-6 py-4">
        <p className="font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
          On Air Studio · v1.0
        </p>
      </div>
    </aside>
  );
}

import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Plus, Bell, Settings } from "lucide-react";

export function TopNavbar() {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-card shrink-0 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <span className="text-lg font-bold tracking-tight text-primary">Pergola</span>
        <nav className="flex items-center gap-1">
          {[
            { to: "/", label: "Home" },
            { to: "/configurator", label: "3D Configurator" },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className="px-3 py-1.5 text-sm font-medium text-muted-foreground rounded-md hover:text-foreground hover:bg-muted/50 transition-colors"
              activeClassName="text-primary font-semibold"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Create
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

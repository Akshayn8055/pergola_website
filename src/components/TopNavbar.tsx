import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Mail, Plus } from "lucide-react";
import { BUSINESS_CONFIG } from "@/lib/businessConfig";

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
        <Button asChild size="sm" className="gap-2">
          <Link to={`/configurator?new=${Date.now()}`}>
            <Plus className="h-4 w-4" /> New Design
          </Link>
        </Button>
        <Button asChild variant="ghost" size="icon" className="h-9 w-9" title="Contact">
          <a href={`mailto:${BUSINESS_CONFIG.contactEmail}`}>
            <Mail className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </header>
  );
}

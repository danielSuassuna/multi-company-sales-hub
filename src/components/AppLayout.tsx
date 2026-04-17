import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, ScrollText, BookOpen, Package, Boxes,
  Tags, Wallet, Building2, LogOut, Receipt, Wheat
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "gerente", "operador"] },
  { to: "/pdv", label: "PDV", icon: ShoppingCart, roles: ["admin", "gerente", "operador"] },
  { to: "/pedidos", label: "Pedidos", icon: Receipt, roles: ["admin", "gerente", "operador"] },
  { to: "/cardapio", label: "Cardápio", icon: BookOpen, roles: ["admin", "gerente"] },
  { to: "/produtos", label: "Produtos", icon: Package, roles: ["admin", "gerente"] },
  { to: "/materias", label: "Matéria-Prima", icon: Wheat, roles: ["admin", "gerente"] },
  { to: "/estoque", label: "Estoque", icon: Boxes, roles: ["admin", "gerente"] },
  { to: "/categorias", label: "Categorias", icon: Tags, roles: ["admin", "gerente"] },
  { to: "/gastos", label: "Gastos", icon: Wallet, roles: ["admin", "gerente"] },
  { to: "/empresa", label: "Empresa", icon: Building2, roles: ["admin"] },
] as const;

export const AppLayout = () => {
  const { signOut, empresaNome, user, roles } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const items = nav.filter((n) => n.roles.some((r) => roles.includes(r as never)));

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Empresa</div>
          <div className="font-semibold text-sidebar-foreground truncate">{empresaNome ?? "—"}</div>
        </div>
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                )
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="text-xs text-muted-foreground truncate mb-2">{user?.email}</div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-semibold">{empresaNome ?? "Sistema"}</div>
          <Button size="sm" variant="ghost" onClick={handleLogout}><LogOut className="h-4 w-4" /></Button>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">
          <Outlet />
        </main>
        <nav className="md:hidden flex items-center gap-1 overflow-x-auto px-2 py-2 border-t border-border bg-sidebar">
          {items.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-md text-[10px] whitespace-nowrap",
                  isActive ? "text-primary" : "text-muted-foreground"
                )
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};

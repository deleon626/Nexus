import { Link, useLocation } from "react-router";
import { useNavItems } from "./NavItem";
import { cn } from "@/lib/utils";

export default function BottomTabBar() {
  const navItems = useNavItems();
  const { pathname } = useLocation();

  // No nav items? Return null (no-role users see sidebar message instead)
  if (navItems.length === 0) {
    return null;
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-background z-40">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 text-xs font-medium",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

import { useNavItems, useUserIdentity, UserAvatar, NavItem } from "./NavItem";
import { LogOut } from "lucide-react";
import { useClerk } from "@clerk/clerk-react";
import { isDevModeWithoutCredentials } from "@/context/AuthContext";

export default function Sidebar() {
  const navItems = useNavItems();
  const user = useUserIdentity();
  const { signOut } = useClerk();

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-background shrink-0">
      {/* App logo/title */}
      <div className="px-4 py-4 border-b">
        <h1 className="text-lg font-bold">Nexus QC Forms</h1>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {navItems.length === 0 ? (
          <p className="px-3 text-sm text-muted-foreground">
            Contact your admin to get access
          </p>
        ) : (
          navItems.map((item) => (
            <NavItem key={item.path} path={item.path} label={item.label} icon={item.icon} />
          ))
        )}
      </nav>

      {/* User identity footer */}
      <div className="mt-auto border-t py-4 px-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <UserAvatar imageUrl={user.imageUrl} name={user.name} />
          <span className="flex-1 truncate">{user.name}</span>
          {!isDevModeWithoutCredentials && (
            <button
              onClick={() => signOut({ redirectUrl: "/sign-in" })}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

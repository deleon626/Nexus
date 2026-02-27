import { Link, useLocation } from "react-router";
import { LayoutGrid, ClipboardList, CheckSquare, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole, isDevModeWithoutCredentials } from "@/context/AuthContext";
import { useUser } from "@clerk/clerk-react";

// Nav configuration
interface NavItemConfig {
  label: string;
  path: string;
  icon: LucideIcon;
  requiresAdmin?: boolean;
  requiresWorker?: boolean;
  requiresReviewer?: boolean;
}

const NAV_CONFIG: NavItemConfig[] = [
  { label: "Builder", path: "/admin/builder", icon: LayoutGrid, requiresAdmin: true },
  { label: "Fill Forms", path: "/worker/forms", icon: ClipboardList, requiresWorker: true },
  { label: "Reviews", path: "/reviewer/dashboard", icon: CheckSquare, requiresReviewer: true },
];

// NavItem component
interface NavItemProps {
  path: string;
  label: string;
  icon: LucideIcon;
}

export function NavItem({ path, label, icon: Icon }: NavItemProps) {
  const { pathname } = useLocation();
  const isActive = pathname === path || pathname.startsWith(path + "/");

  return (
    <Link
      to={path}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

// Hook to get filtered nav items based on user role
export function useNavItems(): NavItemConfig[] {
  const { isAdmin, isWorker, isReviewer } = useRole();

  // In dev mode, show all items
  if (isDevModeWithoutCredentials) {
    return NAV_CONFIG;
  }

  // Filter based on user roles
  return NAV_CONFIG.filter((item) => {
    if (item.requiresAdmin && !isAdmin) return false;
    if (item.requiresWorker && !isWorker) return false;
    if (item.requiresReviewer && !isReviewer) return false;
    return true;
  });
}

// Hook to get user identity (with dev mode guard)
export interface UserIdentity {
  name: string;
  imageUrl: string | null;
}

export function useUserIdentity(): UserIdentity {
  // In dev mode without credentials, return mock identity
  if (isDevModeWithoutCredentials) {
    return { name: "Dev User", imageUrl: null };
  }

  // Use Clerk's useUser hook
  const { user } = useUser();

  return {
    name: [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User",
    imageUrl: user?.imageUrl ?? null,
  };
}

// UserAvatar component
interface UserAvatarProps {
  imageUrl: string | null;
  name: string;
  size?: "sm" | "md";
}

export function UserAvatar({ imageUrl, name, size = "md" }: UserAvatarProps) {
  const sizeClass = size === "sm" ? "w-7 h-7" : "w-8 h-8";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  // Get initials: first char of each word, max 2
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="Avatar"
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${textSize} rounded-full bg-muted flex items-center justify-center font-medium`}
    >
      {initials || "?"}
    </div>
  );
}

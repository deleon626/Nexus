import { useLocation } from "react-router";
import { useUserIdentity, UserAvatar } from "./NavItem";

export default function MobileTopBar() {
  const { pathname } = useLocation();
  const user = useUserIdentity();

  // Derive section name from pathname
  const getSectionName = (path: string): string => {
    if (path.startsWith("/admin/builder")) return "Builder";
    if (path.startsWith("/worker/forms")) return "Fill Forms";
    if (path.startsWith("/reviewer/dashboard")) return "Reviews";
    return "Nexus QC Forms";
  };

  const sectionName = getSectionName(pathname);

  return (
    <header className="md:hidden border-b bg-background px-4 h-12 flex items-center justify-between shrink-0">
      <span className="font-semibold text-sm">{sectionName}</span>
      <UserAvatar imageUrl={user.imageUrl} name={user.name} size="sm" />
    </header>
  );
}

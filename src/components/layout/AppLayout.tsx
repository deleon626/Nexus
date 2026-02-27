import { Outlet } from "react-router";
import Sidebar from "./Sidebar";
import MobileTopBar from "./MobileTopBar";
import BottomTabBar from "./BottomTabBar";
import SyncIndicator from "@/components/sync/SyncIndicator";

// Safe wrapper for SyncIndicator (may throw in dev mode)
function SafeSyncIndicator() {
  try {
    return <SyncIndicator />;
  } catch {
    return null;
  }
}

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile top bar */}
        <MobileTopBar />

        {/* Desktop top header */}
        <header className="hidden md:flex border-b bg-background px-6 py-3 items-center justify-between shrink-0">
          <h1 className="text-xl font-bold">Nexus QC Forms</h1>
          <SafeSyncIndicator />
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile bottom tab bar */}
        <BottomTabBar />
      </div>
    </div>
  );
}

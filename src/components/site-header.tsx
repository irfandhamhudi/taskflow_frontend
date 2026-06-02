"use client"

import { SidebarTrigger } from "../components/ui/sidebar"
import { Separator } from "../components/ui/separator"
import { SiteBreadcrumb } from "../components/site-breadcrumb"
import { NotificationDropdown } from "./notifications/notification-dropdown"
import { ModeToggle } from "./mode-toggle"
import { CommandMenu } from "./command-menu"
import { useChatStore } from "../store/useChatStore"
import { MessageCircle } from "lucide-react"
import { Button } from "./ui/button"
import { useAuth } from "../context/AuthContext"

export function SiteHeader() {
  const { conversations, setIsOpen } = useChatStore();
  const { user } = useAuth();

  const totalUnread = conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
  const invitationCount = conversations.filter(conv => !conv.acceptedBy?.includes(user?._id || '')).length;
  const totalDisplayCount = totalUnread + invitationCount;

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-6 shadow-none">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="mr-2 h-4 hidden md:block" />
      <SiteBreadcrumb className="hidden md:block" />

      <div className="ml-auto flex items-center">
        <CommandMenu />

      </div>
      <div className="flex gap-2">
        <ModeToggle />
        <NotificationDropdown />
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setIsOpen(true)}
          title="Messages"
        >
          <MessageCircle className="h-5 w-5" />
          {totalDisplayCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border border-background shadow-sm">
              {totalDisplayCount > 99 ? '99+' : totalDisplayCount}
            </span>
          )}
        </Button>
      </div>
    </header>
  )
}

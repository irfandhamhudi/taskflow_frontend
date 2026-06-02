"use client";

import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Calendar, GalleryVerticalEnd, Zap, Folder, Trash2 } from "lucide-react";

import { NavMain } from "../components/nav-main";
import { NavProjects } from "../components/nav-projects";
import { NavUser } from "../components/nav-user";
import { useChatStore } from "../store/useChatStore";
import { WorkspaceSwitcher } from "../components/workspace-switcher";
import { useProjectSocket } from "../hooks/use-ProjectSocket";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "../components/ui/sidebar";

// import { TeamSwitcher } from "../components/team-switcher";
// import { Command } from "./ui/command";

const data = {
  teams: [
    { name: "Acme Inc", logo: GalleryVerticalEnd, plan: "Enterprise" },
    { name: "Acme Corp.", logo: GalleryVerticalEnd, plan: "Startup" },
    { name: "Evil Corp.", logo: GalleryVerticalEnd, plan: "Free" },
  ],
  navMain: [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "Calendar", url: "/calendar", icon: Calendar },
    { title: "Projects", url: "/projects", icon: Folder },
    { title: "Trash", url: "/trash", icon: Trash2 },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const pathname = location.pathname;

  const { setIsOpen } = useChatStore();

  // Real-time project updates
  useProjectSocket();

  // Active state untuk nav main
  const navMain = [
    ...data.navMain.map((item) => ({
      ...item,
      isActive: pathname === item.url,
    })),
  ];

  return (
    <Sidebar collapsible="icon" {...props} variant="floating">
      <SidebarHeader className="group-data-[collapsible=icon]:p-4 ">
        <WorkspaceSwitcher />
      </SidebarHeader>
      <SidebarSeparator className="mx-0" />
      <SidebarContent>
        <NavMain items={navMain} />
        <NavProjects />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}


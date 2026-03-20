import React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Settings, Video } from "lucide-react";
import { ThemeToggle } from "../themeProvider/theme-toggle";
import { Link } from "react-router";


const AppSidebar: React.FC = () => {
  return (
    <Sidebar className="border-r bg-sidebar">
      <SidebarHeader>
        <div className="p-4 flex items-center justify-between">
          <h1 className="m-0 text-xl font-bold --sidebar-primary ">Rexer</h1>
          <ThemeToggle />
        </div>
      </SidebarHeader>
      <SidebarContent className="p-6">
        <SidebarMenu className="gap-8">
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/clips" className="flex items-center gap-2 p-0!">
                <Video className="h-4 w-4" />
                <span className="text-2xl">Клипы</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/settings" className="flex items-center gap-2 p-0!">
                <Settings className="h-4 w-4" />
                <span className="text-2xl">Настройки</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar
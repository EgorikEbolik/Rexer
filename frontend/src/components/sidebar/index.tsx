import React from "react";
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { Settings, Video } from "lucide-react";
import { ThemeToggle } from "../themeProvider/theme-toggle";
import { Link } from "react-router";

const COLLAPSE_BREAKPOINT = 900;

const AppSidebarInner: React.FC = () => {
    const { setOpen, state } = useSidebar();
    const isCollapsed = state === "collapsed";

    React.useEffect(() => {
        const update = () => {
            setOpen(window.innerWidth >= COLLAPSE_BREAKPOINT);
        };

        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, [setOpen]);

    return (
        <Sidebar className="border-r bg-sidebar" collapsible="icon">
            <SidebarHeader draggable="false" unselectable="on">
                <div className="p-0 lg:p-4 flex items-center justify-between overflow-hidden">
                    <h1 className="m-0 text-xl font-bold truncate group-data-[collapsible=icon]:hidden">
                        Rexer
                    </h1>
                    <ThemeToggle />
                </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
                <SidebarMenu className="gap-2">
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            draggable={false}
                            className={`${isCollapsed ? "" : "p-10! pl-2!"}`}
                        >
                            <Link
                                to="/clips"
                                className={`flex gap-2 ${isCollapsed ? "justify-center p-0!" : "items-center pl-2"}`}
                            >
                                <Video
                                    className={
                                        isCollapsed ? "size-6!" : "size-4!"
                                    }
                                />
                                {!isCollapsed && (
                                    <span
                                        className="text-2xl"
                                        unselectable="on"
                                        draggable="false"
                                    >
                                        Клипы
                                    </span>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            draggable={false}
                            className={`${isCollapsed ? "" : "p-10! pl-2!"}`}
                        >
                            <Link
                                to="/settings"
                                className={`flex gap-2 ${isCollapsed ? "justify-center p-0!" : "items-center pl-2"}`}
                            >
                                <Settings
                                    className={
                                        isCollapsed ? "size-6!" : "size-4!"
                                    }
                                />
                                {!isCollapsed && (
                                    <span
                                        className="text-2xl"
                                        unselectable="on"
                                        draggable="false"
                                    >
                                        Настройки
                                    </span>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
        </Sidebar>
    );
};

const AppSidebar: React.FC = () => <AppSidebarInner />;

export default AppSidebar;

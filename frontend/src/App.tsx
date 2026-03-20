import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "./components/sidebar"
import { ThemeProvider } from './components/themeProvider/index.tsx';
import { Outlet } from "react-router"
import React from "react";

const App: React.FC = () => {

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <SidebarProvider onContextMenu={handleContextMenu} defaultOpen={true}>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6 min-w-0">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
};

export default App
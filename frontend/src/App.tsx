import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "./components/sidebar"
import { ThemeProvider } from './components/themeProvider/index.tsx';
import { Outlet } from "react-router"


const App: React.FC = () => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  );
};

export default App

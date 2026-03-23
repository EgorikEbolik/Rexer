import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "./components/sidebar"
import { ThemeProvider } from './components/themeProvider/index.tsx';
import { Outlet } from "react-router"
import React from "react";
import { Progress } from "@/components/ui/progress";
import { type Clip } from "@/components/videoGrid/videoCard";
import { Button } from "./components/ui/button.tsx";

const App: React.FC = () => {
  const [ffmpegStatus, setFfmpegStatus] = React.useState<null | "downloading" | "extracting" | "ready" | "error">(null)
  const [ffmpegProgress, setFfmpegProgress] = React.useState(0)
  const [clips, setClips] = React.useState<Clip[]>([])

  const onNewClip = React.useCallback((clip: Clip) => {
    setClips(prev => [clip, ...prev])
  }, [])

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  React.useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout>;

    const connectWebSocket = () => {
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        ws.close();
      }
      ws = new WebSocket("ws://localhost:8765/ws");

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);

          if (data.type === "new_clip") {
            onNewClip(data.clip)
          }
          if (data.type === "ffmpeg_progress") {
            setFfmpegStatus(data.stage)
            setFfmpegProgress(data.percent)
          }
          if (data.type === "ffmpeg_ready") {
            setFfmpegStatus("ready")
          }
          if (data.type === "ffmpeg_error") {
            setFfmpegStatus("error")
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message", err);
        }
      };

      ws.onclose = () => {
        reconnectTimer = setTimeout(connectWebSocket, 3000);
      };
    };

    connectWebSocket();
    return () => {
      clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, [onNewClip]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <SidebarProvider onContextMenu={handleContextMenu} defaultOpen={true}>
        <div className="flex min-h-screen w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none">
          <AppSidebar />
          <main className="flex-1 p-6 min-w-0">
            <Outlet context={{ onNewClip, clips, setClips }} />
          </main>
        </div>

        {ffmpegStatus && (
          <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-card border border-border rounded-xl p-8 w-full max-w-sm shadow-2xl flex flex-col gap-5">

              {ffmpegStatus === "error" && (
                <>
                  <p className="text-destructive font-semibold text-center">Ошибка загрузки ffmpeg</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Скачайте ffmpeg вручную и поместите ffmpeg.exe в папку bin рядом с Rexer.exe
                  </p>
                </>
              )}

              {(ffmpegStatus === "downloading" || ffmpegStatus === "extracting") && (
                <>
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">Загрузка ffmpeg</p>
                    <p className="text-sm text-muted-foreground">
                      {ffmpegStatus === "extracting"
                        ? "Распаковка архива..."
                        : `Скачивание... ${ffmpegProgress}%`}
                    </p>
                  </div>
                  <Progress value={ffmpegStatus === "downloading" ? ffmpegProgress : undefined} />                            <p className="text-xs text-muted-foreground mt-2!">
                    Подсказка: программа ffmpeg позволяет преобразовывать видео, получать из них изображения и многое другое...
                  </p>

                </>
              )}
              {
                ffmpegStatus === "ready" && (
                  <>
                    <div className="flex flex-col gap-10">
                      <h2 className="font-semibold text-center">✅ ffmpeg загружен</h2>
                      <Button size="lg" className="gap-2 shadow-lg" onClick={() => setFfmpegStatus(null)}>Закрыть</Button>
                    </div>
                  </>
                )
              }
            </div>
          </div>
        )}
      </SidebarProvider>
    </ThemeProvider>
  );
};

export default App
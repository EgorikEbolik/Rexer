import React, { useEffect, useCallback } from "react";
import { Film, Loader2 } from "lucide-react";
import VideoCard, { type Clip } from "@/components/videoGrid/videoCard";
import PlayerModal from "@/components/videoGrid/player";
import { useOutletContext } from "react-router";

type OutletContext = {
  clips: Clip[]
  setClips: React.Dispatch<React.SetStateAction<Clip[]>>
  onNewClip: (clip: Clip) => void
}

const ClipsPage: React.FC = () => {
  const API = "http://localhost:8765";

  const { clips, setClips } = useOutletContext<OutletContext>()
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Clip | null>(null);

  useEffect(() => {
    const fetchClips = async () => {
      try {
        const response = await fetch(`${API}/clips`);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        setClips(data);
        console.log("Новый клип:", data)
      } catch (error) {
        console.error("Ошибка загрузки клипов:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClips();
  }, [API, setClips]);

  const closeModal = useCallback(() => setSelected(null), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Загрузка клипов...
      </div>
    );
  }

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <Film className="h-12 w-12 opacity-20" />
        <p>Клипов пока нет</p>
        <p className="text-xs">Сохраните реплей в OBS - он появится здесь</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Клипы</h1>
        <span className="text-sm text-muted-foreground">{clips.length} клипов</span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {clips.map((clip) => (
          <VideoCard
            key={clip.path}
            api={API}
            clip={clip}
            onClick={() => setSelected(clip)}
          />
        ))}
      </div>

      {selected && (
        <PlayerModal api={API} clip={selected} onClose={closeModal} />
      )}
    </div>
  );
};

export default ClipsPage;
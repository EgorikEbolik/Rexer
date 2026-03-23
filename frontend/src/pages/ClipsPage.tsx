import React, { useEffect, useCallback, forwardRef } from "react";
import { Film, Loader2, SortAsc, SortDesc } from "lucide-react";
import VideoCard, { type Clip } from "@/components/videoGrid/videoCard";
import PlayerModal from "@/components/videoGrid/player";
import { useOutletContext } from "react-router";
import { VirtuosoGrid, type VirtuosoGridProps } from "react-virtuoso"
import { Button } from "@/components/ui/button";

import { useSettings } from "@/hooks/useSettings";

type OutletContext = {
  clips: Clip[]
  setClips: React.Dispatch<React.SetStateAction<Clip[]>>
  onNewClip: (clip: Clip) => void
}

const gridComponents: VirtuosoGridProps<undefined, undefined>['components'] = {
  List: forwardRef(({ children, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {children}
    </div>
  )),
  Item: ({ children, ...props }) => (
    <div{...props}>
      {children}
    </div>
  ),
}

const ClipsPage: React.FC = () => {
  const API = "http://localhost:8765";

  const { clips, setClips } = useOutletContext<OutletContext>()
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<Clip | null>(null);
  const [sort, setSort] = React.useState<"desc" | "asc">("desc");

  const { settings: settingsData } = useSettings();

  const formatter = new Intl.PluralRules("ru");
  const forms = { one: "клип", few: "клипа", many: "клипов", zero: "клипов", two: "клипа", other: "клипов" }
  const pluralize = (count: number) => {
    const form = formatter.select(count)
    const word = forms[form]
    return String(count + " " + word)
  }
  useEffect(() => {
    const fetchClips = async () => {
      try {
        const response = await fetch(`${API}/clips`);
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}`);
        }
        const data = await response.json();
        const sorted_data = sort === "desc" ? data.toSorted((a: Clip, b: Clip) => b["created_at"] - a["created_at"]) : data.toSorted((a: Clip, b: Clip) => a["created_at"] - b["created_at"]);
        setClips(sorted_data)
        console.log("Новый клип:", data)
      } catch (error) {
        console.error("Ошибка загрузки клипов:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchClips();
  }, [API, setClips, sort]);

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

    <div className="p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex-4">Клипы</h1>
        <div className="flex flex-col items-center">
          <span className="text-sm text-muted-foreground mb-2">{pluralize(clips.length)}</span>
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground mr-2 min-w-25">{sort === "asc" ? "По возрастанию" : "По убыванию"}</span>
            {sort === "desc" ? (<Button size="icon" onClick={() => { setSort("asc") }}><SortDesc /></Button>) : (<Button size="icon" onClick={() => { setSort("desc") }}><SortAsc /></Button>)}
          </div>
        </div>
      </div>

      <VirtuosoGrid
        // style={{ height: "calc(100vh - 280px)" }}
        className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1"
        totalCount={clips.length}
        components={gridComponents}
        increaseViewportBy={{ top: 800, bottom: 600 }}
        itemContent={(index) =>
          <VideoCard
            key={clips[index].path}
            api={API}
            clip={clips[index]}
            hoverPlaybackEnabled={settingsData?.hover_playback ?? true}
            onClick={() => setSelected(clips[index])}
          />}

      />
      {
        selected && (
          <PlayerModal api={API} clip={selected} onClose={closeModal} />
        )
      }
    </div >
  );
};

export default ClipsPage;
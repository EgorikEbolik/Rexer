import React, { useCallback, forwardRef } from "react";
import { Film, Loader2, SortAsc, SortDesc } from "lucide-react";
import VideoCard, { type Clip } from "@/components/videoGrid/videoCard";
import PlayerModal from "@/components/videoGrid/player";
import { VirtuosoGrid, type VirtuosoGridProps } from "react-virtuoso";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks/useSettings";
import { useClips } from "@/hooks/useClips";

const gridComponents: VirtuosoGridProps<undefined, undefined>["components"] = {
    List: forwardRef(({ children, ...props }, ref) => (
        <div
            ref={ref}
            {...props}
            className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
        >
            {children}
        </div>
    )),
    Item: ({ children, ...props }) => <div {...props}>{children}</div>,
};

const ClipsPage: React.FC = () => {
    const API = "http://localhost:8765";

    const { clips, loading, mutateClips } = useClips();
    const [selected, setSelected] = React.useState<Clip | null>(null);
    const [sort, setSort] = React.useState<"desc" | "asc">("desc");
    const { settings: settingsData } = useSettings();

    const sortedClips = React.useMemo(
        () =>
            [...clips].sort((a, b) =>
                sort === "desc"
                    ? b.created_at - a.created_at
                    : a.created_at - b.created_at,
            ),
        [clips, sort],
    );

    const formatter = new Intl.PluralRules("ru");
    const forms = {
        one: "клип",
        few: "клипа",
        many: "клипов",
        zero: "клипов",
        two: "клипа",
        other: "клипов",
    };
    const pluralize = (count: number) =>
        `${count} ${forms[formatter.select(count)]}`;

    const closeModal = useCallback(() => setSelected(null), []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Загрузка клипов...
            </div>
        );
    }

    if (sortedClips.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                <Film className="h-12 w-12 opacity-20" />
                <p>Клипов пока нет</p>
                <p className="text-xs">
                    Сохраните реплей в OBS - он появится здесь
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 flex flex-col h-full pb-0! page-enter">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold flex-4">Клипы</h1>
                <div className="flex flex-col items-center">
                    <span className="text-sm text-muted-foreground mb-2">
                        {pluralize(sortedClips.length)}
                    </span>
                    <div className="flex items-center">
                        <span className="text-xs text-muted-foreground mr-2 min-w-25">
                            {sort === "asc" ? "По возрастанию" : "По убыванию"}
                        </span>
                        {sort === "desc" ? (
                            <Button size="icon" onClick={() => setSort("asc")}>
                                <SortDesc />
                            </Button>
                        ) : (
                            <Button size="icon" onClick={() => setSort("desc")}>
                                <SortAsc />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            <VirtuosoGrid
                className="[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] flex-1"
                totalCount={sortedClips.length}
                components={gridComponents}
                overscan={600}
                itemContent={(index) => (
                    <VideoCard
                        key={sortedClips[index].path}
                        api={API}
                        clip={sortedClips[index]}
                        hoverPlaybackEnabled={
                            settingsData?.hover_playback ?? true
                        }
                        onClick={() => setSelected(sortedClips[index])}
                        onDelete={() =>
                            mutateClips(
                                (prev) =>
                                    prev?.filter(
                                        (c) =>
                                            c.path !== sortedClips[index].path,
                                    ),
                                false,
                            )
                        }
                        onRename={(newPath, newName) => {
                            mutateClips(
                                (prev) =>
                                    prev?.map((c) =>
                                        c.path === sortedClips[index].path
                                            ? {
                                                  ...c,
                                                  path: newPath,
                                                  name: newName,
                                              }
                                            : c,
                                    ),
                                false,
                            );
                            setSelected((prev) =>
                                prev
                                    ? { ...prev, path: newPath, name: newName }
                                    : null,
                            );
                        }}
                    />
                )}
            />

            {selected && (
                <PlayerModal
                    api={API}
                    clip={selected}
                    onClose={closeModal}
                    onDelete={() =>
                        mutateClips(
                            (prev) =>
                                prev?.filter((c) => c.path !== selected.path),
                            false,
                        )
                    }
                    onRename={(newPath, newName) => {
                        mutateClips(
                            (prev) =>
                                prev?.map((c) =>
                                    c.path === selected.path
                                        ? { ...c, path: newPath, name: newName }
                                        : c,
                                ),
                            false,
                        );
                        setSelected((prev) =>
                            prev
                                ? { ...prev, path: newPath, name: newName }
                                : null,
                        );
                    }}
                />
            )}
        </div>
    );
};

export default ClipsPage;

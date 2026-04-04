import React from "react";
import { toast } from "sonner";

const API = "http://localhost:8765";

const useClipActions = () => {

    const renameClip = React.useCallback(async (
        oldPath: string,
        newName: string,
        onSuccess?: (newPath: string) => void,
        onError?: () => void,
    ) => {
        try {
            const res = await fetch(`${API}/clips/rename?path=${encodeURIComponent(oldPath)}&name=${encodeURIComponent(newName)}`,
                { method: "PATCH" });
            if (!res.ok) {
                throw new Error("Не удалось переименовать клип");
            }
            const data = await res.json();
            if (data.path) {
                onSuccess?.(data.path);
                toast.success("Клип переименован")
            }
        } catch (error) {
            onError?.();
            console.error("Ошибка переименования:", error);
            toast.error(String(error))
        }

    }, []);

    const deleteClip = React.useCallback(async (
        path: string,
        onSuccess?: () => void,
        onError?: () => void,
    ) => {
        try {
            const res = await fetch(`${API}/clips?path=${encodeURIComponent(path)}`, { method: "DELETE" });
            if (!res.ok) throw new Error("При попытке удаления клипа произошла ошибка запроса");

            onSuccess?.()
            toast.success("Клип удален")
        } catch (error) {
            onError?.();
            console.error("Ошибка удаления:", error);
            toast.error(String(error))
        }
    }, [])

    return { renameClip, deleteClip }
}

export default useClipActions;
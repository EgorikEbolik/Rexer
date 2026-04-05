import React from 'react';
import { type Clip } from '@/components/videoGrid/videoCard';

const WS_URL = "ws://localhost:8765/ws";

export type FfmpegProgressType = {
    type: "ffmpeg_progress" | "ffmpeg_ready" | "ffmpeg_error"
    stage: "downloading" | "extracting" | "ready" | "error";
    percent?: number;
};

const useSocket = (
    onNewClip: (clip: Clip) => void,
    onUpdatedClip: (clip: Clip) => void,
    onFfmpegUpdate?: (data: FfmpegProgressType) => void
) => {
    const wsRef = React.useRef<WebSocket | null>(null);
    const reconnectTimerRef = React.useRef<number | undefined>(undefined);
    const newClipRef = React.useRef<(clip: Clip) => void>(onNewClip);
    const updatedClipRef = React.useRef<(clip: Clip) => void>(onUpdatedClip);
    const ffmpegUpdateRef = React.useRef<(data: FfmpegProgressType) => void | undefined>(onFfmpegUpdate);
    const connectRef = React.useRef<() => void>(() => { });

    const connect = React.useCallback(() => {
        wsRef.current = new WebSocket(WS_URL);

        wsRef.current.onmessage = (e: MessageEvent) => {
            const data = JSON.parse(e.data);
            if (data.type === "new_clip") newClipRef.current(data.clip);
            if (data.type === "updated_clip") updatedClipRef.current(data.clip);
            if (data.type === "ffmpeg_progress") ffmpegUpdateRef.current?.(data);
            if (data.type === "ffmpeg_ready") ffmpegUpdateRef.current?.(data);
            if (data.type === "ffmpeg_error") ffmpegUpdateRef.current?.(data);
        };

        wsRef.current.onclose = () => {
            reconnectTimerRef.current = setTimeout(() => {
                connectRef.current();
            }, 3000);
        }
    }, []);

    React.useLayoutEffect(() => {
        newClipRef.current = onNewClip;
        updatedClipRef.current = onUpdatedClip;
        ffmpegUpdateRef.current = onFfmpegUpdate;
        connectRef.current = connect;

    });


    React.useEffect(() => {
        connect()
        return () => {
            wsRef.current?.close()
            clearTimeout(reconnectTimerRef.current)
            wsRef.current = null;
        }
    }, [])

};

export default useSocket;
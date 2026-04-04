import useSWR from 'swr';
import { type Clip } from '@/components/videoGrid/videoCard';

const API = "http://localhost:8765";
const fetcher = (url: string) => fetch(url).then(r => r.json());

export const useClips = () => {
    const { data, isLoading, mutate } = useSWR<Clip[]>(
        `${API}/clips`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            revalidateIfStale: false,
        }
    );

    return {
        clips: data ?? [],
        loading: isLoading,
        mutateClips: mutate,
    };
};
import useSWR from "swr";

const thumbnailFetcher = async (url: string) => {
    const res = await fetch(url);
    if (res.status === 202) {
        const err = new Error('not_ready');
        throw err;
    }
    return url;
};

export const useThumbnail = (api: string, path: string, cacheBuster?: number) => {
    const url = `${api}/clips/thumbnail?path=${encodeURIComponent(path)}${cacheBuster ? `&t=${cacheBuster}` : ''}`;

    const { data } = useSWR(url, thumbnailFetcher, {
        errorRetryInterval: 500,
        errorRetryCount: 20,
        revalidateOnFocus: false,
        revalidateIfStale: false
    });

    return data ?? undefined;
};
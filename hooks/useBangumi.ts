import { useQuery } from "@tanstack/react-query";
import { useInfiniteScroll } from "ahooks";
import { useCallback, useMemo, useRef, useState } from "react";
import { EPISODES_PER_PAGE } from "../constants/constants";

export interface Result {
  list: BangumiT[];
  nextIndex: number | undefined;
  isNoMore: boolean;
}

export interface EpisodeT {
  title: string;
}

export interface BangumiT {
  id: number;
  title: string;
  img: string;
  info: string;
  roadshow: string;
  totalEpisodes: number;
  originalAuthor: string[];
  site: string;
  statusTextLong: string;
  statusText: string;
}

const useBangumi = () => {
  const { data } = useQuery<BangumiT[]>({
    queryKey: ["bangumi"],
    queryFn: async () => {
      const res = await fetch("/data.json");
      return res.json();
    },
  });

  const [keyword, setKeyword] = useState("");

  const bangumiData = useMemo(
    () =>
      (data ?? []).filter(
        (b) =>
          b.title.toLowerCase().includes(keyword.toLowerCase()) ||
          b.info.toLowerCase().includes(keyword.toLowerCase()) ||
          `${b.id}`.toLowerCase().includes(keyword.toLowerCase()),
      ),
    [data, keyword],
  );

  const getLoadMoreList = useCallback(
    (nextIndex: number | undefined, rawData: BangumiT[]): Promise<Result> => {
      let start = 0;
      if (nextIndex) {
        start = nextIndex;
      }
      const end = start + EPISODES_PER_PAGE;
      const list = rawData.slice(start, end);
      const nIdx = rawData.length >= end ? end : undefined;
      return new Promise((resolve) => {
        resolve({
          list,
          nextIndex: nIdx,
          isNoMore: rawData.length > 0 ? rawData.length === list.length : false,
        });
      });
    },
    [],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  const { data: pageData, reload } = useInfiniteScroll<Result>(
    (d) => getLoadMoreList(d?.nextIndex, bangumiData),
    {
      target: containerRef,
      isNoMore: (d) => d?.isNoMore ?? false,
      reloadDeps: [bangumiData],
    },
  );

  return {
    containerRef,
    data: pageData?.list ?? [],
    keyword,
    setKeyword,
    reload,
  };
};

export default useBangumi;

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

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

  return {
    data: bangumiData,
    keyword,
    setKeyword,
  };
};

export default useBangumi;

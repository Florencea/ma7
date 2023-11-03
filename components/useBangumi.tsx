import { useInfiniteScroll } from "ahooks";
import { useCallback, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Card } from "./Card";

export interface ResultT {
  list: BangumiT[];
  nextIndex: number | undefined;
  isNoMore: boolean;
}

export interface BangumiT {
  id: number;
  title: string;
  img: string;
  info: string;
  roadshow: string;
  originalAuthor: string[];
  site: string;
  statusTextLong: string;
  statusText: string;
}

const EPISODES_PER_PAGE = 12;

const useBangumi = () => {
  const { data } = useSWR<BangumiT[]>("/data.json", (url: string) =>
    fetch(url).then((res) => res.json()),
  );

  const [keyword, setKeyword] = useState("");

  const [currentBangumi, setCurrentBangumi] = useState<BangumiT>();

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
    (nextIndex: number | undefined, rawData: BangumiT[]): Promise<ResultT> => {
      const start = nextIndex ?? 0;
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

  const { data: pageData, reload } = useInfiniteScroll<ResultT>(
    (d) => getLoadMoreList(d?.nextIndex, bangumiData),
    {
      target: containerRef,
      isNoMore: (d) => d?.isNoMore ?? false,
      reloadDeps: [bangumiData],
    },
  );

  const bangumiList = useMemo(
    () => (
      <div
        ref={containerRef}
        style={{
          width: "100%",
          flexGrow: 1,
          overflowY: "scroll",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))",
          gap: 12,
        }}
      >
        {pageData?.list?.map((item, index) => (
          <Card
            key={index}
            open={currentBangumi?.id === item.id}
            item={item}
            setItem={setCurrentBangumi}
          />
        ))}
      </div>
    ),
    [currentBangumi?.id, pageData?.list],
  );

  const search = useMemo(
    () => (
      <input
        type="text"
        placeholder="搜尋"
        style={{
          width: 320,
          backgroundColor: "transparent",
          color: "white",
          padding: 12,
          outline: 0,
          border: "1px solid #fff",
          lineHeight: 1,
        }}
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setCurrentBangumi(undefined);
          reload();
        }}
      />
    ),
    [keyword, reload],
  );

  return {
    bangumiList,
    search,
  };
};

export default useBangumi;

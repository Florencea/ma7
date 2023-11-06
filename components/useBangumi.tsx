import { useInfiniteScroll } from "ahooks";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
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
  info: string;
  start: string;
  by: string;
  site: string;
  total: string;
  stat: string;
}

const BANGUMIS_PER_PAGE = 12;

const useBangumi = () => {
  const { data: rawData } = useSWR<BangumiT[]>("/data.json", (url: string) =>
    fetch(url).then((res) => res.json()),
  );

  const [, startTransition] = useTransition();

  const [keyword, setKeyword] = useState("");

  const [currentBangumi, setCurrentBangumi] = useState<BangumiT>();

  const bangumiData = useMemo(
    () =>
      (rawData ?? []).filter((b) => {
        const k = keyword.toLowerCase();
        const bid = `${b.id}`;
        const bti = b.title.toLowerCase();
        const bin = b.info.toLowerCase();
        return bid.includes(k) || bti.includes(k) || bin.includes(k);
      }),
    [rawData, keyword],
  );

  const getList = useCallback(
    (d: ResultT | undefined): Promise<ResultT> => {
      const start = d?.nextIndex ?? 0;
      const end = start + BANGUMIS_PER_PAGE;
      const list = bangumiData.slice(start, end);
      const nIdx = bangumiData.length >= end ? end : undefined;
      return new Promise((resolve) => {
        resolve({
          list,
          nextIndex: nIdx,
          isNoMore:
            start > bangumiData.length - BANGUMIS_PER_PAGE &&
            start < bangumiData.length,
        });
      });
    },
    [bangumiData],
  );

  const target = useRef<HTMLDivElement>(null);

  const { data, reload } = useInfiniteScroll<ResultT>(getList, {
    target,
    isNoMore: (d) => d?.isNoMore ?? false,
    reloadDeps: [bangumiData],
  });

  const bangumiList = useMemo(
    () => (
      <div
        ref={target}
        style={{
          width: "100%",
          flexGrow: 1,
          alignContent: "start",
          overflowY: "scroll",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))",
          gap: 12,
        }}
      >
        {data?.list?.map((item, index) => (
          <Card
            key={index}
            bangumi={item}
            currentBangumiState={[currentBangumi, setCurrentBangumi]}
          />
        ))}
      </div>
    ),
    [currentBangumi, data?.list],
  );

  const search = useMemo(
    () => (
      <input
        type="text"
        placeholder="SEARCH"
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
          startTransition(() => {
            setCurrentBangumi(undefined);
            reload();
          });
        }}
      />
    ),
    [keyword, reload, setCurrentBangumi],
  );

  return {
    bangumiList,
    search,
  };
};

export default useBangumi;

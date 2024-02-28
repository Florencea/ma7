import { useInfiniteScroll } from "ahooks";
import { clsx } from "clsx";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import useSWR from "swr";
import { Card } from "../components/Card";
import type { FullBangumiT } from "../crawler/crawler-storage";

export interface ResultT {
  list: BangumiT[];
  nextIndex: number | undefined;
  isNoMore: boolean;
}

export type BangumiT = Omit<FullBangumiT, "_end" | "_imgUrl">;

const BANGUMIS_PER_PAGE = 12;

const useBangumi = () => {
  const { data: rawData } = useSWR<BangumiT[]>("/data.json", (url: string) =>
    fetch(url).then((res) => res.json()),
  );

  const [, startTransition] = useTransition();

  const [keyword, setKeyword] = useState("");
  const [start, setStart] = useState("-");

  const [currentBangumi, setCurrentBangumi] = useState<BangumiT>();

  const bangumiData = useMemo(
    () =>
      (rawData ?? []).filter((b) => {
        const k = keyword.toLowerCase();
        const bti = b.title.toLowerCase();
        const bby = b.by.toLowerCase();
        const bin = b.info.toLowerCase();
        const bst = b.start.split("-")[0];
        const keywordFlag =
          bby.includes(k) || bti.includes(k) || bin.includes(k);
        const startFlag = bst === start;
        if (start === "-") {
          return keywordFlag;
        } else {
          return keywordFlag && startFlag;
        }
      }),
    [rawData, keyword, start],
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
      <main
        className="grid w-full grow grid-cols-[repeat(auto-fill,minmax(125px,1fr))] place-items-stretch content-start gap-2 overflow-y-scroll px-2"
        ref={target}
      >
        {data?.list.map((item, index) => (
          <Card
            key={index}
            bangumi={item}
            currentBangumiState={[currentBangumi, setCurrentBangumi]}
          />
        ))}
      </main>
    ),
    [currentBangumi, data?.list],
  );

  const countBox = useMemo(
    () => (
      <div
        className={clsx(
          "w-[50px] cursor-default select-none p-2 text-right leading-none",
          { "text-gray-400": bangumiData.length === rawData?.length },
        )}
      >
        {bangumiData.length}
      </div>
    ),
    [bangumiData.length, rawData?.length],
  );

  const keywordSearch = useMemo(
    () => (
      <input
        className="w-[200px] border border-gray-400 bg-transparent p-2 leading-none outline-none"
        type="text"
        placeholder="TITLE / AUTHOR / INFO"
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

  const startYears = useMemo(() => {
    if (rawData) {
      return [...new Set(rawData.map((item) => item.start.split("-")[0]))].sort(
        (a, b) => Number(b) - Number(a),
      );
    } else {
      return [];
    }
  }, [rawData]);

  const startSearch = useMemo(
    () => (
      <select
        className={clsx(
          "w-[80px] cursor-pointer appearance-none border border-gray-400 bg-transparent p-2 leading-none outline-none",
          { "text-gray-400": start === "-", "border-gray-400": start === "-" },
        )}
        aria-label="year search"
        value={start}
        onChange={(e) => {
          setStart(e.target.value);
          startTransition(() => {
            setCurrentBangumi(undefined);
            reload();
          });
        }}
      >
        <option disabled value="-">
          YEAR
        </option>
        {startYears.map((year, idx) => (
          <option key={idx} value={year}>
            {year}
          </option>
        ))}
      </select>
    ),
    [reload, start, startYears],
  );

  const resetBtn = useMemo(
    () => (
      <button
        className={clsx(
          "w-[80px] cursor-pointer border border-gray-400 bg-transparent p-2 leading-none outline-none",
          {
            "text-gray-400":
              bangumiData.length === rawData?.length || !rawData?.length,
          },
        )}
        onClick={() => {
          setKeyword("");
          setStart("-");
          setCurrentBangumi(undefined);
          reload();
        }}
        disabled={bangumiData.length === rawData?.length}
      >
        RESET
      </button>
    ),
    [bangumiData.length, rawData?.length, reload],
  );

  return {
    bangumiList,
    countBox,
    keywordSearch,
    startSearch,
    resetBtn,
  };
};

export default useBangumi;

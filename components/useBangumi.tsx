import { useInfiniteScroll } from "ahooks";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import useSWR from "swr";
import { FullBangumiT } from "../crawler-storage";
import { Card } from "./Card";

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
      <div
        ref={target}
        style={{
          width: "100%",
          flexGrow: 1,
          alignContent: "start",
          overflowY: "scroll",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(125px, 1fr))",
          placeItems: "stretch",
          gap: 8,
          paddingLeft: 8,
          paddingRight: 8,
          boxSizing: "border-box",
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

  const countBox = useMemo(
    () => (
      <div
        style={{
          width: 50,
          cursor: "default",
          userSelect: "none",
          backgroundColor: "transparent",
          color: bangumiData.length === rawData?.length ? "gray" : "white",
          padding: 8,
          paddingRight: 8,
          outline: 0,
          lineHeight: 1,
          display: "flex",
          alignItems: "center",
        }}
      >
        <div>▶️</div>
        <div style={{ textAlign: "right", flexGrow: 1 }}>
          {bangumiData.length}
        </div>
      </div>
    ),
    [bangumiData.length, rawData?.length],
  );

  const keywordSearch = useMemo(
    () => (
      <input
        type="text"
        placeholder="TITLE / AUTHOR / INFO"
        style={{
          width: 200,
          backgroundColor: "transparent",
          color: "white",
          padding: 8,
          outline: 0,
          border: "1px solid gray",
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
        aria-label="year search"
        placeholder="YEARS"
        style={{
          appearance: "none",
          cursor: "pointer",
          width: 80,
          backgroundColor: "transparent",
          color: start === "-" ? "gray" : "white",
          padding: 8,
          boxSizing: "border-box",
          outline: 0,
          border: "1px solid gray",
          lineHeight: 1,
        }}
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
        style={{
          userSelect: "none",
          appearance: "none",
          cursor:
            bangumiData.length === rawData?.length ? "not-allowed" : "pointer",
          width: 80,
          backgroundColor: "transparent",
          color: bangumiData.length === rawData?.length ? "gray" : "white",
          padding: 8,
          outline: 0,
          border:
            bangumiData.length === rawData?.length
              ? "1px solid gray"
              : "1px solid white",
          lineHeight: 1,
        }}
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

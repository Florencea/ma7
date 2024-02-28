import { useInfiniteScroll, useSetState } from "ahooks";
import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import useSWR from "swr";
import type { FullBangumiT } from "../crawler/crawler-storage";

export interface ParamsT {
  keyword: string;
  start: string;
}

export interface ResultT {
  list: BangumiT[];
  nextIndex: number | undefined;
  isNoMore: boolean;
}

export type BangumiT = Omit<FullBangumiT, "_end" | "_imgUrl">;

export type ViewStateT = "fetching" | "filtered" | "idle";

const BANGUMIS_PER_PAGE = 12;

const DEFAULT_PARAMS: ParamsT = { keyword: "", start: "-" };

const useBangumi = () => {
  const { data: rawData, isLoading } = useSWR<BangumiT[]>(
    "/data.json",
    (url: string) => fetch(url).then((res) => res.json()),
  );

  const [, startTransition] = useTransition();

  const [params, setParams] = useSetState<ParamsT>(DEFAULT_PARAMS);

  const currentBangumiState = useState<BangumiT>();
  const [, setCurrentBangumi] = currentBangumiState;

  const bangumiData = useMemo(
    () =>
      (rawData ?? []).filter((b) => {
        const k = params.keyword.toLowerCase();
        const bti = b.title.toLowerCase();
        const bby = b.by.toLowerCase();
        const bin = b.info.toLowerCase();
        const bst = b.start.split("-")[0];
        const keywordFlag =
          bby.includes(k) || bti.includes(k) || bin.includes(k);
        const startFlag = bst === params.start;
        if (params.start === "-") {
          return keywordFlag;
        } else {
          return keywordFlag && startFlag;
        }
      }),
    [rawData, params.keyword, params.start],
  );

  const viewState: ViewStateT =
    isLoading || !rawData
      ? "fetching"
      : bangumiData.length === rawData.length
        ? "idle"
        : "filtered";

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

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data, reload } = useInfiniteScroll<ResultT>(getList, {
    target: scrollContainerRef,
    isNoMore: (d) => d?.isNoMore ?? false,
    reloadDeps: [bangumiData],
  });

  const updateParams = useCallback(
    <K extends keyof ParamsT>(params: Pick<ParamsT, K>) => {
      setParams(params);
      startTransition(() => {
        setCurrentBangumi(undefined);
        reload();
      });
    },
    [reload, setCurrentBangumi, setParams],
  );

  const startYears = useMemo(() => {
    if (rawData) {
      return [
        DEFAULT_PARAMS.start,
        ...new Set(rawData.map((item) => item.start.split("-")[0])),
      ].sort((a, b) => Number(b) - Number(a));
    } else {
      return [DEFAULT_PARAMS.start];
    }
  }, [rawData]);

  return {
    DEFAULT_PARAMS,
    viewState,
    scrollContainerRef,
    data,
    currentBangumiState,
    startYears,
    params,
    updateParams,
    count: bangumiData.length,
  };
};

export default useBangumi;

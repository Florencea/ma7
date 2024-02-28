"use client";

import type { FullBangumiT } from "@/crawler/crawler-storage";
import {
  ActionButton,
  Button,
  Flex,
  Footer,
  Grid,
  Item,
  Link,
  Picker,
  Provider,
  SearchField,
  Text,
  View,
  defaultTheme,
} from "@adobe/react-spectrum";
import { useInfiniteScroll, useSetState } from "ahooks";
import { clsx } from "clsx";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from "react";
import useSWR from "swr";

interface CardProps {
  bangumi: BangumiT;
  currentBangumiState: [
    BangumiT | undefined,
    Dispatch<SetStateAction<BangumiT | undefined>>,
  ];
}

const Card = ({
  bangumi,
  currentBangumiState: [currentBangumi, setCurrentBagumi],
}: CardProps) => {
  const open = currentBangumi?.id === bangumi.id;
  return (
    <article
      className={clsx("flex h-full w-[125px] shrink-0 flex-col", {
        "w-auto": open,
        "w-[125px]": !open,
        "col-span-4": open,
        "row-span-3": open,
        "gap-3": open,
        "pr-1": open,
      })}
    >
      {!open ? (
        <>
          <picture
            className="h-[175px] w-[125px] shrink-0 cursor-pointer select-none"
            onClick={() => {
              setCurrentBagumi(bangumi);
            }}
          >
            <source srcSet={`/img/${bangumi.id}.avif`} type="image/avif" />
            <img
              className="h-[175px] w-[125px] shrink-0 cursor-pointer select-none rounded"
              src={`/img/${bangumi.id}.avif`}
              alt={bangumi.title}
            />
          </picture>
          <h1
            className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap"
            title={bangumi.title}
          >
            <Text>{bangumi.title}</Text>
          </h1>
          <h2
            className="overflow-hidden text-ellipsis whitespace-nowrap text-gray-400"
            title={bangumi.stat}
          >
            <Text>{bangumi.stat}</Text>
          </h2>
        </>
      ) : (
        <>
          <header className="flex">
            <picture
              className="h-[350px] w-[250px] shrink-0 cursor-pointer select-none rounded"
              onClick={() => {
                setCurrentBagumi(undefined);
              }}
            >
              <source srcSet={`/img/${bangumi.id}.avif`} type="image/avif" />
              <img
                className="h-[350px] w-[250px] shrink-0 cursor-pointer select-none rounded"
                src={`/img/${bangumi.id}.avif`}
                alt={bangumi.title}
              />
            </picture>
            <section className="flex grow flex-col justify-between gap-2 px-3">
              <ul className="flex grow list-none flex-col gap-1">
                <li>{bangumi.title}</li>
                <li>
                  {bangumi.stat} {bangumi.total}
                </li>
                <li>首播日期: {bangumi.start}</li>
                <li>原著作者: {bangumi.by}</li>
                <li>
                  官方網站:{" "}
                  <Link target="_blank" rel="noreferrer" href={bangumi.site}>
                    {bangumi.site}
                  </Link>
                </li>
              </ul>
              <Footer>
                <Flex justifyContent="end">
                  <Link
                    target="_blank"
                    rel="noreferrer"
                    href={`https://myself-bbs.com/thread-${bangumi.id}-1-1.html`}
                  >
                    <Button variant="primary">前往網頁</Button>
                  </Link>
                </Flex>
              </Footer>
            </section>
          </header>
          <section className="grow leading-relaxed">
            <Text>{bangumi.info}</Text>
          </section>
        </>
      )}
    </article>
  );
};

interface ParamsT {
  keyword: string;
  start: string;
}

interface ResultT {
  list: BangumiT[];
  nextIndex: number | undefined;
  isNoMore: boolean;
}

type BangumiT = Omit<FullBangumiT, "_end" | "_imgUrl">;

type ViewStateT = "fetching" | "filtered" | "idle";

const BANGUMIS_PER_PAGE = 12;

const DEFAULT_PARAMS: ParamsT = { keyword: "", start: "-" };

export default function Page() {
  const { data: rawData, isLoading } = useSWR<BangumiT[]>(
    "/data.json",
    (url: string) => fetch(url).then((res) => res.json()),
  );

  const [, startTransition] = useTransition();

  const [params, setParams] = useSetState<ParamsT>(DEFAULT_PARAMS);

  const [currentBangumi, setCurrentBangumi] = useState<BangumiT>();

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

  return (
    <Provider theme={defaultTheme}>
      <title>{`MA7 - ${bangumiData.length} items`}</title>
      <Flex height="100svh" direction="column">
        <View padding="size-200">
          <Flex gap="size-200" justifyContent="center" alignItems="center" wrap>
            <SearchField
              aria-label="keyword"
              value={params.keyword}
              onChange={(value) => updateParams({ keyword: value })}
            />
            <Picker
              aria-label="year"
              width={120}
              disabledKeys={DEFAULT_PARAMS.start}
              selectedKey={params.start}
              onSelectionChange={(key) => updateParams({ start: `${key}` })}
            >
              {startYears.map((year) => (
                <Item key={year}>
                  {year === DEFAULT_PARAMS.start ? "YEAR" : year}
                </Item>
              ))}
            </Picker>
            <ActionButton
              isDisabled={viewState === "idle"}
              onPress={() => updateParams(DEFAULT_PARAMS)}
            >
              Reset
            </ActionButton>
          </Flex>
        </View>
        <main className="grow overflow-y-scroll" ref={scrollContainerRef}>
          <View paddingX="size-200">
            <Grid columns="repeat(auto-fill,minmax(125px,1fr))" gap="size-200">
              {data?.list.map((bangumi, index) => {
                const open = currentBangumi?.id === bangumi.id;
                return (
                  <article
                    key={index}
                    className={clsx("flex h-full w-[125px] shrink-0 flex-col", {
                      "w-auto": open,
                      "w-[125px]": !open,
                      "col-span-4": open,
                      "row-span-3": open,
                      "gap-3": open,
                      "pr-1": open,
                    })}
                  >
                    {!open ? (
                      <>
                        <picture
                          className="h-[175px] w-[125px] shrink-0 cursor-pointer select-none"
                          onClick={() => {
                            setCurrentBangumi(bangumi);
                          }}
                        >
                          <source
                            srcSet={`/img/${bangumi.id}.avif`}
                            type="image/avif"
                          />
                          <img
                            className="h-[175px] w-[125px] shrink-0 cursor-pointer select-none rounded"
                            src={`/img/${bangumi.id}.avif`}
                            alt={bangumi.title}
                          />
                        </picture>
                        <h1
                          className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap"
                          title={bangumi.title}
                        >
                          <Text>{bangumi.title}</Text>
                        </h1>
                        <h2
                          className="overflow-hidden text-ellipsis whitespace-nowrap text-gray-400"
                          title={bangumi.stat}
                        >
                          <Text>{bangumi.stat}</Text>
                        </h2>
                      </>
                    ) : (
                      <>
                        <header className="flex">
                          <picture
                            className="h-[350px] w-[250px] shrink-0 cursor-pointer select-none rounded"
                            onClick={() => {
                              setCurrentBangumi(undefined);
                            }}
                          >
                            <source
                              srcSet={`/img/${bangumi.id}.avif`}
                              type="image/avif"
                            />
                            <img
                              className="h-[350px] w-[250px] shrink-0 cursor-pointer select-none rounded"
                              src={`/img/${bangumi.id}.avif`}
                              alt={bangumi.title}
                            />
                          </picture>
                          <section className="flex grow flex-col justify-between gap-2 px-3">
                            <ul className="flex grow list-none flex-col gap-1">
                              <li>{bangumi.title}</li>
                              <li>
                                {bangumi.stat} {bangumi.total}
                              </li>
                              <li>首播日期: {bangumi.start}</li>
                              <li>原著作者: {bangumi.by}</li>
                              <li>
                                官方網站:{" "}
                                <Link
                                  target="_blank"
                                  rel="noreferrer"
                                  href={bangumi.site}
                                >
                                  {bangumi.site}
                                </Link>
                              </li>
                            </ul>
                            <Footer>
                              <Flex justifyContent="end">
                                <Link
                                  target="_blank"
                                  rel="noreferrer"
                                  href={`https://myself-bbs.com/thread-${bangumi.id}-1-1.html`}
                                >
                                  <Button variant="primary">前往網頁</Button>
                                </Link>
                              </Flex>
                            </Footer>
                          </section>
                        </header>
                        <section className="grow leading-relaxed">
                          <Text>{bangumi.info}</Text>
                        </section>
                      </>
                    )}
                  </article>
                );
              })}
            </Grid>
          </View>
        </main>
      </Flex>
    </Provider>
  );
}

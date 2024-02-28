"use client";

import type { FullBangumiT } from "@/crawler/crawler-storage";
import {
  ActionButton,
  Button,
  Content,
  Dialog,
  DialogTrigger,
  Divider,
  Flex,
  Grid,
  Heading,
  Image,
  Item,
  LabeledValue,
  Link,
  Picker,
  Provider,
  SearchField,
  Text,
  View,
  defaultTheme,
} from "@adobe/react-spectrum";
import { useInfiniteScroll, useSetState } from "ahooks";
import { useCallback, useMemo, useRef, useTransition } from "react";
import useSWR from "swr";

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

const BANGUMIS_PER_PAGE = 36;

const DEFAULT_PARAMS: ParamsT = { keyword: "", start: "-" };

export default function Page() {
  const { data: rawData } = useSWR<BangumiT[]>("/data.json", (url: string) =>
    fetch(url).then((res) => res.json()),
  );

  const [, startTransition] = useTransition();

  const [params, setParams] = useSetState<ParamsT>(DEFAULT_PARAMS);

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
        reload();
      });
    },
    [reload, setParams],
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
        <View padding="size-100">
          <Flex gap="size-100" justifyContent="center" alignItems="center" wrap>
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
            <ActionButton onPress={() => updateParams(DEFAULT_PARAMS)}>
              Reset
            </ActionButton>
          </Flex>
        </View>
        <main className="grow overflow-y-scroll" ref={scrollContainerRef}>
          <Grid columns="repeat(auto-fill,minmax(125px,1fr))">
            {data?.list.map((bangumi, index) => {
              return (
                <DialogTrigger key={index} type="popover">
                  <ActionButton
                    isQuiet
                    position="relative"
                    width="auto"
                    height="auto"
                  >
                    <Flex direction="column">
                      <Image
                        src={`/img/${bangumi.id}.avif`}
                        alt={bangumi.title}
                      />
                    </Flex>
                  </ActionButton>
                  <Dialog aria-label="detail">
                    <Heading>{bangumi.title}</Heading>
                    <Divider />
                    <Content>
                      <Flex direction="column" gap="size-100">
                        <Flex rowGap="size-100" columnGap="size-400" wrap>
                          <LabeledValue
                            label="狀態"
                            value={`${bangumi.stat} ${bangumi.total}`}
                          />
                          <LabeledValue
                            label="首播日期"
                            value={bangumi.start}
                          />
                          <LabeledValue
                            label="原著作者"
                            value={bangumi.by === "" ? "-" : bangumi.by}
                          />
                        </Flex>
                        <View
                          borderWidth="thin"
                          borderColor="dark"
                          borderRadius="regular"
                          padding="size-100"
                        >
                          <Flex justifyContent="center" gap="size-200">
                            <Link
                              target="_blank"
                              rel="noreferrer"
                              href={bangumi.site}
                            >
                              <Button variant="primary" style="fill">
                                官方網站
                              </Button>
                            </Link>
                            <Link
                              target="_blank"
                              rel="noreferrer"
                              href={`https://myself-bbs.com/thread-${bangumi.id}-1-1.html`}
                            >
                              <Button variant="accent" style="fill">
                                前往網頁
                              </Button>
                            </Link>
                          </Flex>
                        </View>
                        <View
                          borderWidth="thin"
                          borderColor="dark"
                          borderRadius="regular"
                          padding="size-100"
                        >
                          <Text>{bangumi.info}</Text>
                        </View>
                      </Flex>
                    </Content>
                  </Dialog>
                </DialogTrigger>
              );
            })}
          </Grid>
        </main>
      </Flex>
    </Provider>
  );
}

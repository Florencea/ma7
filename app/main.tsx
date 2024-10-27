"use client";

import type { FullBangumiT } from "@/crawler/crawler-storage";
import {
  ActionButton,
  Button,
  ButtonGroup,
  Content,
  Dialog,
  DialogTrigger,
  Divider,
  Flex,
  Grid,
  Heading,
  Item,
  LabeledValue,
  Picker,
  Provider,
  SearchField,
  Text,
  Tooltip,
  TooltipTrigger,
  View,
  defaultTheme,
} from "@adobe/react-spectrum";
import { useBoolean, useInfiniteScroll, useSetState } from "ahooks";
import { useCallback, useMemo, useRef, useTransition } from "react";

interface ParamsT {
  keyword: string;
  start: string;
}

interface ResultT {
  list: BangumiT[];
  nextIndex: number | undefined;
  isNoMore: boolean;
}

export type BangumiT = Omit<FullBangumiT, "_end" | "_imgUrl">;

export const BANGUMIS_PER_PAGE = 50;

const DEFAULT_PARAMS: ParamsT = { keyword: "", start: "-" };

export const Main = ({ rawData }: { rawData: BangumiT[] }) => {
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
      scrollContainerRef.current?.scroll({ top: 0 });
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

  const [dialogLinkEnable, dialogLinkEnableControl] = useBoolean(false);

  return (
    <Provider theme={defaultTheme} locale="en-US">
      <Flex height="100svh" direction="column">
        <View padding="size-100">
          <Flex gap="size-100" justifyContent="center" alignItems="end" wrap>
            <Picker
              label="年份"
              aria-label="年份"
              width={120}
              selectedKey={params.start}
              onSelectionChange={(key) => updateParams({ start: `${key}` })}
            >
              {startYears.map((year) => (
                <Item key={year}>
                  {year === DEFAULT_PARAMS.start ? "全部" : year}
                </Item>
              ))}
            </Picker>
            <SearchField
              label={`關鍵字搜尋 - ${bangumiData.length} 部番組`}
              aria-label={`關鍵字搜尋 - ${bangumiData.length} 部番組`}
              value={params.keyword}
              onChange={(value) => updateParams({ keyword: value })}
            />
          </Flex>
        </View>
        <main
          className="grow overflow-y-scroll px-3 pt-1"
          ref={scrollContainerRef}
        >
          <Grid columns="repeat(auto-fill,minmax(125px,1fr))" gap="size-100">
            {data?.list.map((bangumi, index) => {
              return (
                <DialogTrigger
                  key={index}
                  type="popover"
                  isDismissable
                  onOpenChange={(isOpen) => {
                    if (isOpen) {
                      setTimeout(() => {
                        dialogLinkEnableControl.setTrue();
                      }, 200);
                    } else {
                      dialogLinkEnableControl.setFalse();
                    }
                  }}
                >
                  <Flex direction="column" gap="size-100">
                    <picture>
                      <source srcSet={`/img/${bangumi.id}.avif`} />
                      <img
                        className="min-h-[175px] rounded"
                        src={`/img/${bangumi.id}.avif`}
                        alt={`${bangumi.title}圖片`}
                      />
                    </picture>
                    <TooltipTrigger>
                      <ActionButton aria-label={`展開${bangumi.title}詳細資訊`}>
                        <Text>{bangumi.title}</Text>
                      </ActionButton>
                      <Tooltip>{bangumi.title}</Tooltip>
                    </TooltipTrigger>
                  </Flex>
                  <Dialog aria-label={`${bangumi.title}詳細資訊`}>
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
                          <LabeledValue label="簡介" value={bangumi.info} />
                        </Flex>
                        <ButtonGroup align="center">
                          <Button
                            aria-label={`前往${bangumi.title}官方網站`}
                            variant="primary"
                            style="fill"
                            target="_blank"
                            rel="noreferrer"
                            href={bangumi.site}
                            elementType="a"
                            isDisabled={!dialogLinkEnable}
                          >
                            官方網站
                          </Button>
                          <Button
                            aria-label={`前往${bangumi.title}myself-bbs.com網頁`}
                            variant="accent"
                            style="fill"
                            target="_blank"
                            rel="noreferrer"
                            href={`https://myself-bbs.com/thread-${bangumi.id}-1-1.html`}
                            elementType="a"
                            isDisabled={!dialogLinkEnable}
                          >
                            前往網頁
                          </Button>
                        </ButtonGroup>
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
};

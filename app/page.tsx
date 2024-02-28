"use client";

import { Card } from "@/components/Card";
import {
  ActionButton,
  Flex,
  Grid,
  Item,
  Picker,
  Provider,
  SearchField,
  View,
  defaultTheme,
} from "@adobe/react-spectrum";
import useBangumi from "./useBangumi";

export default function Page() {
  const {
    DEFAULT_PARAMS,
    viewState,
    scrollContainerRef,
    data,
    currentBangumiState,
    startYears,
    params,
    updateParams,
    count,
  } = useBangumi();
  return (
    <Provider theme={defaultTheme}>
      <title>{`MA7 - ${count} items`}</title>
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
              disabledKeys="-"
              selectedKey={params.start}
              onSelectionChange={(key) => updateParams({ start: `${key}` })}
            >
              {startYears.map((year) => (
                <Item key={year}>{year}</Item>
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
              {data?.list.map((item, index) => (
                <Card
                  key={index}
                  bangumi={item}
                  currentBangumiState={currentBangumiState}
                />
              ))}
            </Grid>
          </View>
        </main>
      </Flex>
    </Provider>
  );
}

"use client";

import { BtnReset } from "@/components/BtnReset";
import { Card } from "@/components/Card";
import { CountBox } from "@/components/CountBox";
import { KeywordSearch } from "@/components/KeywordSearch";
import { Nav } from "@/components/Nav";
import { StartSearch } from "@/components/StartSearch";
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
    <>
      <Nav>
        <CountBox value={count} disabled={viewState === "fetching"} />
        <KeywordSearch
          value={params.keyword}
          onChange={(e) => updateParams({ keyword: e.target.value })}
        />
        <StartSearch
          initial={params.start === DEFAULT_PARAMS.start}
          value={params.start}
          onChange={(e) => updateParams({ start: e.target.value })}
        >
          <option disabled value={DEFAULT_PARAMS.start}>
            YEAR
          </option>
          {startYears.map((year, idx) => (
            <option key={idx} value={year}>
              {year}
            </option>
          ))}
        </StartSearch>
        <BtnReset
          disabled={viewState === "idle"}
          onClick={() => updateParams(DEFAULT_PARAMS)}
        >
          RESET
        </BtnReset>
      </Nav>
      <main
        className="grid w-full grow grid-cols-[repeat(auto-fill,minmax(125px,1fr))] place-items-stretch content-start gap-2 overflow-y-scroll px-2"
        ref={scrollContainerRef}
      >
        {data?.list.map((item, index) => (
          <Card
            key={index}
            bangumi={item}
            currentBangumiState={currentBangumiState}
          />
        ))}
      </main>
    </>
  );
}

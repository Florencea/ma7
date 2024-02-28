"use client";
import useBangumi from "../app/useBangumi";
import { CountBox } from "./CountBox";

export const List = () => {
  const { bangumiList, startSearch, keywordSearch, resetBtn, count, disabled } =
    useBangumi();

  return (
    <>
      <nav className="flex w-full items-center justify-center gap-2 bg-white p-2 dark:bg-black">
        <CountBox disabled={disabled}>{count}</CountBox>
        {keywordSearch}
        {startSearch}
        {resetBtn}
      </nav>
      {bangumiList}
    </>
  );
};

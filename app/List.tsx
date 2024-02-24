"use client";
import useBangumi from "./useBangumi";

export const List = () => {
  const { bangumiList, countBox, startSearch, keywordSearch, resetBtn } =
    useBangumi();

  return (
    <>
      <nav className="flex w-full items-center justify-center gap-2 bg-white p-2 dark:bg-black">
        {countBox}
        {keywordSearch}
        {startSearch}
        {resetBtn}
      </nav>
      {bangumiList}
    </>
  );
};

"use client";
import useBangumi from "./useBangumi";

export const List = () => {
  const { bangumiList, countBox, startSearch, keywordSearch, resetBtn } =
    useBangumi();

  return (
    <>
      <nav>
        {countBox}
        {keywordSearch}
        {startSearch}
        {resetBtn}
      </nav>
      {bangumiList}
    </>
  );
};

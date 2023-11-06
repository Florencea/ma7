"use client";
import useBangumi from "./useBangumi";

export const List = () => {
  const { bangumiList, countBox, startSearch, keywordSearch, resetBtn } =
    useBangumi();

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          padding: 8,
          boxSizing: "border-box",
        }}
      >
        {countBox}
        {keywordSearch}
        {startSearch}
        {resetBtn}
      </div>
      {bangumiList}
    </div>
  );
};

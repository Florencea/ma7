"use client";
import useBangumi from "./useBangumi";

export const List = () => {
  const { bangumiList, search } = useBangumi();

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
          padding: 16,
        }}
      >
        {search}
      </div>
      {bangumiList}
    </div>
  );
};

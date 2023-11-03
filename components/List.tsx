"use client";
import { useState } from "react";
import { EPISODES_PER_PAGE } from "../constants/constants";
import useBangumi, { BangumiT } from "../hooks/useBangumi";
import { Card } from "./Card";

export const List = () => {
  const { data, containerRef, keyword, setKeyword, reload } = useBangumi();
  const [currentBangumi, setCurrentBangumi] = useState<BangumiT>();

  return (
    <div className="relative w-full h-screen flex flex-col">
      <div className="w-full flex justify-center items-center p-4">
        <input
          type="text"
          placeholder="搜尋"
          className="w-full max-w-xs bg-transparent py-1 px-3 outline-none border border-gray-400"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setCurrentBangumi(undefined);
            reload();
          }}
        />
      </div>
      <div
        ref={containerRef}
        className="w-full grow overflow-y-scroll grid grid-cols-list gap-3"
      >
        {data.map((item, index) => (
          <Card
            key={index}
            open={currentBangumi?.id === item.id}
            item={item}
            isFirst={index / EPISODES_PER_PAGE < 1}
            setItem={setCurrentBangumi}
          />
        ))}
      </div>
    </div>
  );
};

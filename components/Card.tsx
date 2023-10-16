"use client";

import Image from "next/image";
import { BangumiT } from "../hooks/useBangumi";

interface Props {
  item: BangumiT;
  setItem: (item: BangumiT) => void;
  isFirst?: boolean;
}

export const Card = ({ item, setItem, isFirst = false }: Props) => {
  return (
    <div
      className="card shrink-0 w-[250px] cursor-pointer"
      key={item.id}
      onClick={() => setItem(item)}
    >
      <figure className="select-none">
        <Image
          className="rounded-lg"
          src={`/img/${item.img.split("/").pop()}.avif`}
          alt={item.title}
          width={250}
          height={350}
          priority={isFirst}
        />
      </figure>
      <div className="card-body p-6">
        <div
          className="tooltip cursor-pointer select-none"
          data-tip={item.title}
        >
          <h2 className="card-title text-lg truncate">{item.title}</h2>
        </div>
        <div
          className="tooltip cursor-pointer select-none"
          data-tip={item.statusText}
        >
          <p className="truncate w-full text-left">{item.statusText}</p>
        </div>
      </div>
    </div>
  );
};

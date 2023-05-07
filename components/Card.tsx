'use client'

import Image from 'next/image'
import { BangumiT } from '../hooks/useBangumi'

interface Props {
  item: BangumiT
  setItem: (item: BangumiT) => void
  isFirst?: boolean
  updated?: string
}

export const GET_STATUS_TEXT = (bangumi?: BangumiT) =>
  bangumi?.end
    ? '已完結'
    : `連載至 ${bangumi?.episodes[bangumi?.episodes.length - 1]?.title}`

export const Card = ({
  item,
  setItem,
  isFirst = false,
  updated = '',
}: Props) => {
  return (
    <div className="indicator">
      {item.hasUpdate ? (
        <span
          className="indicator-item badge badge-error cursor-pointer"
          title="有更新"
        />
      ) : null}
      <div
        className="card shrink-0 w-[250px] bg-neutral cursor-pointer hover:brightness-110 transition-all duration-300 ease-in-out"
        key={item.id}
        onClick={() => setItem(item)}
      >
        <figure className="select-none">
          <Image
            src={`/img/${item.img.split('/').pop()}.avif`}
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
          <p>{GET_STATUS_TEXT(item)}</p>
        </div>
      </div>
    </div>
  )
}

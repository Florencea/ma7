'use client'
import { useSize } from 'ahooks'
import { useEffect, useMemo, useRef, useState } from 'react'
import InfiniteScroll from 'react-infinite-scroller'
import { LAZYLOAD_PADDING } from '../constants/constants'
import useBangumi, { BangumiT } from '../hooks/useBangumi'
import { Card } from './Card'
import { Modal } from './Modal'

interface Props {
  children?: React.ReactNode
}

export const List = ({ children }: Props) => {
  const { data, isLoading, keyword, setKeyword } = useBangumi()
  const [currentBangumi, setCurrentBangumi] = useState<BangumiT>()
  const [pageCount, setPageCount] = useState(1)

  const modalRef = useRef<HTMLDialogElement>(null)
  const sizeRef = useRef<HTMLDivElement>(null)
  const size = useSize(sizeRef)

  const cardsPerRow = useMemo(() => {
    if (size !== undefined) {
      return Math.floor(size.width / 250)
    } else {
      return 8
    }
  }, [size])

  const pageData = useMemo(
    () => data.slice(0, pageCount * cardsPerRow),
    [data, pageCount, cardsPerRow],
  )

  useEffect(() => {
    if (modalRef.current !== null) {
      if (currentBangumi) {
        modalRef.current.showModal()
        document.body.style.overflow = 'hidden'
      } else {
        modalRef.current.close()
        document.body.style.overflow = 'auto'
      }
    }
  }, [currentBangumi])

  return (
    <div className="w-full h-screen flex flex-col gap-3">
      <div className="w-full flex justify-center items-center p-8">
        <input
          type="text"
          placeholder="Search"
          className="input input-bordered w-full max-w-xs"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      <div className="w-full flex flex-col justify-start items-center">
        <InfiniteScroll
          pageStart={0}
          loadMore={setPageCount}
          hasMore={pageData.length < data.length}
          threshold={LAZYLOAD_PADDING}
        >
          <div className="flex justify-center items-start flex-wrap gap-6">
            {pageData.map((item, index) => (
              <div key={item.id} className="shrink-0">
                <Card
                  item={item}
                  isFirst={index / cardsPerRow < 1}
                  setItem={setCurrentBangumi}
                />
              </div>
            ))}
          </div>
        </InfiniteScroll>
      </div>
      <dialog
        ref={modalRef}
        className="bg-neutral backdrop:backdrop-blur-sm transition-all duration-300 animate-fade-in-up rounded-lg p-6 w-[90vw] max-w-[1200px]"
      >
        <Modal item={currentBangumi} setItem={setCurrentBangumi} />
      </dialog>
    </div>
  )
}

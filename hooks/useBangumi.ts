import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

export interface EpisodeT {
  title: string
  id: string
}

export interface ResBangumiT {
  updated: string
  data: BangumiT[]
}

export interface BangumiT {
  id: number
  title: string
  img_small: string
  img: string
  latest: number
  end: boolean
  comment: number
  view: number
  created: string
  info: string
  genre: string[]
  roadshow: string
  totalEpisodes: number
  originalAuthor: string[]
  site: string
  updated: string
  hasUpdate: boolean
  episodes: EpisodeT[]
}

const useBangumi = () => {
  const { data, isLoading } = useQuery<ResBangumiT>(
    ['bangumi'],
    async () => {
      const res = await fetch('/data.json')
      return res.json()
    },
    {},
  )

  const [keyword, setKeyword] = useState('')

  const bangumiData = useMemo(
    () =>
      (data?.data ?? [])
        .filter(
          (b) =>
            b.title.toLowerCase().includes(keyword.toLowerCase()) ||
            b.info.toLowerCase().includes(keyword.toLowerCase()) ||
            `${b.id}`.toLowerCase().includes(keyword.toLowerCase()),
        )
        .sort((a, b) => {
          // not end or hasUpdate first
          if (a.end !== b.end) {
            return a.end ? 1 : -1
          }
          if (a.hasUpdate !== b.hasUpdate) {
            return a.hasUpdate ? -1 : 1
          }
          // then by updated
          if (a.updated !== b.updated) {
            return a.updated > b.updated ? -1 : 1
          }
          // default by id reverse
          return b.id - a.id
        }),
    [data, keyword],
  )

  return {
    updated: data?.updated ?? '',
    data: bangumiData,
    isLoading,
    keyword,
    setKeyword,
  }
}

export default useBangumi

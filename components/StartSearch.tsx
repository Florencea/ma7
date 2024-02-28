import { clsx } from "clsx";
import type { DetailedHTMLProps, SelectHTMLAttributes } from "react";

export const StartSearch = ({
  initial = true,
  ...props
}: DetailedHTMLProps<
  SelectHTMLAttributes<HTMLSelectElement>,
  HTMLSelectElement
> & { initial?: boolean }) => {
  return (
    <select
      className={clsx(
        "w-[80px] cursor-pointer appearance-none border border-gray-400 bg-transparent p-2 leading-none outline-none",
        {
          "text-gray-400": initial,
          "border-gray-400": initial,
        },
      )}
      aria-label="year search"
      {...props}
    />
  );
};

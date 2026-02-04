import React from "react"

import { cn } from "@/lib/utils"

type Props = React.SVGProps<SVGSVGElement>

const Users = ({ className, ...props }: Props) => {
  const frontHeadClasses =
    "transition-transform duration-300 ease-out [transform-box:fill-box] [transform-origin:center] will-change-transform scale-[1.02] group-hover/menu-item:scale-[1.08] group-hover/users:scale-[1.08]"
  const backHeadRightClasses =
    "transition-transform duration-300 ease-out delay-75 [transform-box:fill-box] [transform-origin:center] will-change-transform group-hover/menu-item:translate-x-0.75 group-hover/users:translate-x-0.75"
  const backHeadLeftClasses =
    "transition-transform duration-300 ease-out delay-75 [transform-box:fill-box] [transform-origin:center] will-change-transform group-hover/menu-item:-translate-x-0.75 group-hover/users:-translate-x-0.75"
  const frontBodyClasses =
    "transition-transform duration-300 ease-out delay-100 [transform-box:fill-box] [transform-origin:center] will-change-transform scale-[1.01] group-hover/menu-item:scale-[1.06] group-hover/users:scale-[1.06]"
  const backBodyRightClasses =
    "transition-transform duration-300 ease-out delay-150 [transform-box:fill-box] [transform-origin:center] will-change-transform group-hover/menu-item:translate-x-1 group-hover/users:translate-x-1"
  const backBodyLeftClasses =
    "transition-transform duration-300 ease-out delay-150 [transform-box:fill-box] [transform-origin:center] will-change-transform group-hover/menu-item:-translate-x-1 group-hover/users:-translate-x-1"

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("group/users shrink-0", className)}
      {...props}
    >
    <path 
      d="M15.5 11C15.5 9.067 13.933 7.5 12 7.5C10.067 7.5 8.5 9.067 8.5 11C8.5 12.933 10.067 14.5 12 14.5C13.933 14.5 15.5 12.933 15.5 11Z" />
    <path 
      className={backHeadRightClasses}
    d="M15.4827 11.3499C15.8047 11.4475 16.1462 11.5 16.5 11.5C18.433 11.5 20 9.933 20 8C20 6.067 18.433 4.5 16.5 4.5C14.6851 4.5 13.1928 5.8814 13.0173 7.65013" />
    <path 
      d="M18.5 19.5C18.5 16.7386 16.0376 14.5 13 14.5C9.96243 14.5 7.5 16.7386 7.5 19.5" />
    <path 
      className={backBodyLeftClasses}
    d="M10.9827 7.65013C10.8072 5.8814 9.31492 4.5 7.5 4.5C5.567 4.5 4 6.067 4 8C4 9.933 5.567 11.5 7.5 11.5C7.85381 11.5 8.19535 11.4475 8.51727 11.3499" />
    <path 
    d="M22 16.5C22 13.7386 19.5376 11.5 16.5 11.5" />
    <path 
    d="M7.5 11.5C4.46243 11.5 2 13.7386 2 16.5" />
    </svg>
  )
}

export default Users

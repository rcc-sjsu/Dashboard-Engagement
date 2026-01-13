import Header from '@/components/header';
import React from 'react'

type Props = {
    children: React.ReactNode;
}

const layout = ({children}: Props) => {
  return (
          <div className="grid grid-rows-[auto_1fr] h-svh">
            <Header />
            {children}
          </div>
  )
}

export default layout
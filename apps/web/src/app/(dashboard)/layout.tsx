import Header from '@/components/header';
import { AppSidebar } from '@/components/sidebar/app-sidebar';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import React from 'react'

type Props = {
    children: React.ReactNode;
}

const layout = ({children}: Props) => {
  return (
    <>
            <AppSidebar variant='inset' />
                  <SidebarInset>
            <SidebarTrigger className='m-2' />
            {children}
                  </SidebarInset>
    </>
  )
}

export default layout

"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"

const navigation = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    url: "/dashboard",
    roles: ["Admin", "Leader", "Member"],
  },
  {
    title: "Member Registry",
    icon: Users,
    url: "/members",
    roles: ["Admin", "Leader"],
  },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { state } = useSidebar()

  const filteredNav = navigation.filter(item => 
    item.roles.includes(user?.role || "")
  )

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 flex items-center px-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground h-8 w-8 rounded-lg flex items-center justify-center font-bold">
            CN
          </div>
          {state === "expanded" && (
            <span className="text-lg font-headline font-bold tracking-tight">CellNexus</span>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="px-2">
          {filteredNav.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild tooltip={item.title}>
                <a href={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <a href="/settings">
                <Settings className="size-4" />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive">
              <LogOut className="size-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

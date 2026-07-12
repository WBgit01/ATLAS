import { Outlet, Link, useLocation } from "react-router-dom"

import { AppSidebar } from "@/components/layout/AppSidebar"
import { HeaderDateDisplay } from "@/components/layout/HeaderDateDisplay"
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const routeLabels = {
  "/admin": "Dashboard",
  "/admin/students": "Students",
  "/admin/upload": "Upload Logs",
  "/admin/attendance": "Attendance",
  "/admin/archive": "Archive",
  "/admin/anomalies": "Anomalies",
  "/admin/reports": "Reports",
  "/admin/settings": "Settings",
}

function AdminHeader() {
  const location = useLocation()
  const isStudentInfo =
    /^\/admin\/students\/[^/]+$/.test(location.pathname) &&
    !routeLabels[location.pathname]

  const currentLabel = isStudentInfo
    ? "Student Profile"
    : routeLabels[location.pathname] ??
      Object.entries(routeLabels).find(
        ([path]) => location.pathname.startsWith(path) && path !== "/admin"
      )?.[1] ??
      "Admin"

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border/60 bg-white px-4 md:px-6">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 h-4" />

      <Breadcrumb className="hidden min-w-0 sm:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/admin">Admin</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate">
              {location.pathname === "/admin" ? "Dashboard" : currentLabel}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <HeaderDateDisplay />
        <NotificationDropdown />
      </div>
    </header>
  )
}

export default function AdminLayout() {
  return (
    <SidebarProvider className="flex h-svh overflow-hidden !bg-admin-gradient has-data-[variant=inset]:!bg-admin-gradient">
      <AppSidebar />
      <SidebarInset className="flex min-h-0 flex-1 flex-col border-0 bg-white/95 backdrop-blur-sm md:!m-1.5 md:!ml-0 md:rounded-lg md:shadow-[-6px_0_20px_-6px_rgba(76,29,149,0.35)]">
        <AdminHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain rounded-b-lg bg-white">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

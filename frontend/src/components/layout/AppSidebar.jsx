import { useState } from "react"
import { NavLink, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  Upload,
  CalendarCheck,
  Archive,
  AlertTriangle,
  FileText,
  Settings,
  LogOut,
  ChevronsUpDown,
  Fingerprint,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { clearAuth, getUser } from "@/lib/auth"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const studentsNavItem = {
  title: "Students",
  url: "/admin/students",
  icon: Users,
  end: true,
}

const navItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, end: true },
  { title: "Upload Logs", url: "/admin/upload", icon: Upload },
  { title: "Attendance", url: "/admin/attendance", icon: CalendarCheck },
  { title: "Archive", url: "/admin/archive", icon: Archive },
  { title: "Anomalies", url: "/admin/anomalies", icon: AlertTriangle },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Settings", url: "/admin/settings", icon: Settings },
]

const sidebarGradientClasses =
  "[&_[data-slot=sidebar-inner]]:border-0 [&_[data-slot=sidebar-inner]]:!bg-transparent text-sidebar-foreground [&_[data-sidebar=group-label]]:text-muted-foreground [&_[data-sidebar=menu-button]:hover]:bg-[#9F00FF]/15 [&_[data-sidebar=menu-button]:hover]:text-[#9F00FF] [&_[data-sidebar=menu-button][data-active=true]]:bg-[#9F00FF] [&_[data-sidebar=menu-button][data-active=true]]:text-white [&_[data-sidebar=menu-button][data-active=true]]:shadow-[0_1px_6px_-1px_rgba(159,0,255,0.35)] [&_[data-sidebar=menu-sub-button]:hover]:bg-[#9F00FF]/15 [&_[data-sidebar=menu-sub-button]:hover]:text-[#9F00FF] [&_[data-sidebar=menu-sub-button][data-active=true]]:bg-[#9F00FF] [&_[data-sidebar=menu-sub-button][data-active=true]]:text-white"

function getInitials(name) {
  return (name || "AD")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

function NavMenuItem({ item, location }) {
  const isActive = item.end
    ? location.pathname === item.url
    : location.pathname.startsWith(item.url)

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.title}
        className="h-9 rounded-lg px-3 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:px-0"
      >
        <NavLink to={item.url} end={item.end}>
          <item.icon className="size-[18px]" />
          <span className="font-medium">{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function AppSidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const user = getUser()

  const handleLogout = () => {
    setLogoutOpen(false)
    clearAuth()
    navigate("/")
  }

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      className={cn(
        sidebarGradientClasses,
        "bg-admin-gradient",
        "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))] group-data-[collapsible=icon]:p-1.5"
      )}
    >
      <SidebarHeader className="p-3 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5">
        <SidebarMenu className="group-data-[collapsible=icon]:w-full">
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton
              size="lg"
              asChild
              className="rounded-xl group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            >
              <NavLink to="/admin" className="group-data-[collapsible=icon]:justify-center">
                <div className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#5C0099] via-[#9F00FF] to-[#7A00CC] text-white shadow-[0_2px_8px_-2px_rgba(159,0,255,0.45)] group-data-[collapsible=icon]:size-8">
                  <Fingerprint className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-semibold tracking-tight text-[#3D0066]">
                    ATL
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground">
                    Attendance Dashboard
                  </span>
                </div>
              </NavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <div
        className="mx-3 h-px shrink-0 bg-violet-200/60 group-data-[collapsible=icon]:mx-2"
        role="separator"
      />

      <SidebarContent className="px-1 group-data-[collapsible=icon]:px-0">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[11px] uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-1">
              <NavMenuItem item={navItems[0]} location={location} />
              <NavMenuItem item={navItems[1]} location={location} />
              <NavMenuItem item={studentsNavItem} location={location} />
              {navItems.slice(2).map((item) => (
                <NavMenuItem key={item.title} item={item} location={location} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-1.5">
        <SidebarMenu className="group-data-[collapsible=icon]:w-full">
          <SidebarMenuItem className="group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-xl group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 data-[state=open]:bg-gradient-to-r data-[state=open]:from-violet-500/20 data-[state=open]:via-purple-500/15 data-[state=open]:to-violet-400/20 data-[state=open]:text-violet-700"
                >
                  <Avatar className="size-8 shrink-0 rounded-lg group-data-[collapsible=icon]:size-8">
                    <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-medium">{user?.name || "Admin User"}</span>
                    <span className="truncate text-[11px] text-muted-foreground">
                      {user?.email || "admin@cahs.edu"}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 opacity-50 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
                side="top"
                align="end"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                        {getInitials(user?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user?.name || "Admin User"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user?.email || "admin@cahs.edu"}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-lg" asChild>
                  <NavLink to="/admin/settings">
                    <Settings className="size-4" />
                    Account Settings
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="rounded-lg"
                  onSelect={(event) => {
                    event.preventDefault()
                    setLogoutOpen(true)
                  }}
                >
                  <LogOut className="size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent
          size="default"
          overlayClassName="bg-black/50 backdrop-blur-none supports-backdrop-filter:backdrop-blur-none"
          className="sm:max-w-md"
        >
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <LogOut />
            </AlertDialogMedia>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You will need to sign in again
              to access the admin dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleLogout}>
              Sign out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sidebar>
  )
}

import { type LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"

import {
  Collapsible,
  // CollapsibleContent,
} from "../components/ui/collapsible"
import {
  SidebarGroup,
  // SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  // SidebarMenuSub,
  // SidebarMenuSubButton,
  // SidebarMenuSubItem,
} from "../components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url?: string
    icon?: LucideIcon
    isActive?: boolean
    onClick?: () => void
    items?: {
      title: string
      url: string
      isActive?: boolean  // opsional untuk subitem
    }[]
  }[]
}) {
  return (
    <SidebarGroup >
      {/* <SidebarGroupLabel>Platform</SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive || item.items?.some(sub => sub.isActive)}
            className="group/collapsible"
          >
            <SidebarMenuItem className="w-full px-2 py-1">
              {item.url ? (
                <Link to={item.url} className="w-full">
                  <SidebarMenuButton
                    size="default"
                    tooltip={item.title}
                    className={item.isActive ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold" : "border border-transparent text-sidebar-foreground"}
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </Link>
              ) : (
                <SidebarMenuButton
                  size="default"
                  tooltip={item.title}
                  onClick={item.onClick}
                  className={item.isActive ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold" : "border border-transparent text-sidebar-foreground hover:bg-muted"}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              )}

              {/* <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <Link
                          to={subItem.url}
                          className={subItem.isActive ? "bg-accent text-accent-foreground" : ""}
                        >
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent> */}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

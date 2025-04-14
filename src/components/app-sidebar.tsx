"use client";

import * as React from "react";
import {
  IconDashboard,
  IconShirt,
  IconHanger,
  IconShoppingCart,
  IconUsers,
  IconChartBar,
  IconColorSwatch,
  IconRuler,
  IconTruckDelivery,
  IconBrandInstagram,
  IconSettings,
  IconHelp,
  IconSearch,
  IconReportMoney,
  IconDiscount,
  IconTie,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  user: {
    name: "Moncq Administrator",
    email: "admin@moncq.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Products",
      url: "/products",
      icon: IconShirt,
    },
    {
      title: "Inventory",
      url: "/inventory",
      icon: IconHanger,
    },
    {
      title: "Orders",
      url: "/orders",
      icon: IconShoppingCart,
    },
    {
      title: "Customers",
      url: "/customers",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Collections",
      icon: IconTie,
      isActive: true,
      url: "/collections",
      items: [
        {
          title: "Spring/Summer",
          url: "/collections/spring-summer",
        },
        {
          title: "Fall/Winter",
          url: "/collections/fall-winter",
        },
      ],
    },
    {
      title: "Materials",
      icon: IconColorSwatch,
      url: "/materials",
      items: [
        {
          title: "Fabrics",
          url: "/materials/fabrics",
        },
        {
          title: "Accessories",
          url: "/materials/accessories",
        },
      ],
    },
    {
      title: "Manufacturing",
      icon: IconRuler,
      url: "/manufacturing",
      items: [
        {
          title: "Production",
          url: "/manufacturing/production",
        },
        {
          title: "Quality Control",
          url: "/manufacturing/quality",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Help",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Sales Reports",
      url: "/reports/sales",
      icon: IconReportMoney,
    },
    {
      name: "Promotions",
      url: "/marketing/promotions",
      icon: IconDiscount,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <span className="text-base font-semibold">MONCQ</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

// Desktop/tablet nav only — hidden below md. BottomNav.tsx takes over on mobile.

import { useState } from "react";

import { NavLink, Link } from "react-router-dom";

import { House, Users, User, Settings, Search } from "lucide-react";

import { ROUTES } from "../routes";

import { cn } from "../utils";

import logo from "../assets/logo.png";
import type { NavTab } from "../types";

const navItems = [
  { label: "Home", to: ROUTES.home, icon: House, tab: "home" as NavTab },
  { label: "Community", to: ROUTES.community, icon: Users, tab: "community" as NavTab },
  { label: "Profile", to: ROUTES.profile, icon: User, tab: "profile" as NavTab },
  { label: "Settings", to: ROUTES.settings, icon: Settings, tab: "settings" as NavTab },
];

const footerLinks = [
  { label: "About", to: ROUTES.about },

  { label: "Privacy", to: ROUTES.privacy },

  { label: "Terms", to: ROUTES.terms },

  { label: "Contact", to: ROUTES.contact },
];

interface SidebarProps {
  activeTab?: NavTab;
  setActiveTab?: (tab: NavTab) => void;
  unreadCommunityCount?: number;
  onUploadClick?: () => void;
  hideOnMobile?: boolean;
}

export default function sidebar(props: SidebarProps) {
  // እዚህ ጋር ያሉትን ቫሪያብሎች ከታች በተግባር ተጠቅመናቸዋል
  const { activeTab, setActiveTab, unreadCommunityCount, onUploadClick, hideOnMobile } = props;

  const [query, setQuery] = useState("");

  return (
    <aside 
      // 1. hideOnMobile እዚህ ጋ ጥቅም ላይ ውሏል
      className={cn(
        "hidden h-screen w-[280px] shrink-0 flex-col justify-between border-r border-slate-200 bg-white px-5 py-6 md:flex",
        hideOnMobile && "md:hidden" 
      )}
    >
      <div className="flex flex-col gap-5">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold text-slate-900">
          <img
            src={logo}
            alt="Nexify logo"
            className="h-10 w-10 rounded-lg object-contain"
          />
          Nexify
        </h1>

        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full rounded-md border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm text-slate-700 outline-none focus:border-blue-600"
          />
        </div>

        <nav className="flex flex-col gap-1.5">
          {navItems.map(({ label, to, icon: Icon, tab }) => (
            <NavLink
              key={to}
              to={to}
              end={to === ROUTES.home}
              // 2. activeTab እና setActiveTab እዚህ ጋ ጥቅም ላይ ውለዋል
              onClick={() => setActiveTab?. (tab)}
              className={({ isActive }) =>
                cn(
                  "flex items-center justify-between rounded-lg px-4 py-3.5 text-lg font-bold text-slate-700 transition-colors hover:bg-slate-100",
                  (isActive || activeTab === tab) && "bg-slate-100",
                )
              }
            >
              <div className="flex items-center gap-4">
                <Icon size={20} />
                {label}
              </div>

              {/* 3. unreadCommunityCount እዚህ ጋ ጥቅም ላይ ውሏል */}
              {tab === "community" && (unreadCommunityCount ?? 0) > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCommunityCount}
                </span>
              )}
            </NavLink>
          ))}
          
          {/* 4. onUploadClick እዚህ ጋ ጥቅም ላይ ውሏል */}
          <button 
            onClick={onUploadClick}
            className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-blue-700 transition-colors"
          >
            Upload New
          </button>
        </nav>
      </div>

      <div className="flex flex-col gap-2 border-t border-slate-200 pt-4">
        <div className="flex flex-wrap gap-2.5 text-xs text-slate-500">
          {footerLinks.map((link) => (
            <Link key={link.to} to={link.to} className="hover:text-slate-900">
              {link.label}
            </Link>
          ))}
        </div>

        <p className="text-[11px] text-slate-400">
          &copy; {new Date().getFullYear()} Nexify
        </p>
      </div>
    </aside>
  );
}
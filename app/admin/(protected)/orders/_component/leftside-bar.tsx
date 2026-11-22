"use client";

import * as React from "react";

import {
  Home,
  ShoppingCart,
  CreditCard,
  Package,
  Tag,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  LogOut,
  ShoppingBag,
  Languages,
  Check,
} from "lucide-react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useSidebar } from "@/contexts/sidebar-contexts";
import { useLanguage } from "@/contexts/language-context";
import { useTranslation } from "@/hooks/use-translation";

import { LOCALE_LABELS, type Locale } from "@/lib/i18n";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

/* =========================================================
   SIDEBAR TYPES
========================================================= */

type UserRole = "OWNER" | "ADMIN" | "STAFF";

interface SidebarMenuLink {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
}

/* =========================================================
   LANGUAGE FLAG - IMAGE VERSION
========================================================= */

function LanguageFlag({ locale }: { locale: Locale }) {
  const flagSrc = locale === "en" ? "/image/en.webp" : "/image/km.webp";

  const flagAlt =
    locale === "en" ? "English - United Kingdom" : "Khmer - Cambodia";

  return (
    <span
      className="
        flex
        h-7
        w-7
        shrink-0
        items-center
        justify-center
        overflow-hidden
        rounded-full
        border
        border-gray-200
        bg-white
        shadow-sm
      "
      aria-label={flagAlt}
    >
      <Image
        src={flagSrc}
        alt={flagAlt}
        width={28}
        height={28}
        unoptimized
        className="
          h-full
          w-full
          rounded-full
          object-cover
        "
      />
    </span>
  );
}

/* =========================================================
   SIDEBAR
========================================================= */

export function Sidebar() {
  const { isOpen, isCollapsed, close, toggle } = useSidebar();

  const { locale, setLocale, isReady } = useLanguage();
  const { t } = useTranslation();

  const languages: Locale[] = ["en", "km"];

  const pathname = usePathname() || "/";

  const [transactionCount, setTransactionCount] = React.useState(0);

  // Dynamic company branding.
  const [storeName, setStoreName] = React.useState("Happy Birds");
  const [storeLogo, setStoreLogo] = React.useState("");

  // Current authenticated role.
  const [currentRole, setCurrentRole] = React.useState<UserRole | null>(null);

  // Prevent unnecessary transaction-count requests.
  const lastTransactionFetch = React.useRef(0);

  /* =======================================================
     LOAD COMPANY NAME, LOGO AND USER ROLE
  ======================================================= */

  const loadStoreBranding = React.useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        return;
      }

      const settings = data.settings;

      setStoreName(
        typeof settings?.storeName === "string" && settings.storeName.trim()
          ? settings.storeName.trim()
          : "Happy Birds",
      );

      setStoreLogo(typeof settings?.logo === "string" ? settings.logo : "");

      if (
        data.role === "OWNER" ||
        data.role === "ADMIN" ||
        data.role === "STAFF"
      ) {
        setCurrentRole(data.role);
      }
    } catch (error) {
      console.error("Failed to load store branding:", error);
    }
  }, []);

  /* =======================================================
     LOAD TRANSACTION COUNT
  ======================================================= */

  const loadTransactionCount = React.useCallback(async () => {
    try {
      const response = await fetch("/api/transactions?countOnly=true", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        return;
      }

      setTransactionCount(typeof data.count === "number" ? data.count : 0);
    } catch (error) {
      console.error("Failed to load transaction count:", error);
    }
  }, []);

  /* =======================================================
     SIDEBAR DATA EFFECTS
  ======================================================= */

  React.useEffect(() => {
    lastTransactionFetch.current = Date.now();

    loadTransactionCount();
    loadStoreBranding();

    const handleFocus = () => {
      const now = Date.now();

      // Prevent repeated requests within 30 seconds.
      if (now - lastTransactionFetch.current < 30000) {
        return;
      }

      lastTransactionFetch.current = now;
      loadTransactionCount();
    };

    const handleStoreSettingsUpdated = () => {
      loadStoreBranding();
    };

    window.addEventListener("focus", handleFocus);

    window.addEventListener(
      "store-settings-updated",
      handleStoreSettingsUpdated,
    );

    return () => {
      window.removeEventListener("focus", handleFocus);

      window.removeEventListener(
        "store-settings-updated",
        handleStoreSettingsUpdated,
      );
    };
  }, [loadTransactionCount, loadStoreBranding]);

  /* =======================================================
     ACTIVE LINK
  ======================================================= */

  function isLinkActive(href: string) {
    return pathname === href;
  }

  /* =======================================================
     ROLE-BASED MOBILE MENU
  ======================================================= */

  const mobileLinks: SidebarMenuLink[] =
    currentRole === null
      ? []
      : currentRole === "STAFF"
        ? [
            {
              icon: <ShoppingCart className="h-4 w-4" />,
              label: t("navigation.orders"),
              href: "/admin/orders",
            },
            {
              icon: <ShoppingBag className="h-4 w-4" />,
              label: t("navigation.userOrders"),
              href: "/admin/user-orders",
            },
            {
              icon: <CreditCard className="h-4 w-4" />,
              label: t("navigation.transactions"),
              href: "/admin/transactions",
            },
          ]
        : [
            {
              icon: <Home className="h-4 w-4" />,
              label: t("navigation.overview"),
              href: "/admin/overview",
            },
            {
              icon: <ShoppingCart className="h-4 w-4" />,
              label: t("navigation.orders"),
              href: "/admin/orders",
            },
            {
              icon: <CreditCard className="h-4 w-4" />,
              label: t("navigation.transactions"),
              href: "/admin/transactions",
            },
            {
              icon: <Settings className="h-4 w-4" />,
              label: t("navigation.settings"),
              href: "/admin/settings",
            },
          ];

  /* =======================================================
     DESKTOP MENU LINKS
  ======================================================= */

  const menuLinks: SidebarMenuLink[] =
    currentRole === null
      ? []
      : currentRole === "STAFF"
        ? [
            {
              icon: <ShoppingCart />,
              label: t("navigation.orders"),
              href: "/admin/orders",
            },
            {
              icon: <ShoppingBag />,
              label: t("navigation.userOrders"),
              href: "/admin/user-orders",
            },
            {
              icon: <CreditCard />,
              label: t("navigation.transactions"),
              href: "/admin/transactions",
              badge:
                transactionCount > 0 ? String(transactionCount) : undefined,
            },
          ]
        : [
            {
              icon: <Home />,
              label: t("navigation.overview"),
              href: "/admin/overview",
            },
            {
              icon: <ShoppingCart />,
              label: t("navigation.orders"),
              href: "/admin/orders",
            },
            {
              icon: <ShoppingBag />,
              label: t("navigation.userOrders"),
              href: "/admin/user-orders",
            },
            {
              icon: <CreditCard />,
              label: t("navigation.transactions"),
              href: "/admin/transactions",
              badge:
                transactionCount > 0 ? String(transactionCount) : undefined,
            },
          ];

  /* =======================================================
     SIDEBAR
  ======================================================= */

  return (
    <>
      {/* MOBILE OVERLAY */}

      {isOpen && (
        <div
          className="
            fixed
            inset-0
            z-40
            bg-black/50
            lg:hidden
          "
          onClick={close}
        />
      )}

      {/* MOBILE MENU BUTTON */}

      <div
        className="
          fixed
          left-4
          top-[72px]
          z-50
          flex
          items-center
          lg:hidden
        "
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-full
                bg-gradient-to-b
                from-teal-400/50
                to-teal-600/50
                text-white
                shadow-md
                transition
                hover:from-teal-500/50
                hover:to-teal-700
              "
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="start"
            className="
              w-52
              rounded-xl
              border
              border-gray-100
              bg-white
              shadow-md
            "
          >
            {mobileLinks.map((link) => (
              <DropdownMenuItem key={link.href} asChild>
                <Link href={link.href} className="flex items-center gap-2">
                  {link.icon}
                  {link.label}

                  {link.href === "/admin/transactions" &&
                    transactionCount > 0 && (
                      <span
                        className="
                          ml-auto
                          rounded-full
                          bg-red-500
                          px-2
                          py-0.5
                          text-xs
                          text-white
                        "
                      >
                        {transactionCount}
                      </span>
                    )}
                </Link>
              </DropdownMenuItem>
            ))}

            <DropdownMenuItem
              onClick={toggle}
              className="cursor-pointer text-teal-600"
            >
              {t("common.close")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* DESKTOP SIDEBAR */}

      <div
        className={cn(
          `
            fixed
            inset-y-0
            left-0
            z-50
            flex
            flex-col
            border-r
            border-gray-200
            bg-white
            transition-all
            duration-300
            ease-in-out
          `,
          isCollapsed ? "w-16" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* LOGO */}

        <div
          className="
            flex
            items-center
            gap-2
            border-b
            border-gray-200
            p-4
          "
        >
          <div
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              overflow-hidden
              rounded-lg
              bg-teal-50
            "
          >
            {storeLogo ? (
              <Image
                src={storeLogo}
                alt={`${storeName} Logo`}
                width={32}
                height={32}
                unoptimized
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <ShoppingBag className="h-5 w-5 text-teal-600" />
            )}
          </div>

          {!isCollapsed && (
            <span className="truncate font-semibold text-gray-900">
              {storeName}
            </span>
          )}
        </div>

        {/* CIRCULAR COUNTRY FLAG LANGUAGE SWITCHER */}

        <div className="flex justify-center border-b border-gray-100 px-3 py-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!isReady}
                aria-label={t("settings.language")}
                className="
          group
          relative
          h-9
          w-full
          justify-between
          rounded-full
          border
          border-white/80
          bg-white/60
          px-3
          text-xs
          text-slate-700
          shadow-sm
          backdrop-blur-xl
          transition-all
          duration-300
          hover:border-teal-200
          hover:bg-teal-50/70
          hover:shadow-md
          active:scale-[0.98]
        "
              >
                <span className="flex items-center gap-2">
                  <LanguageFlag locale={locale} />

                  <span className="text-sm font-medium text-slate-700">
                    {LOCALE_LABELS[locale]}
                  </span>
                </span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="center"
              sideOffset={6}
              className="
        w-52
        rounded-2xl
        border
        border-white/70
        bg-white/85
        p-1.5
        shadow-xl
        backdrop-blur-2xl
      "
            >
              {languages.map((language) => (
                <DropdownMenuItem
                  key={language}
                  onClick={() => setLocale(language)}
                  className={cn(
                    "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5",
                    locale === language
                      ? "bg-teal-50 text-teal-800"
                      : "text-slate-600",
                  )}
                >
                  <LanguageFlag locale={language} />

                  <span className="flex-1 text-sm font-medium">
                    {LOCALE_LABELS[language]}
                  </span>

                  {locale === language && (
                    <Check className="h-4 w-4 text-teal-600" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* NAVIGATION */}

        <nav
          className="
            flex-1
            space-y-6
            overflow-y-auto
            px-2
            py-4
          "
        >
          {/* MENU */}

          {currentRole !== null && (
            <SidebarSection
              title=""
              isCollapsed={isCollapsed}
              links={menuLinks}
              isLinkActive={isLinkActive}
            />
          )}

          {/* INVENTORY - OWNER / ADMIN ONLY */}

          {currentRole !== null && currentRole !== "STAFF" && (
            <SidebarSection
              title={t("navigation.inventory")}
              isCollapsed={isCollapsed}
              links={[
                {
                  icon: <Package />,
                  label: t("navigation.products"),
                  href: "/admin/products",
                },
                {
                  icon: <Tag />,
                  label: t("navigation.categories"),
                  href: "/admin/categories",
                },
                {
                  icon: <Tag />,
                  label: t("navigation.promotions"),
                  href: "/admin/promotions",
                },
              ]}
              isLinkActive={isLinkActive}
            />
          )}

          {/* OTHERS - OWNER / ADMIN ONLY */}

          {currentRole !== null && currentRole !== "STAFF" && (
            <SidebarSection
              title=""
              isCollapsed={isCollapsed}
              links={[
                {
                  icon: <Settings />,
                  label: t("navigation.settings"),
                  href: "/admin/settings",
                },
              ]}
              isLinkActive={isLinkActive}
            />
          )}

          {/* EXTRA LINKS */}

          <div className="mt-6 space-y-1">
            <SidebarLink
              icon={<LogOut />}
              label={t("navigation.logout")}
              href="/admin/logout"
              isCollapsed={isCollapsed}
              active={isLinkActive("/admin/logout")}
            />
          </div>
        </nav>

        {/* PROFILE */}

        <div
          className="
            flex
            items-center
            gap-2
            border-t
            border-gray-200
            p-4
          "
        >
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                Surendar V
              </span>

              <span className="text-xs text-gray-500">@siren.ux</span>
            </div>
          )}
        </div>

        {/* COLLAPSE BUTTON */}

        <button
          type="button"
          onClick={toggle}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="
            absolute
            right-[-12px]
            top-[72px]
            hidden
            h-6
            w-8
            items-center
            justify-center
            rounded-l-full
            bg-gradient-to-b
            from-teal-300/50
            to-teal-500/50
            text-white
            shadow-md
            transition
            hover:from-teal-400/50
            hover:to-teal-600
            lg:flex
          "
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </>
  );
}

/* =========================================================
   SIDEBAR LINK
========================================================= */

interface SidebarLinkProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
  isCollapsed: boolean;
}

function SidebarLink({
  icon,
  label,
  href,
  active,
  badge,
  isCollapsed,
}: SidebarLinkProps) {
  const link = (
    <Button
      asChild
      variant="ghost"
      className={cn(
        `
          relative
          w-full
          justify-start
          text-gray-700
        `,
        active
          ? `
              bg-teal-600
              text-white
              hover:bg-teal-600
            `
          : `
              hover:bg-teal-50
              hover:text-teal-700
            `,
        isCollapsed && "justify-center px-2",
      )}
    >
      <Link
        href={href}
        className="
          flex
          items-center
          gap-3
          rounded-md
          px-2
          py-2
        "
      >
        <span className="h-4 w-4 shrink-0">{icon}</span>

        {!isCollapsed && <span className="text-sm">{label}</span>}

        {!isCollapsed && badge && (
          <span
            className={cn(
              `
                ml-auto
                inline-flex
                items-center
                justify-center
                rounded-full
                px-1.5
                py-0.5
                text-xs
              `,
              active ? "bg-white/20 text-white" : "bg-red-500 text-white",
            )}
          >
            {badge}
          </span>
        )}
      </Link>
    </Button>
  );

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return link;
}

/* =========================================================
   SIDEBAR SECTION
========================================================= */

interface SidebarSectionProps {
  title: string;
  isCollapsed: boolean;
  links: SidebarMenuLink[];
  isLinkActive: (href: string) => boolean;
}

function SidebarSection({
  title,
  isCollapsed,
  links,
  isLinkActive,
}: SidebarSectionProps) {
  return (
    <div>
      {!isCollapsed && (
        <p
          className="
            mb-2
            px-2
            text-xs
            font-semibold
            text-gray-400
          "
        >
          {title}
        </p>
      )}

      <div className="space-y-1">
        {links.map((link) => (
          <SidebarLink
            key={link.href}
            icon={link.icon}
            label={link.label}
            href={link.href}
            badge={link.badge}
            isCollapsed={isCollapsed}
            active={isLinkActive(link.href)}
          />
        ))}
      </div>
    </div>
  );
}

export const mainNavItems = [
  { id: "dashboard", label: "ダッシュボード", href: "/dashboard" },
  { id: "time-entry", label: "時間記録", href: "/time-entry" },
  { id: "timesheet", label: "勤務表", href: "/timesheet" },
  { id: "bulk-edit", label: "一括編集", href: "/bulk-edit" }
] as const;

export type MainNavItemId = (typeof mainNavItems)[number]["id"];

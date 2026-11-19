import { Button } from "../../../../../components/ui/button";

const tabs = [
  { name: "Outline", active: true },
  { name: "Past Performance", count: 3 },
  { name: "Key Personnel", count: 2 },
  { name: "Focus Documents" },
];

export function BottomTabs() {
  return (
    <div className="flex items-center gap-2 p-6 border-t border-border">
      {tabs.map((tab) => (
        <Button
          key={tab.name}
          variant={tab.active ? "default" : "ghost"}
          size="sm"
          className={
            tab.active
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground"
          }
        >
          {tab.name}
          {tab.count && (
            <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs">
              {tab.count}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}

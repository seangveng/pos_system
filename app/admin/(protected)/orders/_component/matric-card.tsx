import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../../components/ui/card";

const metrics = [
  {
    title: "Total Revenue",
    value: "$1,250.00",
    change: "+12.5%",
    trend: "up",
    description: "Trending up this month",
    subtitle: "Visitors for the last 6 months",
  },
  {
    title: "New Customers",
    value: "1,234",
    change: "-20%",
    trend: "down",
    description: "Down 20% this period",
    subtitle: "Acquisition needs attention",
  },
  {
    title: "Active Accounts",
    value: "45,678",
    change: "+12.5%",
    trend: "up",
    description: "Strong user retention",
    subtitle: "Engagement exceed targets",
  },
  {
    title: "Growth Rate",
    value: "4.5%",
    change: "+4.5%",
    trend: "up",
    description: "Steady performance",
    subtitle: "Meets growth projections",
  },
];

export function MetricsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      {metrics.map((metric) => (
        <Card key={metric.title} className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <div
              className={`flex items-center gap-1 text-xs ${
                metric.trend === "up" ? "text-green-500" : "text-red-500"
              }`}
            >
              {metric.trend === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {metric.change}
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">
              {metric.value}
            </div>
            <div className="flex items-center gap-1 mt-1">
              {metric.trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <p className="text-xs text-muted-foreground">
                {metric.description}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metric.subtitle}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

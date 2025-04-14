"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Tooltip,
} from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { parseProductsCSV } from "@/utils/papaparse-util";

export const description = "Interactive fashion analytics visualization";

// Fashion-specific chart configuration
const chartConfig = {
  inventory: {
    label: "Inventory",
  },
  oversized: {
    label: "Oversized Collection",
    color: "var(--chart-1)",
  },
  fitted: {
    label: "Fitted Collection",
    color: "var(--chart-2)",
  },
  classic: {
    label: "Classic Collection",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("all");
  const [metricType, setMetricType] = React.useState("stock");
  const [chartType, setChartType] = React.useState("area");
  const [chartData, setChartData] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Load and process CSV data directly using parseProductsCSV
  React.useEffect(() => {
    async function loadAndProcessData() {
      try {
        setIsLoading(true);
        const products = await parseProductsCSV();

        // Group by month and collection style with a single data pass for better performance
        const monthlyData = new Map();

        products.forEach((product) => {
          // Parse the MM/DD/YYYY date format
          const dateParts = product.release_date.split("/");
          const month = parseInt(dateParts[0]);
          const day = parseInt(dateParts[1]);
          const year = parseInt(dateParts[2]);
          const date = new Date(year, month - 1, day);

          // Format as YYYY-MM for aggregation
          const monthYear = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}`;

          if (!monthlyData.has(monthYear)) {
            monthlyData.set(monthYear, {
              date: monthYear,
              displayDate: date.toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              }),
              oversizedStock: 0,
              fittedStock: 0,
              classicStock: 0,
              oversizedRevenue: 0,
              fittedRevenue: 0,
              classicRevenue: 0,
              oversizedCount: 0,
              fittedCount: 0,
              classicCount: 0,
            });
          }

          // Parse price from string (remove $ and spaces)
          const price = parseFloat(product.price.replace(/[^0-9.-]+/g, ""));
          const entry = monthlyData.get(monthYear);

          // Categorize by style prefix in name
          if (product.name.includes("Oversized")) {
            entry.oversizedStock += product.stock;
            entry.oversizedRevenue += price * product.stock;
            entry.oversizedCount += 1;
          } else if (product.name.includes("Fitted")) {
            entry.fittedStock += product.stock;
            entry.fittedRevenue += price * product.stock;
            entry.fittedCount += 1;
          } else if (product.name.includes("Classic")) {
            entry.classicStock += product.stock;
            entry.classicRevenue += price * product.stock;
            entry.classicCount += 1;
          }
        });

        // Convert to array and sort chronologically
        const sortedData = Array.from(monthlyData.values()).sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        setChartData(sortedData);
      } catch (error) {
        console.error("Failed to load fashion data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAndProcessData();
  }, []);

  // Handle mobile viewport
  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("3m");
    }
  }, [isMobile]);

  // Efficiently filter data based on timeRange with memoization
  const filteredData = React.useMemo(() => {
    if (chartData.length === 0) return [];
    if (timeRange === "all") return chartData;

    const lastDate = new Date(chartData[chartData.length - 1].date + "-01");
    const cutoffDate = new Date(lastDate);

    if (timeRange === "6m") {
      cutoffDate.setMonth(lastDate.getMonth() - 6);
    } else if (timeRange === "3m") {
      cutoffDate.setMonth(lastDate.getMonth() - 3);
    } else if (timeRange === "1m") {
      cutoffDate.setMonth(lastDate.getMonth() - 1);
    }

    return chartData.filter(
      (item) => new Date(item.date + "-01").getTime() >= cutoffDate.getTime()
    );
  }, [chartData, timeRange]);

  // Get data keys based on selected metric
  const getDataKeys = React.useMemo(() => {
    switch (metricType) {
      case "stock":
        return {
          keys: ["oversizedStock", "fittedStock", "classicStock"],
          labels: [
            "Oversized Collection",
            "Fitted Collection",
            "Classic Collection",
          ],
        };
      case "revenue":
        return {
          keys: ["oversizedRevenue", "fittedRevenue", "classicRevenue"],
          labels: [
            "Oversized Collection",
            "Fitted Collection",
            "Classic Collection",
          ],
        };
      case "count":
        return {
          keys: ["oversizedCount", "fittedCount", "classicCount"],
          labels: [
            "Oversized Collection",
            "Fitted Collection",
            "Classic Collection",
          ],
        };
      case "category":
        return {
          keys: ["jacketsStock", "hoodiesStock", "sweatshirtsStock"],
          labels: ["Jackets & Outerwear", "Hoodies", "Sweatshirts"],
        };
      case "avgPrice":
        return {
          keys: ["oversizedAvgPrice", "fittedAvgPrice", "classicAvgPrice"],
          labels: [
            "Oversized Collection",
            "Fitted Collection",
            "Classic Collection",
          ],
        };
      default:
        return {
          keys: ["oversizedStock", "fittedStock", "classicStock"],
          labels: [
            "Oversized Collection",
            "Fitted Collection",
            "Classic Collection",
          ],
        };
    }
  }, [metricType]);

  // Format Y-axis label based on metric
  const getYAxisLabel = () => {
    switch (metricType) {
      case "stock":
        return "Units in Stock";
      case "revenue":
        return "Revenue (AUD)";
      case "count":
        return "Number of Products";
      default:
        return "Value";
    }
  };

  // Format tooltip values
  const formatTooltipValue = (value: number) => {
    if (metricType === "revenue") {
      return `$${value.toLocaleString()}`;
    }
    return value.toLocaleString();
  };

  return (
    <Card className="@container/card overflow-hidden border-none rounded-xl bg-gradient-to-b from-background to-background/50 shadow-sm">
      <CardHeader>
        <CardTitle>Fashion Collection Analytics</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {metricType === "stock"
              ? "Inventory comparison by collection style"
              : metricType === "revenue"
              ? "Revenue analysis by collection style"
              : "Product distribution by collection style"}
          </span>
          <span className="@[540px]/card:hidden">Collection analytics</span>
        </CardDescription>
        <CardAction className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 mr-2">
            <Switch
              id="chart-type"
              checked={chartType === "bar"}
              onCheckedChange={(checked) =>
                setChartType(checked ? "bar" : "area")
              }
            />
            <Label
              htmlFor="chart-type"
              className="text-xs font-normal text-muted-foreground"
            >
              {chartType === "area" ? "Area Chart" : "Bar Chart"}
            </Label>
          </div>

          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value)}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="all">All time</ToggleGroupItem>
            <ToggleGroupItem value="6m">Last 6 months</ToggleGroupItem>
            <ToggleGroupItem value="3m">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="1m">Last month</ToggleGroupItem>
          </ToggleGroup>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <div className="flex h-[250px] items-center justify-center text-muted-foreground">
            <p>Loading fashion collection data...</p>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            {chartType === "area" ? (
              <AreaChart
                data={filteredData}
                margin={{ top: 5, right: 20, bottom: 5, left: 10 }}
              >
                <defs>
                  <linearGradient
                    id="oversizedGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-1)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                  <linearGradient
                    id="fittedGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--chart-2)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-2)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                  <linearGradient
                    id="classicGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--chart-3)"
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--chart-3)"
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    if (metricType === "revenue") {
                      return value >= 1000
                        ? `$${Math.round(value / 1000)}k`
                        : `$${value}`;
                    }
                    return value >= 1000
                      ? `${Math.round(value / 1000)}k`
                      : value;
                  }}
                />
                <Tooltip
                  cursor={{ opacity: 0.2 }}
                  content={
                    // Use type assertion to fix the TypeScript error
                    (
                      <ChartTooltipContent
                        labelFormatter={(value) => value.toString()}
                        indicator="dot"
                      />
                    ) as any
                  }
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: "12px" }}
                />
                {getDataKeys.keys[0].includes("oversized") && (
                  <Area
                    dataKey={getDataKeys.keys[0]}
                    name={getDataKeys.labels[0]}
                    type="monotone"
                    fill="url(#oversizedGradient)"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    animationDuration={900}
                    stackId="a"
                  />
                )}
                {getDataKeys.keys[1].includes("fitted") && (
                  <Area
                    dataKey={getDataKeys.keys[1]}
                    name={getDataKeys.labels[1]}
                    type="monotone"
                    fill="url(#fittedGradient)"
                    stroke="var(--chart-2)"
                    strokeWidth={2}
                    animationDuration={1100}
                    stackId="a"
                  />
                )}
                {getDataKeys.keys[2].includes("classic") && (
                  <Area
                    dataKey={getDataKeys.keys[2]}
                    name={getDataKeys.labels[2]}
                    type="monotone"
                    fill="url(#classicGradient)"
                    stroke="var(--chart-3)"
                    strokeWidth={2}
                    animationDuration={1300}
                    stackId="a"
                  />
                )}
              </AreaChart>
            ) : (
              <BarChart
                data={filteredData}
                margin={{ top: 20, right: 20, bottom: 5, left: 10 }}
              >
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  strokeOpacity={0.3}
                />
                <XAxis
                  dataKey="displayDate"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={(value) => {
                    if (metricType === "revenue") {
                      return value >= 1000
                        ? `$${Math.round(value / 1000)}k`
                        : `$${value}`;
                    }
                    return value >= 1000
                      ? `${Math.round(value / 1000)}k`
                      : value;
                  }}
                />
                <Tooltip
                  cursor={{ opacity: 0.2 }}
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => value.toString()}
                      indicator="dot"
                    />
                  }
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ fontSize: "12px" }}
                />
                {getDataKeys.keys[0].includes("oversized") && (
                  <Bar
                    dataKey={getDataKeys.keys[0]}
                    name={getDataKeys.labels[0]}
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={900}
                    stackId="a"
                  />
                )}
                {getDataKeys.keys[1].includes("fitted") && (
                  <Bar
                    dataKey={getDataKeys.keys[1]}
                    name={getDataKeys.labels[1]}
                    fill="var(--chart-2)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1100}
                    stackId="a"
                  />
                )}
                {getDataKeys.keys[2].includes("classic") && (
                  <Bar
                    dataKey={getDataKeys.keys[2]}
                    name={getDataKeys.labels[2]}
                    fill="var(--chart-3)"
                    radius={[4, 4, 0, 0]}
                    animationDuration={1300}
                    stackId="a"
                  />
                )}
              </BarChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

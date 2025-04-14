"use client";

import { useEffect, useState } from "react";
import {
  IconTrendingUp,
  IconCashBanknote,
  IconShirt,
  IconHanger,
  IconColorSwatch,
  IconChevronUp,
  IconInfoCircle,
  IconCircleCheck,
  IconAlertTriangle,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  parseProductsCSV,
  calculateTotalRevenue,
  getTopSellingProducts,
  getSalesByCategory,
  getAveragePriceByColor,
} from "@/utils/papaparse-util";
import { cn } from "@/lib/utils";

export function SectionCards() {
  const [revenue, setRevenue] = useState(0);
  const [topProduct, setTopProduct] = useState({
    name: "",
    category: "",
    stock: 0,
  });
  const [topCategory, setTopCategory] = useState({ category: "", stock: 0 });
  const [topColor, setTopColor] = useState({
    color: "",
    averagePrice: 0,
    count: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const products = await parseProductsCSV();
        setRevenue(calculateTotalRevenue(products));

        const topProducts = getTopSellingProducts(products, 1);
        if (topProducts.length > 0) setTopProduct(topProducts[0]);

        const categorySales = getSalesByCategory(products);
        if (categorySales.length > 0) setTopCategory(categorySales[0]);

        const colorPrices = getAveragePriceByColor(products);
        if (colorPrices.length > 0) setTopColor(colorPrices[0]);
      } catch (error) {
        console.error("Error loading product data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Get status badge variant based on stock level
  const getStockBadgeVariant = (stock: any) => {
    if (stock >= 100) return "secondary";
    if (stock >= 50) return "secondary";
    return "destructive";
  };

  // Get badge classes based on stock level
  const getStockBadgeClasses = (stock: any) => {
    if (stock >= 100) {
      return "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400";
    }
    if (stock >= 50) {
      return "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400";
    }
    return "";
  };

  // Get status icon based on stock level
  const getStockStatusIcon = (stock: number) => {
    if (stock >= 100) return <IconCircleCheck className="size-3.5 mr-1" />;
    if (stock >= 50) return <IconAlertTriangle className="size-3.5 mr-1" />;
    return <IconAlertTriangle className="size-3.5 mr-1" />;
  };

  return (
    <div className="grid grid-cols-1 gap-6 px-8 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Revenue Card */}
      <Card className="overflow-hidden border-none rounded-xl bg-gradient-to-t from-primary/2 to-white shadow-sm shadow-primary/5 dark:from-primary/3 dark:to-card dark:shadow-primary/3">
        <CardHeader className="pb-0 pt-5">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium text-primary flex items-center gap-1.5">
              Total Revenue
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="size-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total potential revenue based on current stock</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <div className="rounded-full bg-accent p-2 text-primary">
              <IconCashBanknote className="size-6" stroke={2} />
            </div>
          </div>
          <CardTitle className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <span
                className={cn(
                  "text-4xl font-bold",
                  revenue >= 10000 && "text-emerald-700 dark:text-emerald-400",
                  revenue >= 5000 &&
                    revenue < 10000 &&
                    "text-amber-700 dark:text-amber-400",
                  revenue < 5000 && "text-destructive"
                )}
              >
                ${revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <Separator className="my-2" />
        <CardFooter className="flex items-center justify-between pb-5 pt-2">
          <Badge variant="outline" className="font-normal text-primary">
            {isLoading ? "Calculating..." : "Current Stock Value"}
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400"
              >
                <IconChevronUp className="size-3 mr-1" />
                8.3%
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Increase from last month</p>
            </TooltipContent>
          </Tooltip>
        </CardFooter>
      </Card>

      {/* Top Product Card */}
      <Card className="overflow-hidden border-none rounded-xl bg-gradient-to-t from-primary/2 to-white shadow-sm shadow-primary/5 dark:from-primary/3 dark:to-card dark:shadow-primary/3">
        <CardHeader className="pb-0 pt-5">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium text-primary flex items-center gap-1.5">
              Top Selling Product
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="size-3.5 text-primary cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Product with highest stock level</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <div className="rounded-full bg-accent p-2 text-primary">
              <IconShirt className="size-6" stroke={2} />
            </div>
          </div>
          <CardTitle className="mt-2 line-clamp-1 text-3xl font-semibold tracking-tight group">
            <Tooltip>
              <TooltipTrigger className="cursor-default">
                {isLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  topProduct.name
                )}
              </TooltipTrigger>
              <TooltipContent>
                <p>{topProduct.name}</p>
              </TooltipContent>
            </Tooltip>
          </CardTitle>
        </CardHeader>
        <Separator className="my-2" />
        <CardFooter className="flex items-center justify-between pb-5 pt-2">
          <div className="flex items-center gap-2">
            {!isLoading && (
              <Badge
                variant={getStockBadgeVariant(topProduct.stock)}
                className={cn(
                  "font-mono",
                  getStockBadgeClasses(topProduct.stock)
                )}
              >
                {getStockStatusIcon(topProduct.stock)}
                {topProduct.stock} units
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="capitalize text-primary">
            {isLoading ? "..." : topProduct.category}
          </Badge>
        </CardFooter>
      </Card>

      {/* Top Category Card */}
      <Card className="overflow-hidden border-none rounded-xl bg-gradient-to-t from-primary/2 to-white shadow-sm shadow-primary/5 dark:from-primary/3 dark:to-card dark:shadow-primary/3">
        <CardHeader className="pb-0 pt-5">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium text-primary flex items-center gap-1.5">
              Top Product Category
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="size-3.5 text-primary cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Category with highest stock levels</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <div className="rounded-full bg-accent p-2 text-primary">
              <IconHanger className="size-6" stroke={2} />
            </div>
          </div>
          <CardTitle className="mt-2 text-3xl font-semibold tracking-tight ">
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              topCategory.category
            )}
          </CardTitle>
        </CardHeader>
        <Separator className="my-2" />
        <CardFooter className="flex items-center justify-between pb-5 pt-2">
          <div className="flex items-center gap-2">
            {!isLoading && (
              <Badge
                variant={getStockBadgeVariant(topCategory.stock)}
                className={cn(
                  "font-mono",
                  getStockBadgeClasses(topCategory.stock)
                )}
              >
                {getStockStatusIcon(topCategory.stock)}
                {topCategory.stock} units
              </Badge>
            )}
          </div>
          <Badge variant="outline" className="bg-chart-3/5  text-primary">
            <IconTrendingUp className="size-3 mr-1" />
            Popular
          </Badge>
        </CardFooter>
      </Card>

      {/* Top Color Card */}
      <Card className="overflow-hidden border-none rounded-xl bg-gradient-to-t from-primary/2 to-white shadow-sm shadow-primary/5 dark:from-primary/3 dark:to-card dark:shadow-primary/3">
        <CardHeader className="pb-0 pt-5">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium text-primary flex items-center gap-1.5">
              Most Popular Color
              <Tooltip>
                <TooltipTrigger asChild>
                  <IconInfoCircle className="size-3.5 text-primary cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Color used in most products</p>
                </TooltipContent>
              </Tooltip>
            </CardDescription>
            <div className="rounded-full bg-accent p-2 text-primary">
              <IconColorSwatch className="size-6" stroke={2} />
            </div>
          </div>
          <CardTitle className="mt-2 flex items-center gap-2 text-3xl font-semibold tracking-tight">
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <>
                <div
                  className="size-10 rounded-full border border-muted"
                  style={{ backgroundColor: getColorHex(topColor.color) }}
                />
                {topColor.color}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <Separator className="my-2" />
        <CardFooter className="flex flex-wrap items-center justify-between pb-5 pt-2 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-chart-2/5 text-primary">
                <IconCashBanknote className="size-3 mr-1" />$
                {topColor.averagePrice.toFixed(2)} avg
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Average price of products with this color</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="outline" className="bg-chart-2/5 text-primary">
                <IconShirt className="size-3 mr-1" />
                {topColor.count} products
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Number of products using this color</p>
            </TooltipContent>
          </Tooltip>
        </CardFooter>
      </Card>
    </div>
  );
}

// Helper function to get a hex color from color name
function getColorHex(colorName: number | string): string {
  const colorMap: Record<string, string> = {
    "Persian Pink": "#F77FBE",
    Beige: "#F5F5DC",
    "Medium Slate Blue": "#7B68EE",
    "Pale Azure": "#77C3EC",
    Emerald: "#50C878",
    Black: "#000000",
  };

  // Convert number to string if needed before lookup
  const key = typeof colorName === "number" ? colorName.toString() : colorName;
  return colorMap[key] || "#CCCCCC";
}

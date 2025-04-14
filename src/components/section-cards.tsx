"use client";

import { useEffect, useState } from "react";
import {
  IconTrendingUp,
  IconCashBanknote,
  IconShirt,
  IconHanger,
  IconColorSwatch,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  parseProductsCSV,
  calculateTotalRevenue,
  getTopSellingProducts,
  getSalesByCategory,
  getAveragePriceByColor,
} from "@/utils/papaparse-util";

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

  return (
    <div className="grid grid-cols-1 gap-6 px-8 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {/* Revenue Card */}
      <Card className="overflow-hidden border-none rounded-xl bg-gradient-to-t from-primary/2 to-white shadow-sm shadow-primary/5 dark:from-primary/3 dark:to-card dark:shadow-primary/3">
        <CardHeader className="pb-0 pt-5">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium text-primary">
              Total Revenue
            </CardDescription>
            <div className="rounded-full bg-accent p-2 text-primary">
              <IconCashBanknote className="size-6" stroke={2} />
            </div>
          </div>
          <CardTitle className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">
            {isLoading
              ? "Loading..."
              : `$${revenue.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}`}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex items-center justify-between pb-5 pt-4">
          <div className="text-sm text-primary">
            {isLoading ? "Calculating..." : "Based on current stock"}
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-primary">
            <IconTrendingUp className="size-4" />
            <span>+8.3%</span>
          </div>
        </CardFooter>
      </Card>

      {/* Top Product Card */}
      <Card className="overflow-hidden border-none rounded-xl bg-gradient-to-t from-primary/2 to-white shadow-sm shadow-primary/5 dark:from-primary/3 dark:to-card dark:shadow-primary/3">
        <CardHeader className="pb-0 pt-5">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium text-primary">
              Top Selling Product
            </CardDescription>
            <div className="rounded-full bg-accent p-2 text-primary">
              <IconShirt className="size-6" stroke={2} />
            </div>
          </div>
          <CardTitle className="mt-2 line-clamp-1 text-3xl font-semibold tracking-tight">
            {isLoading ? "Loading..." : topProduct.name}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex items-center justify-between pb-5 pt-4">
          <div className="text-sm text-primary">
            {isLoading ? "Analyzing..." : `${topProduct.stock} units in stock`}
          </div>
          <div className="font-medium text-sm text-primary">
            {isLoading ? "..." : topProduct.category}
          </div>
        </CardFooter>
      </Card>

      {/* Top Category Card */}
      <Card className="overflow-hidden border-none rounded-xl bg-gradient-to-t from-chart-3/2 to-white shadow-sm shadow-chart-3/5 dark:from-chart-3/3 dark:to-card dark:shadow-chart-3/3">
        <CardHeader className="pb-0 pt-5">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium text-primary">
              Top Product Category
            </CardDescription>
            <div className="rounded-full bg-accent p-2 text-chart-3">
              <IconHanger className="size-6" stroke={2} />
            </div>
          </div>
          <CardTitle className="mt-2 text-3xl font-semibold tracking-tight">
            {isLoading ? "Loading..." : topCategory.category}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex items-center justify-between pb-5 pt-4">
          <div className="text-sm text-primary">
            {isLoading
              ? "Calculating..."
              : `${topCategory.stock} units in stock`}
          </div>
          <div className="flex items-center gap-1 text-sm font-medium text-primary">
            <IconTrendingUp className="size-4" />
            <span>Popular</span>
          </div>
        </CardFooter>
      </Card>

      {/* Top Color Card */}
      <Card className="overflow-hidden border-none rounded-xl bg-gradient-to-t from-chart-2/2 to-white shadow-sm shadow-chart-2/5 dark:from-chart-2/3 dark:to-card dark:shadow-chart-2/3">
        <CardHeader className="pb-0 pt-5">
          <div className="flex items-center justify-between">
            <CardDescription className="text-sm font-medium text-primary">
              Most Popular Color
            </CardDescription>
            <div className="rounded-full bg-accent p-2 text-chart-2">
              <IconColorSwatch className="size-6" stroke={2} />
            </div>
          </div>
          <CardTitle className="mt-2 text-3xl font-semibold tracking-tight">
            {isLoading ? "Loading..." : topColor.color}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex items-center justify-between pb-5 pt-4">
          <div className="text-sm text-primary">
            {isLoading
              ? "Analyzing..."
              : `$${topColor.averagePrice.toFixed(2)} avg price`}
          </div>
          <div className="text-sm font-medium text-primary">
            {isLoading ? "..." : `${topColor.count} products`}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

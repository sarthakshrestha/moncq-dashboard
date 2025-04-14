import { toast } from "sonner";
import { Product } from "@/utils/papaparse-util";

// Function to format price with currency
export function formatPrice(price: string, currency: string): string {
  const numericPrice = parseFloat(price.replace(/[^0-9.-]+/g, ""));
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency || "AUD",
  }).format(numericPrice);
}

// Parse available sizes from string to array
export function parseSizes(sizesStr: string): string[] {
  try {
    // Remove brackets and single quotes, then split by commas
    return sizesStr.replace(/[\[\]']/g, "").split(", ");
  } catch (e) {
    return [];
  }
}

// Helper function to get a hex color from color name
export function getColorHex(colorName: string): string {
  const colorMap: Record<string, string> = {
    "Persian Pink": "#F77FBE",
    Beige: "#F5F5DC",
    "Medium Slate Blue": "#7B68EE",
    "Pale Azure": "#77C3EC",
    Emerald: "#50C878",
    Black: "#000000",
  };

  return colorMap[colorName] || "#CCCCCC";
}

// Action handlers for product operations
export function handleEdit(product: Product) {
  toast.info(`Editing ${product.name}`, {
    description: "This would open an edit form.",
  });
}

export function handleAdjustStock(product: Product) {
  toast.info(`Adjusting stock for ${product.name}`, {
    description: "Stock management modal would open here.",
  });
}

export function handlePromote(product: Product) {
  toast.success(`${product.name} added to promotions`, {
    description: "Product will be featured in promotional materials.",
  });
}

export function handleDelete(product: Product) {
  toast.error(`Deleting ${product.name}`, {
    description: "This would prompt for confirmation.",
  });
}

// Sales data for mini chart in product details
export const getProductSalesData = (product: Product) => {
  // This would normally come from API, we're generating mock data
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const month = new Date(now);
    month.setMonth(month.getMonth() - (5 - i));
    return month.toLocaleDateString("en-US", { month: "short" });
  });

  // Generate random but sensible sales data based on current stock
  const baseStock = product.stock / 6;
  const sales = months.map((month) => ({
    month,
    sales: Math.floor(baseStock * 0.8 + Math.random() * baseStock * 0.4),
    returns: Math.floor(baseStock * 0.05 + Math.random() * baseStock * 0.1),
  }));

  return sales;
};

// Get available categories from products array
export function getAvailableCategories(products: Product[]): string[] {
  const categories = new Set<string>();
  products.forEach((product) => {
    categories.add(product.category);
  });
  return Array.from(categories).sort();
}

// Calculate metrics for categories
export function getCategoryMetrics(products: Product[]) {
  const categoryMap = new Map<
    string,
    { stock: number; revenue: number; count: number }
  >();

  products.forEach((product) => {
    const category = product.category;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, { stock: 0, revenue: 0, count: 0 });
    }

    const metrics = categoryMap.get(category)!;
    const price = parseFloat(product.price.replace(/[^0-9.-]+/g, ""));

    metrics.stock += product.stock;
    metrics.revenue += price * product.stock;
    metrics.count += 1;
  });

  return Array.from(categoryMap.entries()).map(([category, metrics]) => ({
    category,
    ...metrics,
  }));
}

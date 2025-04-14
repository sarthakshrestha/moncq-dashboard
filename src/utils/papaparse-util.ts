import Papa from "papaparse";

// Define the Product type based on the CSV structure
export interface Product {
  product_id: number;
  name: string;
  category: string;
  color: string;
  size_available: string;
  price: string;
  Currency: string;
  stock: number;
  release_date: string;
}

// Function to parse the CSV file
export async function parseProductsCSV(): Promise<Product[]> {
  try {
    const response = await fetch("/data/Dataset(Products).csv");
    const csvText = await response.text();

    const { data } = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transform: (value, field) => {
        if (field === "product_id" || field === "stock") {
          return parseInt(value);
        }
        return value;
      },
    });

    return data as Product[];
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return [];
  }
}

// Calculate total revenue
export function calculateTotalRevenue(products: Product[]): number {
  return products.reduce((total, product) => {
    const price = parseFloat(product.price.replace(/[^0-9.-]+/g, ""));
    return total + price * product.stock;
  }, 0);
}

// Get top selling products based on stock
export function getTopSellingProducts(
  products: Product[],
  limit: number = 3
): Array<{ name: string; category: string; stock: number }> {
  return [...products]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, limit)
    .map((product) => ({
      name: product.name,
      category: product.category,
      stock: product.stock,
    }));
}

// Get sales by category
export function getSalesByCategory(
  products: Product[]
): Array<{ category: string; stock: number }> {
  const categories = products.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = 0;
    }
    acc[product.category] += product.stock;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categories)
    .map(([category, stock]) => ({
      category,
      stock,
    }))
    .sort((a, b) => b.stock - a.stock);
}

// Custom metric: Average price by color
export function getAveragePriceByColor(
  products: Product[]
): Array<{ color: string; averagePrice: number; count: number }> {
  const colorsData = products.reduce((acc, product) => {
    if (!acc[product.color]) {
      acc[product.color] = {
        totalPrice: 0,
        count: 0,
      };
    }

    const price = parseFloat(product.price.replace(/[^0-9.-]+/g, ""));
    acc[product.color].totalPrice += price;
    acc[product.color].count += 1;

    return acc;
  }, {} as Record<string, { totalPrice: number; count: number }>);

  return Object.entries(colorsData)
    .map(([color, data]) => ({
      color,
      averagePrice: data.totalPrice / data.count,
      count: data.count,
    }))
    .sort((a, b) => b.count - a.count);
}

// Aggregate product data for the chart by release date
export function aggregateProductData(
  products: Product[]
): Array<{ date: string; desktop: number; mobile: number }> {
  // Group products by release date
  const productsByDate = products.reduce((acc, product) => {
    // Parse the date in MM/DD/YYYY format
    const dateParts = product.release_date.split("/");
    const month = parseInt(dateParts[0]);
    const day = parseInt(dateParts[1]);
    const year = parseInt(dateParts[2]);

    // Format as YYYY-MM-DD for the chart
    const dateStr = `${year}-${month.toString().padStart(2, "0")}-${day
      .toString()
      .padStart(2, "0")}`;

    // Determine if this is a main category (will be shown as "desktop")
    const isMainCategory = ["Sweatshirts", "Hoodies", "Jackets"].includes(
      product.category
    );

    if (!acc[dateStr]) {
      acc[dateStr] = { desktop: 0, mobile: 0 };
    }

    // Add stock to the appropriate category
    if (isMainCategory) {
      acc[dateStr].desktop += product.stock;
    } else {
      acc[dateStr].mobile += product.stock;
    }

    return acc;
  }, {} as Record<string, { desktop: number; mobile: number }>);

  // Convert to array and sort by date
  return Object.entries(productsByDate)
    .map(([date, values]) => ({
      date,
      desktop: values.desktop,
      mobile: values.mobile,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

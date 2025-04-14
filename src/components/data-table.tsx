"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconSearch,
  IconTag,
  IconTrendingUp,
  IconChartBar,
  IconDatabase,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  Tooltip as RechartsTooltip,
} from "recharts";
import { toast } from "sonner";

import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  parseProductsCSV,
  type Product,
  getSalesByCategory,
} from "@/utils/papaparse-util";

// Import utility functions from the new table-util.ts file
import {
  formatPrice,
  parseSizes,
  getColorHex,
  handleEdit,
  handleAdjustStock,
  handlePromote,
  handleDelete,
  getProductSalesData,
  getAvailableCategories,
  getCategoryMetrics,
} from "@/utils/table-util";

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

const columns: ColumnDef<Product>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.product_id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "product_id",
    header: "ID",
    cell: ({ row }) => (
      <div className="w-10 text-center font-mono text-xs">
        {row.original.product_id}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => {
      return <ProductTableCellViewer product={row.original} />;
    },
    enableHiding: false,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.category}
        </Badge>
      </div>
    ),
    filterFn: "equals",
  },
  {
    accessorKey: "color",
    header: "Color",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div
          className="size-4 rounded-full border"
          style={{
            backgroundColor: getColorHex(row.original.color),
            borderColor: "currentColor",
          }}
        />
        {row.original.color}
      </div>
    ),
  },
  {
    accessorKey: "price",
    header: () => <div className="w-full text-right">Price (AUD)</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium">
        {formatPrice(row.original.price, row.original.Currency)}
      </div>
    ),
  },
  {
    accessorKey: "stock",
    header: () => <div className="w-full text-right">Stock</div>,
    cell: ({ row }) => {
      const stock = row.original.stock;
      return (
        <div className="text-right">
          <Badge
            variant={stock < 50 ? "destructive" : "secondary"}
            className={cn(
              "font-mono",
              stock >= 100 &&
                "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:bg-emerald-500/15 dark:text-emerald-400",
              stock >= 50 &&
                stock < 100 &&
                "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400"
            )}
          >
            {stock}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "release_date",
    header: "Release Date",
    cell: ({ row }) => {
      // Parse the MM/DD/YYYY format
      const dateParts = row.original.release_date.split("/");
      const date = new Date(
        parseInt(dateParts[2]), // year
        parseInt(dateParts[0]) - 1, // month (0-indexed)
        parseInt(dateParts[1]) // day
      );

      // Calculate if the release is upcoming
      const isUpcoming = date > new Date();

      return (
        <div className="whitespace-nowrap">
          {date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
          {isUpcoming && (
            <Badge className="ml-2" variant="outline">
              Upcoming
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-36">
          <DropdownMenuItem onClick={() => handleEdit(row.original)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAdjustStock(row.original)}>
            Adjust Stock
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handlePromote(row.original)}>
            Promote
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => handleDelete(row.original)}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

function DraggableRow({ row }: { row: Row<Product> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.product_id,
  });

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  );
}

const chartConfig = {
  sales: {
    label: "Sales",
    color: "var(--chart-3)",
  },
  returns: {
    label: "Returns",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function ProductTableCellViewer({ product }: { product: Product }) {
  const isMobile = useIsMobile();
  const salesData = React.useMemo(
    () => getProductSalesData(product),
    [product]
  );
  const sizes = React.useMemo(
    () => parseSizes(product.size_available),
    [product.size_available]
  );

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {product.name}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-w-screen-md mx-auto">
        <DrawerHeader className="gap-1">
          <DrawerTitle className="flex items-center gap-3">
            {product.name}
            <Badge variant="outline" className="ml-2">
              {product.category}
            </Badge>
          </DrawerTitle>
          <DrawerDescription>
            Product ID: {product.product_id} • Released on{" "}
            {new Date(product.release_date).toLocaleDateString()}
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="aspect-square bg-muted/20 rounded-md flex items-center justify-center border">
                    <div className="text-6xl">
                      <IconTag strokeWidth={1} className="opacity-30" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Color</h4>
                      <div className="flex items-center gap-2">
                        <div
                          className="size-4 rounded-full border"
                          style={{
                            backgroundColor: getColorHex(product.color),
                            borderColor: "currentColor",
                          }}
                        />
                        {product.color}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Price</h4>
                      <div className="font-medium">
                        {formatPrice(product.price, product.Currency)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Stock</h4>
                      <div className="font-medium">{product.stock} units</div>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Available Sizes</h4>
                      <div className="flex flex-wrap gap-1">
                        {sizes.map((size) => (
                          <Badge
                            key={size}
                            variant="secondary"
                            className="font-mono"
                          >
                            {size}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="font-medium text-base">Sales Performance</div>
                  <ChartContainer config={chartConfig}>
                    <AreaChart
                      accessibilityLayer
                      data={salesData}
                      margin={{ left: 0, right: 10, top: 10, bottom: 10 }}
                    >
                      <CartesianGrid vertical={false} strokeOpacity={0.2} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                      />
                      <Area
                        dataKey="returns"
                        type="monotone"
                        fill="var(--chart-1)"
                        fillOpacity={0.6}
                        stroke="var(--chart-1)"
                        stackId="a"
                      />
                      <Area
                        dataKey="sales"
                        type="monotone"
                        fill="var(--chart-3)"
                        fillOpacity={0.4}
                        stroke="var(--chart-3)"
                        stackId="a"
                      />
                    </AreaChart>
                  </ChartContainer>
                  <div className="grid gap-2">
                    <div className="flex gap-2 leading-none font-medium">
                      {product.stock > 100 ? (
                        <>
                          Strong inventory levels{" "}
                          <IconTrendingUp className="size-4" />
                        </>
                      ) : product.stock > 50 ? (
                        <>Moderate inventory</>
                      ) : (
                        <>Low inventory - consider restocking</>
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      This product is part of the {product.name.split(" ")[0]}{" "}
                      collection. The chart shows sales and returns over the
                      past 6 months.
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" defaultValue={product.name} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="category">Category</Label>
                <Select defaultValue={product.category}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sweatshirts">Sweatshirts</SelectItem>
                    <SelectItem value="Hoodies">Hoodies</SelectItem>
                    <SelectItem value="Jackets">Jackets</SelectItem>
                    <SelectItem value="Accessories">Accessories</SelectItem>
                    <SelectItem value="Lounge Pants">Lounge Pants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="color">Color</Label>
                <Select defaultValue={product.color}>
                  <SelectTrigger id="color" className="w-full">
                    <SelectValue placeholder="Select a color" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Persian Pink">Persian Pink</SelectItem>
                    <SelectItem value="Beige">Beige</SelectItem>
                    <SelectItem value="Medium Slate Blue">
                      Medium Slate Blue
                    </SelectItem>
                    <SelectItem value="Pale Azure">Pale Azure</SelectItem>
                    <SelectItem value="Emerald">Emerald</SelectItem>
                    <SelectItem value="Black">Black</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="price">Price ({product.Currency})</Label>
                <Input
                  id="price"
                  defaultValue={product.price.replace(/[^0-9.-]+/g, "")}
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" defaultValue={product.stock} type="number" />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="release_date">Release Date</Label>
              <Input
                id="release_date"
                type="date"
                defaultValue={(() => {
                  const parts = product.release_date.split("/");
                  return `${parts[2]}-${parts[0].padStart(
                    2,
                    "0"
                  )}-${parts[1].padStart(2, "0")}`;
                })()}
              />
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button onClick={() => toast.success("Product updated successfully")}>
            Save Changes
          </Button>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function ProductDataTable() {
  const [data, setData] = React.useState<Product[]>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedCollection, setSelectedCollection] =
    React.useState<string>("all");

  // New state variables for category filtering and metrics
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [categories, setCategories] = React.useState<string[]>([]);
  const [metricType, setMetricType] = React.useState<
    "stock" | "revenue" | "count"
  >("stock");
  const [categoryMetrics, setCategoryMetrics] = React.useState<any[]>([]);
  const [showCategoryMetrics, setShowCategoryMetrics] = React.useState(false);

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  // Load data using papaparse utility
  React.useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const products = await parseProductsCSV();
        console.log("Loaded products:", products.length);
        setData(products);

        // Extract available categories
        const availableCategories = getAvailableCategories(products);
        console.log("Available categories:", availableCategories);
        setCategories(availableCategories);

        // Calculate metrics for the categories
        const metrics = getCategoryMetrics(products);
        setCategoryMetrics(metrics);
      } catch (error) {
        console.error("Error loading product data:", error);
        toast.error("Failed to load product data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Update category metrics when data changes
  React.useEffect(() => {
    if (data.length > 0) {
      console.log("Updating category metrics based on data changes");
      setCategoryMetrics(getCategoryMetrics(data));
    }
  }, [data]);

  // Create table instance before using it in effects
  const filteredData = React.useMemo(() => {
    console.log("Filtering data:");
    console.log("- Collection:", selectedCollection);
    console.log("- Category:", selectedCategory);
    console.log("- Starting with", data.length, "products");

    let filtered = data;

    // Filter by collection (based on product name prefix)
    if (selectedCollection !== "all") {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().startsWith(selectedCollection.toLowerCase())
      );
      console.log(
        "After collection filter:",
        filtered.length,
        "products remain"
      );
    }

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
      console.log("After category filter:", filtered.length, "products remain");
    }

    return filtered;
  }, [data, selectedCollection, selectedCategory]);

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => filteredData?.map(({ product_id }) => product_id) || [],
    [filteredData]
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    getRowId: (row) => row.product_id.toString(),
    enableRowSelection: true,
    enableFilters: true, // Enable filtering explicitly
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  // Apply category filter directly to the table when category changes
  React.useEffect(() => {
    console.log("Selected category changed to:", selectedCategory);

    if (table) {
      if (selectedCategory !== "all") {
        console.log("Setting category column filter to:", selectedCategory);

        // Method 1: Update through column filters state
        setColumnFilters((prev) => {
          const filtered = prev.filter((filter) => filter.id !== "category");
          console.log("Adding category filter to column filters");
          return [...filtered, { id: "category", value: selectedCategory }];
        });

        // Method 2: Direct column API
        const categoryColumn = table.getColumn("category");
        if (categoryColumn) {
          categoryColumn.setFilterValue(selectedCategory);
          console.log("Filter applied directly to category column");
        } else {
          console.log("Category column not found in table");
        }
      } else {
        console.log("Clearing category filter");

        // Remove from column filters state
        setColumnFilters((prev) => {
          const filtered = prev.filter((filter) => filter.id !== "category");
          console.log("Removed category filter from column filters");
          return filtered;
        });

        // Clear via column API
        const categoryColumn = table.getColumn("category");
        if (categoryColumn) {
          categoryColumn.setFilterValue(undefined);
          console.log("Category column filter cleared");
        }
      }
    }
  }, [selectedCategory, table]);

  // Log when collection changes
  React.useEffect(() => {
    console.log("Selected collection changed to:", selectedCollection);
  }, [selectedCollection]);

  // Log when metrics visibility changes
  React.useEffect(() => {
    console.log("Category metrics visibility changed to:", showCategoryMetrics);
  }, [showCategoryMetrics]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(data, oldIndex, newIndex);
      });
    }
  }

  return (
    <Tabs
      defaultValue="all"
      className="w-full flex-col justify-start gap-4"
      onValueChange={(value) => {
        console.log("Collection tab changed to:", value);
        setSelectedCollection(value);
      }}
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold hidden md:block">
            Product Inventory
          </h2>
          <div className="relative max-w-sm">
            <IconSearch className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-[300px]"
              value={globalFilter}
              onChange={(e) => {
                console.log("Global search changed:", e.target.value);
                setGlobalFilter(e.target.value);
              }}
            />
          </div>
        </div>
      </div>

      {/* NEW: Category tabs instead of dropdown */}
      {/* Responsive Category Filter */}
      {/* Responsive Category Filter */}
      <div className="px-4 lg:px-6 max-w-3xl flex-col justify-end">
        <div className="text-xs text-muted-foreground mb-1 font-medium">
          Filter by Category
        </div>

        {/* Use isMobile hook to conditionally render different UI */}
        {useIsMobile() ? (
          <Select
            value={selectedCategory}
            onValueChange={(value) => {
              console.log(
                "Category select changed from",
                selectedCategory,
                "to",
                value
              );
              setSelectedCategory(value);
            }}
          >
            <SelectTrigger className="w-full border-2 dark:border-zinc-900 dark:bg-zinc-900/70 dark:text-white shadow-sm">
              <SelectValue
                placeholder={
                  selectedCategory === "all"
                    ? "All Categories"
                    : selectedCategory
                }
                className="font-medium"
              />
            </SelectTrigger>
            <SelectContent className="dark:bg-zinc-900 dark:border-zinc-900">
              <SelectItem value="all" className="dark:focus:bg-zinc-900">
                All Categories
              </SelectItem>
              {categories.map((category) => (
                <SelectItem
                  key={category}
                  value={category}
                  className="dark:focus:bg-zinc-900"
                >
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Tabs
            value={selectedCategory}
            onValueChange={(value) => {
              console.log(
                "Category tab changed from",
                selectedCategory,
                "to",
                value
              );
              setSelectedCategory(value);
            }}
          >
            <TabsList className="w-full justify-start flex-wrap dark:bg-zinc-900/70 dark:border dark:border-zinc-700 p-1">
              <TabsTrigger
                value="all"
                className="dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground dark:text-slate-200 dark:hover:bg-slate-800/70"
              >
                All Categories
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground dark:text-slate-200 dark:hover:bg-zinc-800/70"
                >
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Category Metrics Visualization with console logs */}
      {showCategoryMetrics && (
        <div className="px-4 lg:px-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-medium">
                    Sales by Category
                  </CardTitle>
                  <CardDescription>
                    {metricType === "stock"
                      ? "Stock levels by product category"
                      : metricType === "revenue"
                      ? "Revenue breakdown by category"
                      : "Number of products by category"}
                  </CardDescription>
                </div>
                <Select
                  value={metricType}
                  onValueChange={(value: any) => {
                    console.log("Metrics type changed to:", value);
                    setMetricType(value);
                  }}
                >
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock Levels</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="count">Product Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="h-[220px]">
                <BarChart
                  data={categoryMetrics}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    strokeOpacity={0.3}
                  />
                  <XAxis
                    dataKey="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => {
                      if (metricType === "revenue") {
                        return value >= 1000
                          ? `$${Math.round(value / 1000)}k`
                          : `$${value}`;
                      }
                      return value;
                    }}
                  />
                  <RechartsTooltip
                    formatter={(value: any) => {
                      if (metricType === "revenue") {
                        return [`$${value.toLocaleString()}`, "Revenue"];
                      }
                      return [
                        value.toLocaleString(),
                        metricType === "stock" ? "Stock" : "Products",
                      ];
                    }}
                    labelFormatter={(label) => `Category: ${label}`}
                  />
                  <Bar
                    dataKey={metricType}
                    fill="var(--chart-3)"
                    radius={[4, 4, 0, 0]}
                    name={
                      metricType === "stock"
                        ? "Stock"
                        : metricType === "revenue"
                        ? "Revenue"
                        : "Products"
                    }
                  />
                </BarChart>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <TabsContent
        value="all"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6 data-[state=inactive]:hidden"
      >
        <div className="overflow-hidden rounded-lg border">
          {isLoading ? (
            <div className="flex items-center justify-center h-[400px] w-full">
              <IconLoader className="mr-2 h-4 w-4 animate-spin" />
              <span>Loading product data...</span>
            </div>
          ) : (
            <DndContext
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragEnd={handleDragEnd}
              sensors={sensors}
              id={sortableId}
            >
              <Table>
                <TableHeader className="bg-muted sticky top-0 z-10">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead key={header.id} colSpan={header.colSpan}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody className="**:data-[slot=table-cell]:first:w-8">
                  {table.getRowModel().rows?.length ? (
                    <SortableContext
                      items={dataIds}
                      strategy={verticalListSortingStrategy}
                    >
                      {table.getRowModel().rows.map((row) => (
                        <DraggableRow key={row.id} row={row} />
                      ))}
                    </SortableContext>
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No products found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          )}
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} product(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Products per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  console.log("Page size changed to:", value);
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>

      {/* These tabs show filtered content for each collection */}
      <TabsContent value="oversized" className="data-[state=inactive]:hidden">
        {/* This content will show because the parent Tabs component handles filtering */}
      </TabsContent>
      <TabsContent value="fitted" className="data-[state=inactive]:hidden">
        {/* This content will show because the parent Tabs component handles filtering */}
      </TabsContent>
      <TabsContent value="classic" className="data-[state=inactive]:hidden">
        {/* This content will show because the parent Tabs component handles filtering */}
      </TabsContent>
    </Tabs>
  );
}

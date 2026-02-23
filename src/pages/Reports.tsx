import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getItems, getTransactions } from "@/lib/inventory-store";
import { getStockStatus, formatStock, CATEGORIES } from "@/lib/types";
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { Package, ArrowDownUp, TrendingUp, AlertTriangle } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

const STATUS_STYLES: Record<string, string> = {
  safe: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  mid: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABEL: Record<string, string> = { safe: "Aman", mid: "Menipis", low: "Kritis" };

const Reports = () => {
  const items = useMemo(() => getItems(), []);
  const transactions = useMemo(() => getTransactions(), []);

  const [monthFilter, setMonthFilter] = useState(() => format(new Date(), "yyyy-MM"));

  // Generate last 12 months for filter
  const monthOptions = useMemo(() => {
    const opts = [];
    for (let i = 0; i < 12; i++) {
      const d = subMonths(new Date(), i);
      opts.push({ value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy", { locale: id }) });
    }
    return opts;
  }, []);

  // Filtered transactions by month
  const filteredTx = useMemo(() => {
    const [y, m] = monthFilter.split("-").map(Number);
    const start = startOfMonth(new Date(y, m - 1));
    const end = endOfMonth(new Date(y, m - 1));
    return transactions.filter((tx) =>
      isWithinInterval(new Date(tx.timestamp), { start, end })
    );
  }, [transactions, monthFilter]);

  // Stock summary
  const stockSummary = useMemo(() => {
    return items.map((item) => {
      const status = getStockStatus(item.stock, item.minStock);
      return { ...item, status, stockDisplay: formatStock(item.stock, item.baseUnit, item.units) };
    }).sort((a, b) => {
      const order = { low: 0, mid: 1, safe: 2 };
      return order[a.status] - order[b.status];
    });
  }, [items]);

  // Category movement chart data
  const categoryData = useMemo(() => {
    const map: Record<string, { category: string; masuk: number; keluar: number }> = {};
    CATEGORIES.forEach((c) => (map[c] = { category: c, masuk: 0, keluar: 0 }));
    filteredTx.forEach((tx) => {
      const item = items.find((i) => i.id === tx.itemId);
      if (item && map[item.category]) {
        if (tx.type === "in") map[item.category].masuk += tx.baseQuantity;
        else map[item.category].keluar += tx.baseQuantity;
      }
    });
    return Object.values(map).filter((d) => d.masuk > 0 || d.keluar > 0);
  }, [filteredTx, items]);

  const chartConfig: ChartConfig = {
    masuk: { label: "Masuk", color: "hsl(var(--primary))" },
    keluar: { label: "Keluar", color: "hsl(var(--destructive, 0 84% 60%))" },
  };

  // Stats
  const stats = useMemo(() => {
    const totalIn = filteredTx.filter((t) => t.type === "in").reduce((s, t) => s + t.baseQuantity, 0);
    const totalOut = filteredTx.filter((t) => t.type === "out").reduce((s, t) => s + t.baseQuantity, 0);
    const lowItems = items.filter((i) => getStockStatus(i.stock, i.minStock) === "low").length;
    return { totalIn, totalOut, txCount: filteredTx.length, lowItems };
  }, [filteredTx, items]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-foreground">Laporan</h1>
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5"><Package className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Total Transaksi</p>
                <p className="text-xl font-bold text-foreground">{stats.txCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2.5"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Barang Masuk</p>
                <p className="text-xl font-bold text-foreground">{stats.totalIn.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/30 p-2.5"><ArrowDownUp className="h-5 w-5 text-blue-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Barang Keluar</p>
                <p className="text-xl font-bold text-foreground">{stats.totalOut.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-red-100 dark:bg-red-900/30 p-2.5"><AlertTriangle className="h-5 w-5 text-red-600" /></div>
              <div>
                <p className="text-xs text-muted-foreground">Stok Kritis</p>
                <p className="text-xl font-bold text-foreground">{stats.lowItems}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stock">Ringkasan Stok</TabsTrigger>
            <TabsTrigger value="transactions">Riwayat Transaksi</TabsTrigger>
            <TabsTrigger value="chart">Grafik Kategori</TabsTrigger>
          </TabsList>

          {/* Tab: Stock Summary */}
          <TabsContent value="stock">
            <Card>
              <CardHeader><CardTitle className="text-lg">Ringkasan Stok Barang</CardTitle></CardHeader>
              <CardContent>
                {stockSummary.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Belum ada data barang.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama Barang</TableHead>
                          <TableHead>SKU</TableHead>
                          <TableHead>Kategori</TableHead>
                          <TableHead className="text-right">Stok</TableHead>
                          <TableHead className="text-right">Min. Stok</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stockSummary.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                            <TableCell>{item.category}</TableCell>
                            <TableCell className="text-right">{item.stockDisplay}</TableCell>
                            <TableCell className="text-right">{item.minStock} {item.baseUnit}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={STATUS_STYLES[item.status]}>
                                {STATUS_LABEL[item.status]}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Transaction History */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader><CardTitle className="text-lg">Riwayat Transaksi</CardTitle></CardHeader>
              <CardContent>
                {filteredTx.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Tidak ada transaksi di bulan ini.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Barang</TableHead>
                          <TableHead>Tipe</TableHead>
                          <TableHead className="text-right">Jumlah</TableHead>
                          <TableHead>Referensi</TableHead>
                          <TableHead>User</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTx.map((tx) => (
                          <TableRow key={tx.id}>
                            <TableCell className="text-muted-foreground whitespace-nowrap">
                              {format(new Date(tx.timestamp), "dd MMM yyyy HH:mm", { locale: id })}
                            </TableCell>
                            <TableCell className="font-medium">{tx.itemName}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={tx.type === "in"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              }>
                                {tx.type === "in" ? "Masuk" : "Keluar"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">{tx.quantity} {tx.unit}</TableCell>
                            <TableCell className="text-muted-foreground">{tx.reference || "-"}</TableCell>
                            <TableCell className="text-muted-foreground">{tx.user}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Category Chart */}
          <TabsContent value="chart">
            <Card>
              <CardHeader><CardTitle className="text-lg">Pergerakan per Kategori</CardTitle></CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Tidak ada data transaksi di bulan ini.</p>
                ) : (
                  <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <BarChart data={categoryData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="masuk" fill="var(--color-masuk)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="keluar" fill="var(--color-keluar)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Reports;

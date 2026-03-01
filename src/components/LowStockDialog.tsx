import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { Item, getStockStatus, formatStock } from "@/lib/types";
import { getIconByName } from "@/components/IconPicker";
import { Transaction } from "@/lib/types";

interface LowStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: Item[];
  transactions: Transaction[];
}

const ITEMS_PER_PAGE = 5;

export function LowStockDialog({ open, onOpenChange, items, transactions }: LowStockDialogProps) {
  const [page, setPage] = useState(0);

  // Get low stock items sorted by the most recent transaction that made them low
  const lowStockItems = useMemo(() => {
    const lowItems = items.filter((i) => getStockStatus(i.stock, i.minStock) === "low");

    // Find the latest "out" transaction for each item to approximate when it went low
    const lastLowTime: Record<string, string> = {};
    for (const tx of transactions) {
      if (tx.type === "out" && !lastLowTime[tx.itemId]) {
        const item = lowItems.find((i) => i.id === tx.itemId);
        if (item) {
          lastLowTime[tx.itemId] = tx.timestamp;
        }
      }
    }

    return lowItems
      .map((item) => ({
        ...item,
        lowSince: lastLowTime[item.id] || item.createdAt,
      }))
      .sort((a, b) => new Date(b.lowSince).getTime() - new Date(a.lowSince).getTime());
  }, [items, transactions]);

  const totalPages = Math.max(1, Math.ceil(lowStockItems.length / ITEMS_PER_PAGE));
  const paged = lowStockItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" aria-describedby="low-stock-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-low" />
            Daftar Low Stock
          </DialogTitle>
          <p id="low-stock-desc" className="text-sm text-muted-foreground">
            Barang dengan stok dibawah batas minimum, diurutkan berdasarkan waktu terbaru.
          </p>
        </DialogHeader>

        <div className="space-y-2 max-h-80 overflow-y-auto">
          {lowStockItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada barang low stock 🎉</p>
          ) : (
            paged.map((item) => {
              const ItemIcon = getIconByName(item.icon || "Package");
              const d = new Date(item.lowSince);
              return (
                <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-low/10">
                    <ItemIcon className="h-4 w-4 text-low" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Stok: {formatStock(item.stock, item.baseUnit, item.units)} • Min: {item.minStock} {item.baseUnit}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className="bg-low/15 text-low border-low/30 text-[10px]">Low</Badge>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}{" "}
                      {d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              Halaman {page + 1} dari {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

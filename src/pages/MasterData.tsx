import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Package, ShieldAlert } from "lucide-react";
import { getItems, addItem, updateItem, deleteItem } from "@/lib/inventory-store";
import { CATEGORIES, BASE_UNITS, UNIT_PRESETS, getStockStatus, formatStock, Item } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const MasterData = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [items, setItems] = useState(getItems());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [baseUnit, setBaseUnit] = useState<string>(BASE_UNITS[0]);
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(50);

  const resetForm = () => {
    setName(""); setSku(""); setCategory(CATEGORIES[0]); setBaseUnit(BASE_UNITS[0]); setStock(0); setMinStock(50);
    setEditingItem(null);
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setName(item.name); setSku(item.sku); setCategory(item.category);
    setBaseUnit(item.baseUnit); setStock(item.stock); setMinStock(item.minStock);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!name || !sku) {
      toast({ title: "Error", description: "Nama dan SKU wajib diisi", variant: "destructive" });
      return;
    }
    const units = UNIT_PRESETS[baseUnit] || [];
    if (editingItem) {
      updateItem(editingItem.id, { name, sku, category, baseUnit, units, stock, minStock });
      toast({ title: "Berhasil", description: `${name} berhasil diperbarui` });
    } else {
      addItem({ name, sku, category, baseUnit, units, stock, minStock });
      toast({ title: "Berhasil", description: `${name} berhasil ditambahkan` });
    }
    setItems(getItems());
    setDialogOpen(false);
    resetForm();
  };

  const handleDelete = (item: Item) => {
    deleteItem(item.id);
    setItems(getItems());
    toast({ title: "Dihapus", description: `${item.name} berhasil dihapus` });
  };

  // Live preview
  const previewStatus = getStockStatus(stock, minStock);
  const previewUnits = UNIT_PRESETS[baseUnit] || [];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Master Data</h1>
          {isAdmin ? (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Plus className="mr-2 h-4 w-4" /> Tambah Barang
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit Barang" : "Tambah Barang Baru"}</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <Label>Nama Barang</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Kertas HVS A4" />
                  </div>
                  <div>
                    <Label>SKU</Label>
                    <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="KRT-001" />
                  </div>
                  <div>
                    <Label>Kategori</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Satuan Dasar</Label>
                    <Select value={baseUnit} onValueChange={setBaseUnit}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BASE_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Stok Awal</Label>
                      <Input type="number" value={stock} onChange={e => setStock(Number(e.target.value))} min={0} />
                    </div>
                    <div>
                      <Label>Batas Minimum</Label>
                      <Input type="number" value={minStock} onChange={e => setMinStock(Number(e.target.value))} min={0} />
                    </div>
                  </div>
                  <Button onClick={handleSubmit} className="w-full bg-primary text-primary-foreground">
                    {editingItem ? "Simpan Perubahan" : "Tambah Barang"}
                  </Button>
                </div>

                {/* Live Preview */}
                <div>
                  <Label className="mb-2 block text-muted-foreground">Live Preview</Label>
                  <Card className={`border-2 transition-colors ${previewStatus === 'low' ? 'border-low/50 bg-low/5' : previewStatus === 'mid' ? 'border-warning/50 bg-warning/5' : 'border-safe/50 bg-safe/5'}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="rounded-lg bg-primary/10 p-2.5">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <Badge variant="outline" className={
                          previewStatus === 'low' ? 'bg-low/15 text-low border-low/30' :
                          previewStatus === 'mid' ? 'bg-warning/15 text-warning border-warning/30' :
                          'bg-safe/15 text-safe border-safe/30'
                        }>
                          {previewStatus === 'low' ? 'Low' : previewStatus === 'mid' ? 'Mid' : 'Safe'}
                        </Badge>
                      </div>
                      <h3 className="mt-3 font-semibold text-foreground">{name || "Nama Barang"}</h3>
                      <p className="text-xs text-muted-foreground">{sku || "SKU-000"} · {category}</p>
                      <div className="mt-3 flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-foreground">
                          {formatStock(stock, baseUnit, previewUnits)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Min: {minStock} {baseUnit}</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          ) : (
            <Badge variant="outline" className="gap-1.5 text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5" /> Hanya Admin yang bisa mengelola
            </Badge>
          )}
        </div>

        {/* Items Table */}
        <Card className="shadow-md">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Min</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      Belum ada data barang.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map(item => {
                    const status = getStockStatus(item.stock, item.minStock);
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>{formatStock(item.stock, item.baseUnit, item.units)}</TableCell>
                        <TableCell className="text-muted-foreground">{item.minStock} {item.baseUnit}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            status === 'low' ? 'bg-low/15 text-low border-low/30' :
                            status === 'mid' ? 'bg-warning/15 text-warning border-warning/30' :
                            'bg-safe/15 text-safe border-safe/30'
                          }>
                            {status === 'low' ? 'Low' : status === 'mid' ? 'Mid' : 'Safe'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isAdmin && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}>
                                <Trash2 className="h-4 w-4 text-low" />
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default MasterData;

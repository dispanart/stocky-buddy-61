import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getUsers, deleteUser } from "@/lib/auth-store";
import { useQueryClient } from "@tanstack/react-query";
import {
  CloudDownload, CloudUpload, Plus, Search, Trash2, AlertTriangle, Loader2, FileText, Clock, HardDrive, CircleCheck, Upload, CircleX, Wifi, WifiOff
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface BackupEntry {
  id: string;
  fileName: string;
  date: string;
  size: string;
  createdBy: string;
  type: "manual" | "auto";
}

const BACKUP_HISTORY_KEY = "printstock_backup_history";
const AUTO_BACKUP_KEY = "printstock_auto_backup";

function getBackupHistory(): BackupEntry[] {
  const data = localStorage.getItem(BACKUP_HISTORY_KEY);
  return data ? JSON.parse(data) : [];
}

function saveBackupHistory(entries: BackupEntry[]) {
  localStorage.setItem(BACKUP_HISTORY_KEY, JSON.stringify(entries));
}

type SystemStatus = "checking" | "healthy" | "error";

const BackupRestore = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [backupHistory, setBackupHistory] = useState<BackupEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoBackup, setAutoBackup] = useState(false);

  // System health
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("checking");
  const [dbLatency, setDbLatency] = useState<number | null>(null);

  // Clear dialogs
  const [clearHistoryOpen, setClearHistoryOpen] = useState(false);
  const [clearDatabaseOpen, setClearDatabaseOpen] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [clearingDatabase, setClearingDatabase] = useState(false);

  // Check system health on mount
  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    setSystemStatus("checking");
    try {
      const start = performance.now();
      const { error } = await supabase.from("app_users").select("id").limit(1);
      const latency = Math.round(performance.now() - start);
      setDbLatency(latency);
      if (error) {
        setSystemStatus("error");
      } else {
        setSystemStatus("healthy");
      }
    } catch {
      setSystemStatus("error");
      setDbLatency(null);
    }
  };

  useEffect(() => {
    setBackupHistory(getBackupHistory());
    setAutoBackup(localStorage.getItem(AUTO_BACKUP_KEY) === "true");
  }, []);

  const generateBackup = async () => {
    setGenerating(true);
    try {
      const [itemsRes, txRes, usersRes] = await Promise.all([
        (supabase as any).from("items").select("*"),
        (supabase as any).from("transactions").select("*").order("created_at", { ascending: false }),
        supabase.from("app_users").select("id, username, name, role, password_hash, last_login"),
      ]);

      const backup = {
        version: "2.0",
        createdAt: new Date().toISOString(),
        createdBy: user?.name || "Admin",
        items: itemsRes.data || [],
        transactions: txRes.data || [],
        users: usersRes.data || [],
      };

      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
      const fileName = `backup_printstock_v2_${dateStr}.json`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);

      const sizeKB = (blob.size / 1024).toFixed(1);
      const entry: BackupEntry = {
        id: crypto.randomUUID(),
        fileName,
        date: now.toISOString(),
        size: `${sizeKB} KB`,
        createdBy: user?.name || "Admin",
        type: "manual",
      };
      const updated = [entry, ...backupHistory].slice(0, 20);
      setBackupHistory(updated);
      saveBackupHistory(updated);

      toast({ title: "Backup Berhasil", description: `File ${fileName} berhasil diunduh` });
    } catch (e) {
      toast({ title: "Error", description: "Gagal membuat backup", variant: "destructive" });
    }
    setGenerating(false);
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !data.items || !data.transactions) {
        throw new Error("Invalid backup format");
      }

      await (supabase as any).from("transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await (supabase as any).from("items").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      if (data.items.length > 0) {
        await (supabase as any).from("items").insert(data.items);
      }
      if (data.transactions.length > 0) {
        await (supabase as any).from("transactions").insert(data.transactions);
      }
      if (data.users && data.users.length > 0) {
        const nonAdmin = data.users.filter((u: any) => u.username !== "admin");
        if (nonAdmin.length > 0) {
          await supabase.from("app_users").delete().neq("username", "admin");
          await supabase.from("app_users").insert(nonAdmin);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({ title: "Restore Berhasil", description: `Data berhasil dipulihkan dari ${file.name}` });
    } catch (err) {
      toast({ title: "Error", description: "File backup tidak valid atau gagal dipulihkan", variant: "destructive" });
    }
    setRestoring(false);
    e.target.value = "";
  };

  const handleClearHistory = async () => {
    setClearingHistory(true);
    try {
      await supabase.from("transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({ title: "Berhasil", description: "Semua log aktivitas berhasil dihapus" });
    } catch {
      toast({ title: "Error", description: "Gagal menghapus history", variant: "destructive" });
    }
    setClearingHistory(false);
    setClearHistoryOpen(false);
  };

  const handleClearDatabase = async () => {
    setClearingDatabase(true);
    try {
      await supabase.from("transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("app_users").delete().neq("username", "admin");

      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({ title: "Berhasil", description: "Database berhasil direset. Hanya akun admin yang tersisa." });
    } catch {
      toast({ title: "Error", description: "Gagal mereset database", variant: "destructive" });
    }
    setClearingDatabase(false);
    setClearDatabaseOpen(false);
  };

  const toggleAutoBackup = (val: boolean) => {
    setAutoBackup(val);
    localStorage.setItem(AUTO_BACKUP_KEY, val.toString());
    toast({
      title: val ? "Auto Backup Aktif" : "Auto Backup Nonaktif",
      description: val
        ? "Backup otomatis akan dijalankan setiap hari jam 21:00. File akan diunduh secara otomatis saat Anda membuka aplikasi."
        : "Auto backup dinonaktifkan.",
    });
  };

  const filteredHistory = backupHistory.filter((b) =>
    b.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusBadge = () => {
    if (systemStatus === "checking") {
      return (
        <Badge variant="outline" className="border-muted-foreground/30 bg-muted/10 text-muted-foreground gap-1.5 px-3 py-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking...
        </Badge>
      );
    }
    if (systemStatus === "healthy") {
      return (
        <Badge variant="outline" className="border-safe/30 bg-safe/10 text-safe gap-1.5 px-3 py-1 cursor-pointer" onClick={checkSystemHealth}>
          <CircleCheck className="h-3.5 w-3.5" /> System Healthy
          {dbLatency !== null && <span className="text-[10px] opacity-70">({dbLatency}ms)</span>}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive gap-1.5 px-3 py-1 cursor-pointer" onClick={checkSystemHealth}>
        <CircleX className="h-3.5 w-3.5" /> Connection Error
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Backup & Restore</h2>
            <p className="text-sm text-muted-foreground">
              Kelola keamanan data dengan backup dan pemulihan database.
            </p>
          </div>
          {statusBadge()}
        </div>

        {/* Backup & Restore Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-primary/10 p-3">
                  <CloudDownload className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">DB_VER_2.0</span>
              </div>
              <CardTitle className="text-lg mt-3">Create Database Backup</CardTitle>
              <p className="text-sm text-muted-foreground">
                Buat snapshot lengkap dari inventori, riwayat transaksi, dan master data.
              </p>
            </CardHeader>
            <CardContent>
              {backupHistory.length > 0 && (
                <div className="flex gap-4 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    Last: {new Date(backupHistory[0].date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5" />
                    Size: {backupHistory[0].size}
                  </span>
                </div>
              )}
              <Button onClick={generateBackup} disabled={generating} className="w-full gap-2">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Generate New Backup
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <div className="rounded-xl bg-primary/10 p-3 w-fit">
                <CloudUpload className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg mt-3">Restore from File</CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload file backup .json untuk memulihkan data.
              </p>
            </CardHeader>
            <CardContent>
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50 hover:bg-muted/50">
                {restoring ? (
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                ) : (
                  <Upload className="h-8 w-8 text-muted-foreground" />
                )}
                <span className="mt-2 text-sm font-medium text-foreground">
                  {restoring ? "Memulihkan..." : "Click or Drag file to upload"}
                </span>
                <span className="text-xs text-muted-foreground">Supported: .JSON (Max 50MB)</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleRestore}
                  disabled={restoring}
                />
              </label>
            </CardContent>
          </Card>
        </div>

        {/* Auto Backup */}
        <Card className="shadow-md">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Auto Backup Harian</p>
                <p className="text-xs text-muted-foreground">
                  Backup otomatis setiap hari jam 21:00 saat aplikasi dibuka. Hanya menyimpan 2 file terakhir.
                </p>
              </div>
            </div>
            <Switch checked={autoBackup} onCheckedChange={toggleAutoBackup} />
          </CardContent>
        </Card>

        {/* Backup History */}
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Backup History</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search backups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-48 pl-9 text-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File Name</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      Belum ada backup.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistory.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{b.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(b.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}{" "}
                        {new Date(b.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="text-sm font-mono">{b.size}</TableCell>
                      <TableCell className="text-sm">{b.createdBy}</TableCell>
                      <TableCell>
                        <Badge variant={b.type === "auto" ? "secondary" : "outline"} className="text-xs capitalize">
                          {b.type === "auto" ? "Auto" : "Manual"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/30 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Danger Zone
            </CardTitle>
            <p className="text-sm text-muted-foreground">Aksi ini tidak bisa dibatalkan. Pastikan Anda sudah membuat backup terlebih dahulu.</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="destructive" className="gap-2" onClick={() => setClearHistoryOpen(true)}>
              <Trash2 className="h-4 w-4" /> Clear History
            </Button>
            <Button variant="destructive" className="gap-2" onClick={() => setClearDatabaseOpen(true)}>
              <Trash2 className="h-4 w-4" /> Clear Database
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Clear History Confirmation */}
      <AlertDialog open={clearHistoryOpen} onOpenChange={setClearHistoryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Clear History
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan <strong>menghapus semua log aktivitas / riwayat transaksi</strong>.
              Data barang dan akun tidak akan terpengaruh. Berguna untuk mereset setelah demo.
              <br /><br />
              <strong className="text-destructive">Tindakan ini tidak bisa dibatalkan!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={clearingHistory}>
              {clearingHistory && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Hapus Semua History
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Database Confirmation */}
      <AlertDialog open={clearDatabaseOpen} onOpenChange={setClearDatabaseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Clear Database
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan <strong>menghapus SEMUA data</strong> termasuk:
              <ul className="mt-2 list-disc pl-5 space-y-1">
                <li>Semua daftar barang / inventori</li>
                <li>Semua log aktivitas / riwayat transaksi</li>
                <li>Semua akun pengguna <strong>kecuali akun admin</strong></li>
              </ul>
              <br />
              <strong className="text-destructive">Tindakan ini TIDAK bisa dibatalkan! Pastikan Anda sudah membuat backup.</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearDatabase} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={clearingDatabase}>
              {clearingDatabase && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Reset Database
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default BackupRestore;

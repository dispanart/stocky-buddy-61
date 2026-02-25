import { useState, useEffect } from "react";
import { LayoutDashboard, PackagePlus, PackageMinus, Database, FileText, Moon, Sun, UserPlus, ChevronUp, Loader2, LogOut, Users, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { NavLink } from "@/components/NavLink";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { addUser, getUsers, deleteUser, UserRole, User } from "@/lib/auth-store";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Stock In", url: "/stock-in", icon: PackagePlus },
  { title: "Stock Out", url: "/stock-out", icon: PackageMinus },
  { title: "Master Data", url: "/master-data", icon: Database },
  { title: "Reports", url: "/reports", icon: FileText },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  const [accountOpen, setAccountOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [members, setMembers] = useState<User[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("staff");

  const fetchMembers = async () => {
    setLoadingMembers(true);
    const users = await getUsers();
    setMembers(users);
    setLoadingMembers(false);
  };

  useEffect(() => {
    if (membersOpen) fetchMembers();
  }, [membersOpen]);

  const handleRegister = async () => {
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      toast({ title: "Error", description: "Semua kolom wajib diisi", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password minimal 6 karakter", variant: "destructive" });
      return;
    }
    setRegistering(true);
    try {
      const ok = await addUser(newUsername.trim(), newName.trim(), newPassword, newRole);
      if (ok) {
        toast({ title: "Berhasil", description: `User ${newName.trim()} berhasil didaftarkan` });
        setNewName(""); setNewUsername(""); setNewPassword(""); setNewRole("staff");
        setRegisterOpen(false);
      } else {
        toast({ title: "Error", description: "Username sudah digunakan", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Gagal mendaftarkan user", variant: "destructive" });
    }
    setRegistering(false);
  };

  const handleDeleteUser = async (member: User) => {
    if (member.id === user?.id) {
      toast({ title: "Error", description: "Tidak bisa menghapus akun sendiri", variant: "destructive" });
      return;
    }
    const { error } = await import("@/lib/auth-store").then(m => m.deleteUser(member.id)).then(() => ({ error: false })).catch(() => ({ error: true }));
    if (!error) {
      toast({ title: "Berhasil", description: `User ${member.name} berhasil dihapus` });
      fetchMembers();
    }
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-bold text-primary-foreground">P</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">PrintStock</h1>
            <p className="text-xs text-muted-foreground">v2.0</p>
          </div>
        </div>
      </div>

      <SidebarContent className="px-3 pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-11 rounded-lg">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 px-3 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground shadow-md"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <Collapsible open={accountOpen} onOpenChange={setAccountOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-semibold text-primary">{user?.name?.[0] || "U"}</span>
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || "staff"}</p>
              </div>
              <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform ${accountOpen ? "" : "rotate-180"}`} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-warning" />}
                <span className="text-sm text-foreground">Dark Mode</span>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>

            {isAdmin && (
              <>
                <Dialog open={membersOpen} onOpenChange={setMembersOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                      <Users className="h-4 w-4" /> Daftar Anggota
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Daftar Anggota</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-72 overflow-y-auto space-y-2">
                      {loadingMembers ? (
                        <div className="flex justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : members.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Belum ada anggota</p>
                      ) : (
                        members.map((m) => (
                          <div key={m.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                              <span className="text-xs font-semibold text-primary">{m.name[0]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{m.name}</p>
                              <p className="text-xs text-muted-foreground">@{m.username}</p>
                            </div>
                            <Badge variant={m.role === "admin" ? "default" : "secondary"} className="text-[10px] capitalize">
                              {m.role}
                            </Badge>
                            {m.id !== user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => handleDeleteUser(m)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                      <UserPlus className="h-4 w-4" /> Daftarkan User Baru
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Daftarkan User Baru</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div>
                        <Label>Nama Lengkap</Label>
                        <Input value={newName} onChange={(e) => setNewName(e.target.value.slice(0, 50))} placeholder="John Doe" maxLength={50} />
                      </div>
                      <div>
                        <Label>Username</Label>
                        <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value.slice(0, 30))} placeholder="johndoe" maxLength={30} />
                      </div>
                      <div>
                        <Label>Password</Label>
                        <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value.slice(0, 50))} placeholder="Min. 6 karakter" maxLength={50} />
                      </div>
                      <div>
                        <Label>Role</Label>
                        <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleRegister} className="w-full" disabled={registering}>
                        {registering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Daftarkan
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </>
            )}

            <Button variant="ghost" className="w-full justify-start gap-2 text-sm text-low hover:text-low" onClick={logout}>
              <LogOut className="h-4 w-4" /> Keluar
            </Button>
          </CollapsibleContent>
        </Collapsible>
      </SidebarFooter>
    </Sidebar>
  );
}

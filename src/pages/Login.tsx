import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Lock, User } from "lucide-react";

const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!login(username, password)) {
      setError("Username atau password salah");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">P</span>
          </div>
          <CardTitle className="text-2xl">PrintStock v2.0</CardTitle>
          <p className="text-sm text-muted-foreground">Masuk ke sistem inventaris</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Username"
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="pl-9"
                />
              </div>
            </div>
            {error && <p className="text-sm text-low font-medium">{error}</p>}
            <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Masuk
            </Button>
            <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium">Default Akun:</p>
              <p>Admin: admin / admin123</p>
              <p>Staff: staff / staff123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

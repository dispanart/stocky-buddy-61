import { useState, useEffect } from "react";
import mascotImg from "@/assets/mascot.png";

const tips = [
  "Tips: Gunakan fitur Quick Stock Out untuk mempercepat proses pengeluaran barang.",
  "Tips: Cek notifikasi stok rendah secara berkala agar tidak kehabisan bahan.",
  "Tips: Backup data secara rutin untuk menghindari kehilangan data penting.",
  "Tips: Gunakan filter di halaman Report untuk analisis stok lebih detail.",
  "Tips: Atur stok minimum setiap barang agar mendapat peringatan otomatis.",
  "Tips: Kamu bisa bertanya ke AI Assistant untuk bantuan inventaris.",
];

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [tip] = useState(() => tips[Math.floor(Math.random() * tips.length)]);

  useEffect(() => {
    const duration = 3500;
    const interval = 40;
    const step = 100 / (duration / interval);
    let current = 0;

    const timer = setInterval(() => {
      current += step + Math.random() * 0.8;
      if (current >= 100) {
        current = 100;
        clearInterval(timer);
        setTimeout(onComplete, 500);
      }
      setProgress(Math.min(current, 100));
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background">
      {/* Subtle background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-primary/8 blur-[100px]" />
      </div>

      <div className="relative flex flex-col items-center gap-6 px-6">
        {/* Mascot */}
        <div
          className="relative"
          style={{ animation: "mascot-float 3s ease-in-out infinite" }}
        >
          <div className="w-36 h-36 rounded-3xl bg-card shadow-xl border border-border/50 flex items-center justify-center overflow-hidden p-2">
            <img src={mascotImg} alt="PrintStock Mascot" className="w-full h-full object-contain" />
          </div>
          {/* Shadow below mascot */}
          <div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-3 rounded-full bg-foreground/5 blur-sm"
            style={{ animation: "mascot-shadow 3s ease-in-out infinite" }}
          />
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Sedang memproses data inventaris Anda…
          </h2>
          <p className="text-muted-foreground">Tunggu sebentar ya.</p>
        </div>

        {/* Progress bar */}
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-primary font-semibold tracking-wider uppercase">Loading Assets</span>
            <span className="text-muted-foreground font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-100 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Tip */}
        <div className="mt-4 flex items-center gap-3 bg-card border border-border/50 rounded-xl px-5 py-3 max-w-md shadow-sm">
          <span className="text-lg">💡</span>
          <p className="text-sm text-muted-foreground">{tip}</p>
        </div>
      </div>

      <style>{`
        @keyframes mascot-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes mascot-shadow {
          0%, 100% { transform: translateX(-50%) scale(1); opacity: 0.5; }
          50% { transform: translateX(-50%) scale(0.8); opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

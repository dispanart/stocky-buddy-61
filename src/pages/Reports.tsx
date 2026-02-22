import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

const Reports = () => {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <Card className="shadow-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-xl bg-primary/10 p-4 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-foreground">Coming Soon</p>
            <p className="text-sm text-muted-foreground mt-1">Fitur laporan bulanan akan segera hadir.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Reports;

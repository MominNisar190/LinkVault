import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-black text-white/10 select-none">404</div>
        <div>
          <h1 className="text-2xl font-bold text-white">Page not found</h1>
          <p className="text-white/50 mt-2">
            The link or page you're looking for doesn't exist or may have been removed.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Home className="h-4 w-4" /> Go Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/5">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

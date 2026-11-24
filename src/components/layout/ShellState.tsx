import { Link } from "@tanstack/react-router";
import { FileQuestion, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function UnauthorizedState({ homeHref }: { homeHref: string }) {
  return (
    <Card className="mx-auto max-w-lg border-border/80">
      <CardHeader className="text-center">
        <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
          <ShieldOff className="h-6 w-6" aria-hidden />
        </span>
        <CardTitle>Akses ditolak</CardTitle>
        <CardDescription>
          Anda tidak memiliki izin untuk membuka halaman ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-8">
        <Button type="button" variant="outline" color="secondary" asChild>
          <Link to={homeHref}>Kembali ke beranda</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function NotFoundState({ homeHref }: { homeHref: string }) {
  return (
    <Card className="mx-auto max-w-lg border-border/80">
      <CardHeader className="text-center">
        <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <FileQuestion className="h-6 w-6" aria-hidden />
        </span>
        <CardTitle>Halaman tidak ditemukan</CardTitle>
        <CardDescription>
          Resource yang Anda cari tidak ada atau sudah dihapus.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center pb-8">
        <Button type="button" variant="outline" color="secondary" asChild>
          <Link to={homeHref}>Kembali ke beranda</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
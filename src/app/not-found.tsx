import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 px-4">
      <FileQuestion className="h-12 w-12 text-muted-foreground" />
      <h2 className="text-xl font-semibold">Page not found</h2>
      <p className="text-muted-foreground text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">Go to status page</Link>
      </Button>
    </div>
  );
}

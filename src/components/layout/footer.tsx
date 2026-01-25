export function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-6">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Garden UI. All rights reserved.</p>
      </div>
    </footer>
  );
}

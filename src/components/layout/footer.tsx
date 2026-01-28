export function Footer() {
  return (
    <footer className="border-t bg-muted/30 py-6">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} IncidentGarden. All rights reserved.</p>
      </div>
    </footer>
  );
}

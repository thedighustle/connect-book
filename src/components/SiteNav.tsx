import { Link } from "@tanstack/react-router";

export function SiteNav() {
  const cls = "px-4 py-2 rounded-full text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";
  return (
    <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
      <span className="font-display text-xl font-semibold text-primary">Get in touch</span>
      <nav className="flex gap-1 rounded-full bg-secondary p-1">
        <Link to="/" className={cls} activeProps={{ className: "bg-card text-foreground shadow-sm" }} activeOptions={{ exact: true }}>
          Contact
        </Link>
        <Link to="/book" className={cls} activeProps={{ className: "bg-card text-foreground shadow-sm" }}>
          Book
        </Link>
      </nav>
    </header>
  );
}

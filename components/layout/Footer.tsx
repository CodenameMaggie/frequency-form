export default function Footer() {
  return (
    <footer className="bg-[rgb(var(--navy))] px-6 py-6">
      <div className="max-w-[1200px] mx-auto flex flex-wrap justify-between items-center gap-4">
        <span className="text-[9px] tracking-[0.18em] uppercase font-sans text-[rgb(var(--text-soft))]">
          © 2026 Frequency & Form
        </span>

        {/* Navigation Links */}
        <div className="flex gap-6 items-center">
          <a
            href="/ff/style-studio"
            className="text-[10px] tracking-[0.2em] uppercase font-sans text-[rgb(var(--champagne))] hover:text-white transition-colors"
          >
            AI Style Studio
          </a>
          <a
            href="/about"
            className="text-[10px] tracking-[0.2em] uppercase font-sans text-[rgb(var(--text-soft))] hover:text-[rgb(var(--champagne))] transition-colors"
          >
            About
          </a>
          <a
            href="/podcast"
            className="text-[10px] tracking-[0.2em] uppercase font-sans text-[rgb(var(--text-soft))] hover:text-[rgb(var(--champagne))] transition-colors"
          >
            Podcast
          </a>
        </div>

        <span className="text-[9px] tracking-[0.18em] uppercase font-sans text-[rgb(var(--champagne))]">
          Dress in Alignment
        </span>
      </div>
    </footer>
  );
}

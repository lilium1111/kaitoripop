import Link from "next/link";

export function SiteNav() {
  return (
    <nav className="flex flex-wrap gap-2 text-sm font-bold text-slate-700">
      <Link className="rounded bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50" href="/">
        買取ポップ作成
      </Link>
      <Link
        className="rounded bg-white px-3 py-2 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        href="/event-poster"
      >
        大会ポスター作成
      </Link>
    </nav>
  );
}

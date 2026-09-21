'use client';
import Link from 'next/link';
import { BarChart3, Newspaper, Vault } from 'lucide-react';
export function BottomNav({ asset = 'gold' }: { asset?: string }) { const links = [{ href: `/${asset}`, label: 'Signals', icon: BarChart3 },{ href: `/${asset}/news`, label: 'News', icon: Newspaper },{ href: '/vault', label: 'Vault', icon: Vault }]; return <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#07110c]/95 px-5 pb-[max(0.6rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:hidden"><div className="mx-auto flex max-w-md justify-around">{links.map(({href,label,icon:Icon}) => <Link key={href} href={href} className="flex min-w-16 flex-col items-center gap-1 text-xs text-zinc-300"><Icon size={19}/>{label}</Link>)}</div></nav>; }

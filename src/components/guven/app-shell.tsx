import { Link, useRouterState } from '@tanstack/react-router';
import { Home, Compass, ShieldCheck, FolderLock, UserRound, ArrowUpRight, LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAccount } from './auth-context';
import type { ReactNode } from 'react';
const nav = [{ to: '/', label: 'Ana Sayfa', icon: Home }, { to: '/kesfet', label: 'Keşfet', icon: Compass }, { to: '/guven', label: 'Güven', icon: ShieldCheck }, { to: '/dosyalarim', label: 'Dosyalarım', icon: FolderLock }, { to: '/profilim', label: 'Profilim', icon: UserRound }] as const;
export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAccount(); const pathname = useRouterState({ select: s => s.location.pathname });
  return <><header className="app-header"><div className="header-inner"><Link className="brand" to="/" aria-label="Güven Bana ana sayfa"><span className="brand-icon"><ShieldCheck/></span><span>GÜVEN <b>BANA</b><small>Güvenin adresi.</small></span></Link><nav className="desktop-nav" aria-label="Ana menü">{nav.slice(0,4).map(item => <Link key={item.to} to={item.to} className={pathname === item.to ? 'active' : ''}>{item.label}</Link>)}</nav><div className="header-actions"><Button asChild variant="ghost" className="support-link"><Link to="/destek"><LifeBuoy/> Destek</Link></Button><Button asChild variant="outline"><Link to={user ? '/profilim' : '/auth'}>{user ? <><UserRound/> Hesabım</> : <>Giriş yap <ArrowUpRight/></>}</Link></Button></div></div></header><main className="main-shell">{children}</main><footer className="app-footer"><span><ShieldCheck size={17}/> GÜVEN BANA</span><p>Güvenin adresi, mağduriyetin karşısında.</p><Link to="/basvuru">Resmî başvuru yolları <ArrowUpRight size={14}/></Link></footer><nav className="mobile-nav" aria-label="Alt menü">{nav.map(item => <Link key={item.to} to={item.to} className={pathname === item.to ? 'active' : ''}><item.icon size={21}/><span>{item.label}</span></Link>)}</nav></>;
}

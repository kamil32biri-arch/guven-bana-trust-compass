import { Link } from '@tanstack/react-router';
import { ShieldCheck, ArrowUpRight, CircleAlert, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ReactNode } from 'react';
export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description: string; action?: ReactNode }) { return <div className="page-title"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1><p>{description}</p></div>{action}</div>; }
export function ServiceNotice() { return <div role="status" className="service-notice"><CircleAlert size={18}/><span>Canlı verilere şu anda ulaşılamıyor. Sonuçlar ve kayıt işlemleri erişim yeniden sağlandığında kullanılabilir.</span></div>; }
export function Empty({ title, description, children }: { title: string; description: string; children?: ReactNode }) { return <div className="empty-state"><ShieldCheck size={36}/><h3>{title}</h3><p>{description}</p>{children}</div>; }
export function SignInPrompt({ title = 'Size özel, yalnızca sizin erişiminizde.', description = 'Bildirimlerinizi ve delillerinizi yönetmek için hesabınıza giriş yapın.' }: { title?: string; description?: string }) { return <div className="auth-prompt"><LockKeyhole size={32}/><h2>{title}</h2><p>{description}</p><Button asChild size="lg"><Link to="/auth">Giriş yap / Üye ol <ArrowUpRight/></Link></Button></div>; }

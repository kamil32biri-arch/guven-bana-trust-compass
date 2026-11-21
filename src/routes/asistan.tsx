import { createFileRoute,Link } from '@tanstack/react-router';
import { MessageSquareText,ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/guven/shared';
import { head } from '@/lib/guven/domain';
export const Route=createFileRoute('/asistan')({head:()=>head('Mağduriyet asistanı','Güven Bana mağduriyet asistanının hizmet durumu ve güvenli alternatif çözüm yolları.'),component:Assistant});
function Assistant(){return <div className="form-layout"><PageTitle eyebrow="GÜVEN BANA ASİSTANI" title="Derdinizi anlatın, yolunuzu bulun." description="Asistanın amacı olayınızı düzenlemek ve güvenli çözüm yollarını anlamanıza yardımcı olmak; hukuki karar vermek değildir."/><div className="auth-prompt"><MessageSquareText size={40}/><h2>Asistan henüz kullanıma açık değil.</h2><p>Gerçek yapay zekâ bağlantısı ve hesabınızda saklanan görüşmeler henüz tamamlanmadı. Örnek yanıtları gerçek hizmet gibi göstermiyoruz.</p><Button asChild><Link to="/bildirim">Olayımı bildireyim <ArrowUpRight/></Link></Button><Button asChild variant="link" className="mt-3"><Link to="/basvuru">Resmî başvuru yolları</Link></Button></div><div className="service-notice">Acil tehdit veya fiziksel tehlikede 112’yi arayın. Platform avukat veya resmî kurum yerine geçmez.</div></div>;}

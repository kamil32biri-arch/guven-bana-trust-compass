import { createFileRoute,Link } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { PageTitle,Empty } from '@/components/guven/shared';
import { workspaceOptions } from '@/lib/guven/queries';
import { head } from '@/lib/guven/domain';
export const Route=createFileRoute('/_authenticated/destekler')({head:()=>head('Destek taleplerim','Özel destek taleplerinizin durumunu ve ekibin yanıtlarını takip edin.'),loader:({context})=>context.queryClient.ensureQueryData(workspaceOptions),component:Requests});
function Requests(){const{data}=useSuspenseQuery(workspaceOptions);return <><PageTitle title="Destek taleplerim." description="Ekibin yanıtları ve taleplerinizin durumu." action={<Button asChild><Link to="/destek">Yeni talep</Link></Button>}/>{data.support.length?<div className="record-list">{data.support.map(r=><article className="record-item" key={r.id}><div className="record-meta"><span>{new Date(r.created_at).toLocaleDateString('tr-TR')}</span><span className="record-status">{{acik:'Açık',yanitlandi:'Yanıtlandı',kapandi:'Kapandı'}[r.status]}</span></div><h3>{r.subject}</h3><p>{r.message}</p>{r.admin_reply&&<div className="mt-4 border-t pt-4"><h4 className="text-sm font-bold mb-2">Destek ekibinin yanıtı</h4><p>{r.admin_reply}</p></div>}</article>)}</div>:<Empty title="Henüz destek talebiniz yok." description="Bir sorunuz varsa destek ekibine özel mesaj gönderebilirsiniz."/>}</>;}

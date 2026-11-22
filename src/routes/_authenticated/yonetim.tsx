import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { PageTitle, Empty } from '@/components/guven/shared';
import { adminOptions } from '@/lib/guven/queries';
import { head } from '@/lib/guven/domain';

export const Route = createFileRoute('/_authenticated/yonetim')({
  head: () => head('Yönetici paneli', 'Güven Bana yönetici alanının mevcut hizmet durumu.'),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(adminOptions);
  },
  component: Administration,
});

function Administration() {
  useSuspenseQuery(adminOptions);
  return (
    <>
      <PageTitle title="Yönetici paneli." description="Bu alan yalnızca yönetici yetkisi doğrulanan hesaplara açıktır." />
      <Empty title="Yönetim ekranları henüz tamamlanmadı." description="Bildirim inceleme ve diğer yönetim işlemleri bu ekrandan henüz yapılamaz." />
    </>
  );
}

import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function notifyOrganizer(payload: {
  full_name: string; email: string; phone?: string | null;
  university: string; title: string; file_url: string; op_id_int?: number | null;
}) {
  return resend.emails.send({
    from: process.env.FROM_EMAIL!,
    to: process.env.ORGANIZER_EMAIL!,
    subject: `Yeni başvuru: ${payload.title}`,
    html: `
      <h3>Yeni Başvuru</h3>
      <p><b>Ad Soyad:</b> ${payload.full_name}</p>
      <p><b>E-posta:</b> ${payload.email}</p>
      <p><b>Tel:</b> ${payload.phone ?? '-'}</p>
      <p><b>Üniversite:</b> ${payload.university}</p>
      <p><b>İndirme:</b> <a href="${payload.file_url}">Dosyayı indir</a></p>
      ${payload.op_id_int ? `<p><b>Ref:</b> ${payload.op_id_int}</p>` : ''}
    `
  })
}

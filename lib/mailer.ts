import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY!)

export async function notifyOrganizer(payload: {
  full_name: string; email: string; phone?: string | null;
  university: string; title: string; file_url: string; ip?: string | null; ua?: string | null;
}) {
  const from = process.env.FROM_EMAIL!
  const to = process.env.ORGANIZER_EMAIL!

  return resend.emails.send({
    from, to,
    subject: `Yeni başvuru: ${payload.title}`,
    html: `
      <h3>Yeni Başvuru</h3>
      <p><b>Ad Soyad:</b> ${payload.full_name}</p>
      <p><b>E-posta:</b> ${payload.email}</p>
      <p><b>Tel:</b> ${payload.phone ?? '-'}</p>
      <p><b>Üniversite:</b> ${payload.university}</p>
      <p><b>Dosya:</b> <a href="${payload.file_url}">${payload.file_url}</a></p>
      ${payload.ip ? `<p><b>IP:</b> ${payload.ip}</p>` : ''}
      ${payload.ua ? `<p><b>UA:</b> ${payload.ua}</p>` : ''}
    `
  })
}

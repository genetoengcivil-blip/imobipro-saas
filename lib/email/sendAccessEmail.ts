import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendAccessEmail(
  to: string,
  loginUrl: string
) {
  await resend.emails.send({
    from: "ImobiPro <acesso@imobi-pro.com>",
    to,
    subject: "Seu acesso ao ImobiPro está pronto 🚀",
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6">
        <h2>Bem-vindo ao ImobiPro 👋</h2>

        <p>Seu pagamento foi aprovado e seu acesso já está liberado.</p>

        <p>
          <a href="${loginUrl}"
             style="display:inline-block;
                    padding:12px 20px;
                    background:#059669;
                    color:#fff;
                    text-decoration:none;
                    border-radius:6px;
                    font-weight:bold">
            Entrar no sistema
          </a>
        </p>

        <p>Este link é seguro e expira em alguns minutos.</p>

        <p style="color:#666;font-size:12px">
          Caso não tenha solicitado este acesso, ignore este e-mail.
        </p>

        <hr />
        <p style="font-size:12px;color:#999">
          ImobiPro · Plataforma para Corretores
        </p>
      </div>
    `,
  });
}

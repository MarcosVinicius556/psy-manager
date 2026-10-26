# Hospedagem e uso comercial

O Psy Manager roda hoje no **Vercel Hobby** e no **Firebase Spark**. Isso é adequado para avaliação gratuita e operação sem cobrança automática de assinatura.

Quando a assinatura paga por Pix (Onda D2) ou um gateway (G1) entrar em produção, o uso passa a ser **comercial**. O [Fair Use da Vercel](https://vercel.com/docs/limits/fair-use-guidelines) não permite uso comercial sustentado no plano Hobby — será necessário migrar para **Vercel Pro** (ou outra hospedagem equivalente) antes de cobrar clientes em escala.

Preços públicos e cancelamento self-service podem ir ao ar antes dessa migração; apenas monitore limites de cron, funções e leituras Firestore conforme `docs/jobs.md`.

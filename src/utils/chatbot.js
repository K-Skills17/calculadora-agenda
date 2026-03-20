import { CHATBOT_API_BASE, CHATBOT_TENANT_ID } from '../config';
import { formatCurrency } from './calculations';

export async function sendResultsToChatbot(leadData, results) {
  try {
    const res = await fetch(`${CHATBOT_API_BASE}/webhook/audit-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: CHATBOT_TENANT_ID,
        phone: leadData.whatsapp,
        name: leadData.nome,
        auditData: {
          source: 'calculadora_agenda',
          businessType: 'dentista',
          clinicName: leadData.clinica,
          email: leadData.email,
          city: leadData.cidade || 'Não informada',
          overallScore: Math.round(
            (results.receitaExtra / results.receitaMensalAtual) * 100
          ),
          categories: {
            receitaAtual: formatCurrency(results.receitaMensalAtual),
            receitaIdeal: formatCurrency(results.receitaIdealMensal),
            receitaExtra: formatCurrency(results.receitaExtra),
            horaAtual: formatCurrency(results.horaRealAtual),
            horaIdeal: formatCurrency(results.horaRealIdeal),
            horasEconomizadas: `${results.horasEconomizadas.toFixed(1)}h/semana`,
          },
          keyFindings: [
            `Receita atual: ${formatCurrency(results.receitaMensalAtual)}/mês`,
            `Receita ideal com agenda otimizada: ${formatCurrency(results.receitaIdealMensal)}/mês`,
            `Potencial de ganho extra: +${formatCurrency(results.receitaExtra)}/mês`,
            `Valor hora atual: ${formatCurrency(results.horaRealAtual)} → Ideal: ${formatCurrency(results.horaRealIdeal)}`,
            ...(results.horasEconomizadas > 0
              ? [`Pode economizar ${results.horasEconomizadas.toFixed(1)} horas por semana`]
              : []),
            ...(results.worstMismatch
              ? [`Pior desalinhamento: ${results.worstMismatch.nome} consome ${Math.round(results.worstMismatch.percentTempo)}% do tempo mas gera apenas ${Math.round(results.worstMismatch.percentReceita)}% da receita`]
              : []),
          ],
          recommendations: [
            ...results.optimized.map((p, i) =>
              `${i + 1}. ${p.nome}: ${formatCurrency(p.receitaPorHora)}/hora — de ${p.quantidadeSemanal}/sem para ${p.quantidadeIdeal}/sem`
            ),
          ],
          procedimentos: results.optimized.map((p) => ({
            nome: p.nome,
            receitaPorHora: p.receitaPorHora,
            valorProcedimento: p.valor,
            tempoMinutos: p.tempoMinutos,
            quantidadeAtual: p.quantidadeSemanal,
            quantidadeIdeal: p.quantidadeIdeal,
          })),
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Chatbot webhook error:', data);
    }

    return data;
  } catch (err) {
    console.error('Failed to send results to chatbot:', err);
  }
}

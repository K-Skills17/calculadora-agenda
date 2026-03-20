import { CHATBOT_API_BASE, CHATBOT_TENANT_ID } from '../config';
import { formatCurrency } from './calculations';

async function createSession() {
  const res = await fetch(`${CHATBOT_API_BASE}/${CHATBOT_TENANT_ID}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const data = await res.json();
  return data.sessionId;
}

async function sendMessage(sessionId, text) {
  const res = await fetch(`${CHATBOT_API_BASE}/${CHATBOT_TENANT_ID}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, text }),
  });
  return res.json();
}

export async function sendResultsToChatbot(leadData, results) {
  try {
    const sessionId = await createSession();

    const message =
      `RELATÓRIO DE AGENDA - ENVIAR VIA WHATSAPP\n\n` +
      `Dados do cliente:\n` +
      `Nome: ${leadData.nome}\n` +
      `Clínica: ${leadData.clinica}\n` +
      `Email: ${leadData.email}\n` +
      `WhatsApp: ${leadData.whatsapp}\n` +
      `Cidade: ${leadData.cidade || 'Não informada'}\n\n` +
      `Resultados do diagnóstico:\n` +
      `Receita atual: ${formatCurrency(results.receitaMensalAtual)}/mês\n` +
      `Receita ideal: ${formatCurrency(results.receitaIdealMensal)}/mês\n` +
      `Potencial de ganho extra: ${formatCurrency(results.receitaExtra)}/mês\n` +
      `Valor hora atual: ${formatCurrency(results.horaRealAtual)}\n` +
      `Valor hora ideal: ${formatCurrency(results.horaRealIdeal)}\n` +
      `Horas economizadas por semana: ${results.horasEconomizadas.toFixed(1)}h\n\n` +
      `Procedimentos (ranking por receita/hora):\n` +
      results.optimized.map((p, i) =>
        `${i + 1}. ${p.nome} — ${formatCurrency(p.receitaPorHora)}/hora | Atual: ${p.quantidadeSemanal}/sem → Ideal: ${p.quantidadeIdeal}/sem`
      ).join('\n') +
      (results.worstMismatch
        ? `\n\nPior desalinhamento: ${results.worstMismatch.nome} consome ${Math.round(results.worstMismatch.percentTempo)}% do tempo mas gera apenas ${Math.round(results.worstMismatch.percentReceita)}% da receita.`
        : '') +
      `\n\nPor favor, envie a análise completa com próximos passos para o WhatsApp do cliente: ${leadData.whatsapp}`;

    await sendMessage(sessionId, message);
  } catch (err) {
    console.error('Failed to send results to chatbot:', err);
  }
}

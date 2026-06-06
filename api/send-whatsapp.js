// Vercel Serverless Function — sends schedule analysis to WhatsApp via LK Chatbot
// All secrets stay server-side, never exposed to the browser

import Anthropic from '@anthropic-ai/sdk';

const LK_CHATBOT_URL = process.env.LK_CHATBOT_URL;
const LK_CHATBOT_API_KEY = process.env.LK_CHATBOT_API_KEY;
const LK_CHATBOT_TENANT_ID = process.env.LK_CHATBOT_TENANT_ID;
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_INSTANCE = process.env.EVOLUTION_API_INSTANCE;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;
const GOOGLE_SHEET_URL = process.env.GOOGLE_SHEET_URL;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function formatPhone(phone) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '55' + digits.slice(1);
  if (!digits.startsWith('55')) digits = '55' + digits;
  return digits;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// --- Claude AI schedule analysis ---

async function generateSchedulePlan(data) {
  if (!ANTHROPIC_API_KEY) {
    console.warn('ANTHROPIC_API_KEY not configured — skipping AI analysis');
    return null;
  }

  const { name, clinicName, score, agendaData } = data;

  const proceduresList = (agendaData.procedures || [])
    .map(p => `- ${p.nome}: ${formatCurrency(p.receitaPorHora)}/hora, ${p.tempoMinutos}min, atual ${p.quantidadeAtual}/sem → ideal ${p.quantidadeIdeal}/sem`)
    .join('\n');

  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Voce e um consultor de gestao de agenda para clinicas odontologicas no Brasil. Analise os dados desta calculadora de agenda e crie um plano de acao personalizado.

DADOS DO LEAD:
- Nome: ${name}
- Clinica: ${clinicName}
- Score de otimizacao: ${score}%

ANALISE DA AGENDA:
- Receita atual: ${agendaData.receitaAtual}
- Receita ideal: ${agendaData.receitaIdeal}
- Ganho potencial: ${agendaData.receitaExtra}
- Valor/hora atual: ${agendaData.horaAtual}
- Valor/hora ideal: ${agendaData.horaIdeal}
- Horas economizaveis: ${agendaData.horasEconomizadas}

PROCEDIMENTOS (ranking por receita/hora):
${proceduresList || 'Nao informado'}

PIOR DESALINHAMENTO: ${agendaData.worstMismatch || 'Nenhum identificado'}

INSTRUCOES:
- Escreva em portugues brasileiro, tom profissional mas amigavel
- Maximo 3-4 acoes prioritarias, cada uma com 1-2 frases curtas
- Foque em: otimizacao de tempo de cadeira, mix de procedimentos, eficiencia de agenda
- Seja especifico para o contexto de odontologia
- NAO use markdown. Use formatacao WhatsApp: *negrito* para destaques
- Mantenha CURTO — maximo 500 caracteres no total do plano
- Retorne APENAS o plano de acao, sem introducao ou conclusao`
      }
    ]
  });

  const textBlock = response.content.find(b => b.type === 'text');
  return textBlock ? textBlock.text : null;
}

// --- Message builder ---

function buildMessage(data, actionPlan) {
  const { name, clinicName, score, agendaData, topIssues } = data;

  const lines = [
    `Ola ${name}! 👋`,
    ``,
    `Aqui esta a analise da agenda da *${clinicName}*:`,
    ``,
    `📊 *Score de Otimizacao: ${score}%*`,
    ``,
    `💰 *Receita atual:* ${agendaData.receitaAtual}`,
    `📈 *Receita ideal:* ${agendaData.receitaIdeal}`,
    `✨ *Ganho potencial:* +${agendaData.receitaExtra}/mes`,
  ];

  if (agendaData.horasEconomizadas && agendaData.horasEconomizadas !== '0.0h/semana') {
    lines.push(`⏰ *Economia de tempo:* ${agendaData.horasEconomizadas}`);
  }

  if (actionPlan) {
    lines.push(
      ``,
      `📋 *Seu plano de acao personalizado:*`,
      ``,
      actionPlan,
    );
  } else if (topIssues && topIssues.length > 0) {
    lines.push(
      ``,
      `⚠️ *Principais achados:*`,
      ...topIssues.slice(0, 4).map((issue, i) => `   ${i + 1}. ${issue}`),
    );
  }

  lines.push(
    ``,
    `---`,
    ``,
    `Quer atrair exatamente os pacientes de alto valor para preencher sua agenda ideal?`,
    ``,
    `Me conta: qual procedimento voce mais gostaria de aumentar na sua agenda? 😊`,
  );

  return lines.join('\n');
}

// --- Google Sheets ---

async function saveToSheet(data) {
  if (!GOOGLE_SHEET_URL) {
    console.warn('GOOGLE_SHEET_URL not configured — skipping');
    return;
  }

  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: data.name,
        clinica: data.clinicName,
        email: data.email,
        whatsapp: data.phone,
        cidade: data.city,
        score: data.score,
        receitaAtual: data.agendaData.receitaAtual,
        receitaIdeal: data.agendaData.receitaIdeal,
        receitaExtra: data.agendaData.receitaExtra,
        horaAtual: data.agendaData.horaAtual,
        horaIdeal: data.agendaData.horaIdeal,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('Google Sheets error:', err);
  }
}

// --- Facebook Conversions API ---

async function sendFbConversion(data, clientIp) {
  const pixelId = process.env.PIXEL_ID;
  const accessToken = process.env.CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('Facebook CAPI not configured — skipping');
    return;
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const phone = formatPhone(data.phone);
    const hashedPhone = await hashSHA256(phone);
    const hashedName = await hashSHA256(data.name.trim().toLowerCase());

    const eventData = {
      data: [
        {
          event_name: 'Lead',
          event_time: timestamp,
          action_source: 'website',
          event_source_url: 'https://agenda.lkdigital.odo.br',
          user_data: {
            ph: [hashedPhone],
            fn: [hashedName],
            client_ip_address: clientIp || undefined,
          },
          custom_data: {
            content_name: `Calculadora Agenda - ${data.clinicName}`,
            value: data.score,
            currency: 'BRL',
          },
        },
      ],
      access_token: accessToken,
    };

    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      }
    );

    const result = await res.text();
    console.log('FB CAPI response:', res.status, result);
  } catch (err) {
    console.error('FB CAPI error:', err);
  }
}

async function hashSHA256(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- Main handler ---

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body;
    const { name, phone, clinicName, email, city, score, topIssues, agendaData } = body;

    if (!name || !phone || !clinicName) {
      return res.status(400).json({ error: 'Nome, telefone e nome da clinica sao obrigatorios' });
    }

    const formattedPhone = formatPhone(phone);
    if (formattedPhone.length < 12) {
      return res.status(400).json({ error: 'Numero de telefone invalido' });
    }

    const clientIp =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress;

    // Run AI analysis, sheet save, and FB conversion in parallel
    const [actionPlan] = await Promise.all([
      generateSchedulePlan(body).catch(err => {
        console.error('Claude AI error:', err);
        return null;
      }),
      saveToSheet(body).catch(err => {
        console.error('Sheet save error:', err);
      }),
      sendFbConversion(body, clientIp).catch(err => {
        console.error('FB CAPI error:', err);
      }),
    ]);

    const message = buildMessage(body, actionPlan);

    // Send via LK Chatbot webhook (preferred)
    let messageSent = false;
    let whatsappError = '';

    if (LK_CHATBOT_URL && LK_CHATBOT_API_KEY && LK_CHATBOT_TENANT_ID) {
      try {
        const webhookUrl = `${LK_CHATBOT_URL}/webhook/audit-lead`;
        console.log('Chatbot webhook request:', { url: webhookUrl, phone: formattedPhone });

        const chatbotRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': LK_CHATBOT_API_KEY,
          },
          body: JSON.stringify({
            phone: formattedPhone,
            name,
            reportMessage: message,
            tenantId: LK_CHATBOT_TENANT_ID,
            auditData: {
              source: 'calculadora_agenda',
              businessType: 'dentista',
              clinicName,
              email,
              city: city || 'Nao informada',
              overallScore: score,
              keyFindings: topIssues ? topIssues.slice(0, 5) : [],
              recommendations: (agendaData.procedures || []).slice(0, 5).map(p =>
                `${p.nome}: de ${p.quantidadeAtual}/sem para ${p.quantidadeIdeal}/sem (${formatCurrency(p.receitaPorHora)}/hora)`
              ),
            },
          }),
        });

        const responseText = await chatbotRes.text();
        console.log('Chatbot webhook response:', chatbotRes.status, responseText);

        if (chatbotRes.ok) {
          messageSent = true;
        } else {
          whatsappError = `Chatbot webhook ${chatbotRes.status}: ${responseText}`;
          console.error('Chatbot webhook error:', whatsappError);
        }
      } catch (err) {
        whatsappError = `Chatbot webhook error: ${err.message || String(err)}`;
        console.error('Chatbot webhook error:', err);
      }
    }

    // Fallback: send directly via Evolution API
    if (!messageSent && EVOLUTION_API_URL && EVOLUTION_API_INSTANCE && EVOLUTION_API_KEY) {
      try {
        const evoUrl = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_API_INSTANCE}`;
        console.log('Evolution API fallback:', { url: evoUrl, phone: formattedPhone });

        const evoRes = await fetch(evoUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: formattedPhone,
            text: message,
          }),
        });

        const evoText = await evoRes.text();
        console.log('Evolution API response:', evoRes.status, evoText);

        if (evoRes.ok) {
          messageSent = true;
          whatsappError = '';
        } else {
          whatsappError = `Evolution API ${evoRes.status}: ${evoText}`;
        }
      } catch (err) {
        whatsappError = `Evolution API error: ${err.message || String(err)}`;
        console.error('Evolution API error:', err);
      }
    } else if (!messageSent && !whatsappError) {
      whatsappError = 'No messaging service configured';
    }

    return res.status(200).json({
      success: true,
      messageSent,
      whatsappError: messageSent ? undefined : whatsappError,
    });
  } catch (err) {
    console.error('Error in send-whatsapp:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

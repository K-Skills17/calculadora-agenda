import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AgendaForm from './components/AgendaForm';
import LeadCapture from './components/LeadCapture';
import ResultsDashboard from './components/ResultsDashboard';
import { calculateAgenda, formatCurrency } from './utils/calculations';
import './App.css';

/** Decode a base64-JSON hash into { inputs, results } or null */
function decodeHash() {
  try {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    const json = atob(hash);
    const data = JSON.parse(json);
    if (data && data.results) return data;
  } catch {
    /* invalid hash — ignore */
  }
  return null;
}

function App() {
  const [step, setStep] = useState('landing');
  const [inputs, setInputs] = useState(null);
  const [results, setResults] = useState(null);
  const [leadData, setLeadData] = useState(null);

  // On mount: check for shared results in URL hash
  useEffect(() => {
    const shared = decodeHash();
    if (shared) {
      setResults(shared.results);
      setInputs(shared.inputs || null);
      setStep('results');
    }
  }, []);

  const handleStart = () => {
    setStep('form');
    window.scrollTo(0, 0);
  };

  const handleCalculate = (formInputs) => {
    const calcResults = calculateAgenda(formInputs);
    setInputs(formInputs);
    setResults(calcResults);
    setStep('leadCapture');
    window.scrollTo(0, 0);
  };

  const handleLeadSubmit = (data) => {
    setLeadData(data);
    setStep('results');
    window.scrollTo(0, 0);

    // Send lead + results to server-side API (handles Sheets, CAPI, AI analysis, WhatsApp)
    const score = Math.round((results.receitaExtra / results.receitaMensalAtual) * 100);
    const topIssues = [
      `Receita atual: ${formatCurrency(results.receitaMensalAtual)}/mes`,
      `Receita ideal: ${formatCurrency(results.receitaIdealMensal)}/mes`,
      `Ganho potencial: +${formatCurrency(results.receitaExtra)}/mes`,
      `Valor hora atual: ${formatCurrency(results.horaRealAtual)} → Ideal: ${formatCurrency(results.horaRealIdeal)}`,
    ];

    fetch('/api/send-whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.nome,
        phone: data.whatsapp,
        clinicName: data.clinica,
        email: data.email,
        city: data.cidade || '',
        score,
        topIssues,
        agendaData: {
          receitaAtual: formatCurrency(results.receitaMensalAtual),
          receitaIdeal: formatCurrency(results.receitaIdealMensal),
          receitaExtra: formatCurrency(results.receitaExtra),
          horaAtual: formatCurrency(results.horaRealAtual),
          horaIdeal: formatCurrency(results.horaRealIdeal),
          horasEconomizadas: `${results.horasEconomizadas.toFixed(1)}h/semana`,
          worstMismatch: results.worstMismatch
            ? `${results.worstMismatch.nome} consome ${Math.round(results.worstMismatch.percentTempo)}% do tempo mas gera apenas ${Math.round(results.worstMismatch.percentReceita)}% da receita`
            : null,
          procedures: results.optimized.map(p => ({
            nome: p.nome,
            receitaPorHora: p.receitaPorHora,
            valorProcedimento: p.valor,
            tempoMinutos: p.tempoMinutos,
            quantidadeAtual: p.quantidadeSemanal,
            quantidadeIdeal: p.quantidadeIdeal,
          })),
        },
      }),
    }).then(res => res.json())
      .then(data => {
        if (!data.messageSent) {
          console.warn('WhatsApp message not sent:', data.whatsappError);
        }
      })
      .catch(err => console.error('Failed to send to API:', err));
  };

  return (
    <>
      {step === 'landing' && <LandingPage onStart={handleStart} />}
      {step === 'form' && <AgendaForm onCalculate={handleCalculate} />}
      {step === 'leadCapture' && <LeadCapture results={results} onSubmit={handleLeadSubmit} />}
      {step === 'results' && <ResultsDashboard results={results} inputs={inputs} leadData={leadData} />}
    </>
  );
}

export default App;

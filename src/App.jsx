import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import AgendaForm from './components/AgendaForm';
import LeadCapture from './components/LeadCapture';
import ResultsDashboard from './components/ResultsDashboard';
import { calculateAgenda } from './utils/calculations';
import { sendToSheet } from './utils/sheets';
import { sendResultsToChatbot } from './utils/chatbot';
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

    // Save to Google Sheet
    sendToSheet({
      ...data,
      horasPorDia: inputs.horasPorDia,
      diasPorSemana: inputs.diasPorSemana,
      metaReceita: inputs.metaReceita,
      totalProcedimentos: inputs.procedimentos.length,
      receitaMensalAtual: results.receitaMensalAtual,
      receitaIdealMensal: results.receitaIdealMensal,
      horaRealAtual: results.horaRealAtual,
    });

    // Send results to AI chatbot -> chatbot sends WhatsApp report to user
    sendResultsToChatbot(data, results);
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

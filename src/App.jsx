import { useState } from 'react';
import LandingPage from './components/LandingPage';
import AgendaForm from './components/AgendaForm';
import LeadCapture from './components/LeadCapture';
import ResultsDashboard from './components/ResultsDashboard';
import { calculateAgenda } from './utils/calculations';
import { sendToSheet } from './utils/sheets';
import { sendResultsToChatbot } from './utils/chatbot';
import './App.css';

function App() {
  const [step, setStep] = useState('landing');
  const [inputs, setInputs] = useState(null);
  const [results, setResults] = useState(null);
  const [leadData, setLeadData] = useState(null);

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

    // Send results to AI chatbot → chatbot sends WhatsApp report to user
    sendResultsToChatbot(data, results);
  };

  return (
    <>
      {step === 'landing' && <LandingPage onStart={handleStart} />}
      {step === 'form' && <AgendaForm onCalculate={handleCalculate} />}
      {step === 'leadCapture' && <LeadCapture results={results} onSubmit={handleLeadSubmit} />}
      {step === 'results' && <ResultsDashboard results={results} leadData={leadData} />}
    </>
  );
}

export default App;

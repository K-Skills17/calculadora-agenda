import { useState } from 'react';
import { PROCEDURE_PRESETS } from '../utils/calculations';

const emptyProc = { nome: '', valor: '', tempoMinutos: '', quantidadeSemanal: '' };

export default function AgendaForm({ onCalculate }) {
  const [horasPorDia, setHorasPorDia] = useState('');
  const [diasPorSemana, setDiasPorSemana] = useState('');
  const [metaReceita, setMetaReceita] = useState('');
  const [procedimentos, setProcedimentos] = useState([{ ...emptyProc }, { ...emptyProc }]);

  const updateProc = (i, field, value) => {
    setProcedimentos((prev) => {
      const copy = [...prev];
      copy[i] = { ...copy[i], [field]: value };
      return copy;
    });
  };

  const addProc = () => {
    if (procedimentos.length >= 8) return;
    setProcedimentos((prev) => [...prev, { ...emptyProc }]);
  };

  const removeProc = (i) => {
    if (procedimentos.length <= 2) return;
    setProcedimentos((prev) => prev.filter((_, idx) => idx !== i));
  };

  const isValid =
    horasPorDia && diasPorSemana && metaReceita &&
    procedimentos.every((p) => p.nome && p.valor && p.tempoMinutos && p.quantidadeSemanal);

  const handleSubmit = (e) => {
    e.preventDefault();
    onCalculate({
      horasPorDia: parseFloat(horasPorDia) || 8,
      diasPorSemana: parseFloat(diasPorSemana) || 5,
      metaReceita: parseFloat(metaReceita) || 0,
      procedimentos: procedimentos.map((p) => ({
        nome: p.nome,
        valor: parseFloat(p.valor) || 0,
        tempoMinutos: parseFloat(p.tempoMinutos) || 30,
        quantidadeSemanal: parseFloat(p.quantidadeSemanal) || 0,
      })),
    });
  };

  return (
    <div className="diagnostic-page">
      <div className="container">
        <div className="progress-bar">
          <div className="progress-step active" />
          <div className="progress-step" />
          <div className="progress-step" />
        </div>

        <div className="diagnostic-header fade-up">
          <h2>Sua Agenda Atual</h2>
          <p>Informe sua rotina atual e os procedimentos que você realiza semanalmente.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="section-card fade-up">
            <h3 className="section-title">Sua Rotina Atual</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Horas trabalhadas/dia</label>
                <input type="number" placeholder="Ex: 8" value={horasPorDia} onChange={(e) => setHorasPorDia(e.target.value)} min="1" max="16" />
              </div>
              <div className="form-group">
                <label>Dias por semana</label>
                <input type="number" placeholder="Ex: 5" value={diasPorSemana} onChange={(e) => setDiasPorSemana(e.target.value)} min="1" max="7" />
              </div>
              <div className="form-group full-width">
                <label>Meta de receita mensal (R$)</label>
                <input type="number" placeholder="Ex: 30000" value={metaReceita} onChange={(e) => setMetaReceita(e.target.value)} min="0" />
              </div>
            </div>
          </div>

          {procedimentos.map((proc, i) => (
            <div className="section-card fade-up" key={i}>
              <div className="section-header">
                <h3 className="section-title">Procedimento {i + 1}</h3>
                {procedimentos.length > 2 && (
                  <button type="button" className="btn-remove" onClick={() => removeProc(i)}>Remover</button>
                )}
              </div>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Nome do procedimento</label>
                  <input type="text" list="presets" placeholder="Selecione ou digite..." value={proc.nome} onChange={(e) => updateProc(i, 'nome', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Valor cobrado (R$)</label>
                  <input type="number" placeholder="Ex: 350" value={proc.valor} onChange={(e) => updateProc(i, 'valor', e.target.value)} min="0" />
                </div>
                <div className="form-group">
                  <label>Tempo de cadeira (min)</label>
                  <input type="number" placeholder="Ex: 45" value={proc.tempoMinutos} onChange={(e) => updateProc(i, 'tempoMinutos', e.target.value)} min="1" />
                </div>
                <div className="form-group full-width">
                  <label>Quantidade por semana</label>
                  <input type="number" placeholder="Ex: 10" value={proc.quantidadeSemanal} onChange={(e) => updateProc(i, 'quantidadeSemanal', e.target.value)} min="0" />
                </div>
              </div>
            </div>
          ))}

          <datalist id="presets">
            {PROCEDURE_PRESETS.map((p) => <option key={p} value={p} />)}
          </datalist>

          {procedimentos.length < 8 && (
            <div className="add-convenio-wrapper fade-up">
              <button type="button" className="btn-add-convenio" onClick={addProc}>+ Adicionar Procedimento</button>
            </div>
          )}

          <div className="form-actions fade-up">
            <button type="submit" className="btn-primary" disabled={!isValid}>Ver Meu Resultado</button>
          </div>
        </form>
      </div>
    </div>
  );
}

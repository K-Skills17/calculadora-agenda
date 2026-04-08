import { useRef, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import { formatCurrency } from '../utils/calculations';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WHATSAPP_NUMBER } from '../config';

const COLORS = ['#C4A265', '#27AE60', '#E74C3C', '#3498DB', '#9B59B6', '#E67E22', '#1ABC9C', '#F39C12'];

export default function ResultsDashboard({ results, inputs, leadData }) {
  const dashboardRef = useRef(null);
  const [shareLabel, setShareLabel] = useState('Compartilhar Resultado');

  // Shared-link visitors have no leadData
  const isSharedView = !leadData;
  const clinicName = leadData?.clinica || 'Minha Clinica';
  const clinicCity = leadData?.cidade || '';

  const whatsappMessage = encodeURIComponent(
    `Olá! Fiz a Calculadora de Agenda Ideal da minha clínica "${clinicName}" e descobri que posso ganhar ${formatCurrency(results.receitaExtra)} a mais por mês otimizando minha agenda. Gostaria de saber como atrair os pacientes certos para preencher essa agenda ideal.`
  );
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    try {
      const canvas = await html2canvas(dashboardRef.current, { scale: 2, backgroundColor: '#FAFAF8', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`agenda-ideal-${clinicName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch {
      alert('Erro ao gerar PDF. Tente novamente.');
    }
  };

  /** Build a shareable URL with results encoded in the hash */
  const handleShare = async () => {
    try {
      const payload = { results, inputs };
      const hash = btoa(JSON.stringify(payload));
      const shareUrl = `${window.location.origin}${window.location.pathname}#${hash}`;

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback for older browsers / non-https
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }

      setShareLabel('Link copiado!');
      setTimeout(() => setShareLabel('Compartilhar Resultado'), 2500);
    } catch {
      alert('Não foi possível copiar o link. Tente novamente.');
    }
  };

  // Mismatch pie data
  const timePieData = results.mismatch.map((m, i) => ({ name: m.nome, value: Math.round(m.percentTempo * 10) / 10, fill: COLORS[i % COLORS.length] }));
  const revenuePieData = results.mismatch.map((m, i) => ({ name: m.nome, value: Math.round(m.percentReceita * 10) / 10, fill: COLORS[i % COLORS.length] }));

  // Comparison chart
  const comparisonData = results.optimized.map((p) => ({
    name: p.nome.length > 10 ? p.nome.substring(0, 10) + '...' : p.nome,
    'Atual': p.quantidadeSemanal,
    'Ideal': p.quantidadeIdeal,
  }));

  return (
    <div className="results-page">
      <div className="container" ref={dashboardRef}>
        <div className="progress-bar">
          <div className="progress-step active" />
          <div className="progress-step active" />
          <div className="progress-step active" />
        </div>

        <div className="results-header fade-up">
          <h2>Sua Agenda Ideal</h2>
          {!isSharedView && (
            <div className="clinic-name">{clinicName} — {clinicCity || 'Brasil'}</div>
          )}
          {isSharedView && (
            <div className="clinic-name">Resultado compartilhado</div>
          )}
        </div>

        {/* WhatsApp confirmation banner — only for users who submitted lead info */}
        {!isSharedView && (
          <div className="whatsapp-sent-banner fade-up">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span>Confira seu WhatsApp! Enviamos uma análise detalhada com próximos passos.</span>
          </div>
        )}

        {/* Key metrics */}
        <div className="metrics-grid fade-up fade-up-delay-1">
          <div className="metric-card">
            <div className="metric-label">Receita Atual</div>
            <div className="metric-value">{formatCurrency(results.receitaMensalAtual)}</div>
            <div className="metric-sub">/mês</div>
          </div>
          <div className="metric-card highlight">
            <div className="metric-label">Receita Ideal</div>
            <div className="metric-value green">{formatCurrency(results.receitaIdealMensal)}</div>
            <div className="metric-sub">/mês</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Hora Atual</div>
            <div className="metric-value">{formatCurrency(results.horaRealAtual)}</div>
            <div className="metric-sub">/hora</div>
          </div>
          <div className="metric-card highlight">
            <div className="metric-label">Hora Ideal</div>
            <div className="metric-value green">{formatCurrency(results.horaRealIdeal)}</div>
            <div className="metric-sub">/hora</div>
          </div>
        </div>

        {/* Gain card */}
        <div className="big-number-card fade-up">
          <div className="label">Você pode ganhar a mais por mês</div>
          <div className="amount" style={{ color: '#27AE60' }}>+{formatCurrency(results.receitaExtra)}</div>
          {results.horasEconomizadas > 0 && (
            <div className="annual">
              E economizar <span style={{ color: '#C4A265' }}>{results.horasEconomizadas.toFixed(1)}h</span> por semana
            </div>
          )}
        </div>

        {/* Mismatch insight */}
        {results.worstMismatch && (
          <div className="insight-card fade-up">
            <p>
              Você gasta <strong>{Math.round(results.worstMismatch.percentTempo)}% do seu tempo</strong> em{' '}
              <strong>{results.worstMismatch.nome}</strong>, mas esse procedimento gera apenas{' '}
              <strong>{Math.round(results.worstMismatch.percentReceita)}% da sua receita</strong>.
            </p>
          </div>
        )}

        {/* Time vs Revenue pie charts */}
        <div className="pie-comparison fade-up">
          <div className="pie-card">
            <h3>Tempo por Procedimento</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={timePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" nameKey="name">
                  {timePieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="pie-card">
            <h3>Receita por Procedimento</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={revenuePieData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} dataKey="value" nameKey="name">
                  {revenuePieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v) => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Legend */}
        <div className="pie-legend fade-up">
          {results.mismatch.map((m, i) => (
            <div key={i} className="legend-item">
              <div className="legend-dot" style={{ background: COLORS[i % COLORS.length] }} />
              <span>{m.nome}</span>
            </div>
          ))}
        </div>

        {/* Schedule comparison */}
        <div className="chart-section fade-up">
          <h3>Agenda Atual vs. Ideal (por semana)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Atual" fill="#6B6B6B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Ideal" fill="#C4A265" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue per hour ranking */}
        <div className="ranking-section fade-up">
          <h3>Ranking: Receita por Hora</h3>
          <p className="plan-subtitle">Priorize os procedimentos do topo da lista</p>
          {results.optimized.map((p, i) => (
            <div className="ranking-card" key={i}>
              <div className="ranking-position" style={{ background: COLORS[i % COLORS.length] }}>{i + 1}</div>
              <div className="ranking-info">
                <div className="ranking-name">{p.nome}</div>
                <div className="ranking-detail">
                  {formatCurrency(p.receitaPorHora)}/hora | {p.tempoMinutos}min | {formatCurrency(p.valor)} por procedimento
                </div>
              </div>
              <div className="ranking-change">
                <span className="ranking-current">{p.quantidadeSemanal}/sem</span>
                <span className="ranking-arrow">→</span>
                <span className="ranking-ideal">{p.quantidadeIdeal}/sem</span>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="cta-section fade-up">
          <h3>Agora Você Sabe Quais Pacientes Priorizar</h3>
          <p>
            Nós construímos sistemas de marketing que atraem exatamente os pacientes de alto valor
            para preencher sua agenda ideal.
          </p>
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Falar com Especialista
          </a>
          <br />
          <button className="btn-secondary" onClick={handleExportPDF}>Baixar Agenda Ideal em PDF</button>
          <br />
          <button className="btn-share" onClick={handleShare}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            {shareLabel}
          </button>
        </div>

        <div className="footer">
          Ferramenta gratuita por{' '}
          <a href="https://lkdigital.odo.br" target="_blank" rel="noopener noreferrer">LK Digital</a>
          {' '}&mdash; Sistemas que funcionam para dentistas
        </div>
      </div>
    </div>
  );
}

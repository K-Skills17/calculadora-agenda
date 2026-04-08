import { useState } from 'react';
import { formatCurrency } from '../utils/calculations';

export default function LeadCapture({ results, onSubmit }) {
  const [form, setForm] = useState({ nome: '', clinica: '', email: '', whatsapp: '', cidade: '' });
  const isValid = form.nome && form.clinica && form.email && form.whatsapp;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) onSubmit(form);
  };

  return (
    <div className="landing lead-gate">
      <div className="landing-logo">LK <span>Digital</span></div>

      <div className="lead-gate-teaser fade-up">
        <div className="teaser-label">Seu resultado está pronto!</div>
        <div className="teaser-amount">+{formatCurrency(results.receitaExtra)}</div>
        <div className="teaser-sub">a mais por mês com sua agenda otimizada</div>
      </div>

      <div className="progress-bar fade-up" style={{ maxWidth: 200 }}>
        <div className="progress-step active" />
        <div className="progress-step active" />
        <div className="progress-step" />
      </div>

      <h2 className="lead-gate-title fade-up fade-up-delay-1">
        Preencha seus dados para ver o relatório completo
      </h2>

      <p className="subtitle fade-up fade-up-delay-1" style={{ marginBottom: 32 }}>
        Você receberá automaticamente no seu WhatsApp uma análise detalhada dos seus resultados com os próximos passos recomendados.
      </p>

      <form className="lead-form fade-up fade-up-delay-2" onSubmit={handleSubmit}>
        <input type="text" placeholder="Seu nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
        <input type="text" placeholder="Nome da clínica" value={form.clinica} onChange={(e) => setForm({ ...form, clinica: e.target.value })} required />
        <input type="email" placeholder="Seu melhor e-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input type="tel" placeholder="Seu WhatsApp (com DDD)" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} required />
        <input type="text" placeholder="Cidade (opcional)" value={form.cidade} onChange={(e) => setForm({ ...form, cidade: e.target.value })} />
        <button type="submit" className="btn-primary" disabled={!isValid}>
          <span className="btn-icon-text">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Ver Resultado e Receber Análise no WhatsApp
          </span>
        </button>
      </form>

      <div className="lead-gate-note fade-up fade-up-delay-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
        Seus dados estão seguros e não serão compartilhados.
      </div>

      {/* Contact Info */}
      <div className="contact-section fade-up fade-up-delay-3">
        <p>Precisa de ajuda? Fale conosco:</p>
        <div className="contact-links">
          <a href="mailto:contato@lkdigital.org">📧 contato@lkdigital.org</a>
          <a href="tel:+5511946851028">📞 (11) 94685-1028</a>
        </div>
      </div>

      <div className="footer">
        <a href="https://lkdigital.odo.br" target="_blank" rel="noopener noreferrer">lkdigital.odo.br</a>
      </div>
    </div>
  );
}

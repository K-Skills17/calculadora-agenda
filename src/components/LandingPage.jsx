export default function LandingPage({ onStart }) {
  return (
    <div className="landing">
      <div className="landing-logo">LK <span>Digital</span></div>

      <h1 className="fade-up">
        Trabalhe <em>menos horas</em> e ganhe mais com a agenda certa
      </h1>

      <p className="subtitle fade-up fade-up-delay-1">
        Descubra como otimizar sua agenda para priorizar os procedimentos que
        mais geram receita — em menos de 3 minutos.
      </p>

      <div className="fade-up fade-up-delay-2">
        <button className="btn-primary" onClick={onStart}>Começar o Diagnóstico</button>
      </div>

      <div className="landing-features fade-up fade-up-delay-3">
        <div className="landing-feature"><div className="number">3 min</div><p>Para calcular</p></div>
        <div className="landing-feature"><div className="number">100%</div><p>Gratuito</p></div>
        <div className="landing-feature"><div className="number">+R$</div><p>Receita otimizada</p></div>
      </div>

      <div className="footer">
        <a href="https://lkdigital.odo.br" target="_blank" rel="noopener noreferrer">lkdigital.odo.br</a>
      </div>
    </div>
  );
}

export const PROCEDURE_PRESETS = [
  'Resina Composta',
  'Tratamento de Canal',
  'Extração Simples',
  'Limpeza/Profilaxia',
  'Clareamento',
  'Coroa/Prótese',
  'Implante',
  'Ortodontia Mensal',
  'Faceta',
  'Restauração',
  'Consulta Avaliação',
  'Cirurgia de Siso',
];

export function calculateAgenda(inputs) {
  const { horasPorDia, diasPorSemana, metaReceita, procedimentos } = inputs;
  const horasSemanais = horasPorDia * diasPorSemana;
  const semanasPorMes = 4.33;
  const horasMensais = horasSemanais * semanasPorMes;

  // Current analysis
  const procs = procedimentos.map((p) => {
    const receitaPorHora = p.tempoMinutos > 0 ? (p.valor / p.tempoMinutos) * 60 : 0;
    const horasSemanaisProc = (p.quantidadeSemanal * p.tempoMinutos) / 60;
    const receitaSemanal = p.quantidadeSemanal * p.valor;
    const receitaMensal = receitaSemanal * semanasPorMes;

    return {
      ...p,
      receitaPorHora,
      horasSemanaisProc,
      receitaSemanal,
      receitaMensal,
    };
  });

  const totalHorasSemanaisAtual = procs.reduce((s, p) => s + p.horasSemanaisProc, 0);
  const receitaMensalAtual = procs.reduce((s, p) => s + p.receitaMensal, 0);
  const horaRealAtual = totalHorasSemanaisAtual > 0
    ? receitaMensalAtual / (totalHorasSemanaisAtual * semanasPorMes)
    : 0;

  // Time/revenue mismatch analysis
  const totalTempoPercent = procs.reduce((s, p) => s + p.horasSemanaisProc, 0);
  const totalReceitaPercent = procs.reduce((s, p) => s + p.receitaSemanal, 0);
  const mismatch = procs.map((p) => ({
    nome: p.nome,
    percentTempo: totalTempoPercent > 0 ? (p.horasSemanaisProc / totalTempoPercent) * 100 : 0,
    percentReceita: totalReceitaPercent > 0 ? (p.receitaSemanal / totalReceitaPercent) * 100 : 0,
  }));

  // Find worst mismatch
  let worstMismatch = null;
  let biggestGap = 0;
  mismatch.forEach((m) => {
    const gap = m.percentTempo - m.percentReceita;
    if (gap > biggestGap) {
      biggestGap = gap;
      worstMismatch = m;
    }
  });

  // Optimization: sort by revenue/hour, reallocate
  const sorted = [...procs].sort((a, b) => b.receitaPorHora - a.receitaPorHora);

  const optimized = sorted.map((p) => {
    const rank = sorted.indexOf(p);
    const totalProcs = sorted.length;
    let newQtd;

    if (rank < totalProcs / 2) {
      // High value: increase by up to 50%
      newQtd = Math.round(p.quantidadeSemanal * 1.5);
    } else {
      // Low value: decrease by up to 50%
      newQtd = Math.max(1, Math.round(p.quantidadeSemanal * 0.5));
    }

    return { ...p, quantidadeIdeal: newQtd };
  });

  // Constrain to available hours
  let totalHorasIdeal = optimized.reduce((s, p) => s + (p.quantidadeIdeal * p.tempoMinutos) / 60, 0);

  if (totalHorasIdeal > horasSemanais) {
    const ratio = horasSemanais / totalHorasIdeal;
    optimized.forEach((p) => {
      p.quantidadeIdeal = Math.max(1, Math.round(p.quantidadeIdeal * ratio));
    });
    totalHorasIdeal = optimized.reduce((s, p) => s + (p.quantidadeIdeal * p.tempoMinutos) / 60, 0);
  }

  const receitaIdealSemanal = optimized.reduce((s, p) => s + p.quantidadeIdeal * p.valor, 0);
  const receitaIdealMensal = receitaIdealSemanal * semanasPorMes;
  const horaRealIdeal = totalHorasIdeal > 0
    ? receitaIdealMensal / (totalHorasIdeal * semanasPorMes)
    : 0;

  const horasEconomizadas = Math.max(0, totalHorasSemanaisAtual - totalHorasIdeal);
  const receitaExtra = receitaIdealMensal - receitaMensalAtual;

  return {
    procs,
    optimized,
    mismatch,
    worstMismatch,
    totalHorasSemanaisAtual,
    totalHorasIdeal,
    receitaMensalAtual,
    receitaIdealMensal,
    horaRealAtual,
    horaRealIdeal,
    horasEconomizadas,
    receitaExtra,
    horasSemanais,
    metaReceita,
  };
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

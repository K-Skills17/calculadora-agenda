// =============================================================
// CALCULADORA DE AGENDA IDEAL
// =============================================================
// INSTRUÇÕES DE INSTALAÇÃO:
// 1. Crie uma nova Google Sheet (ou use uma aba na sheet existente)
// 2. Vá em Extensões > Apps Script
// 3. Apague o código existente e cole este script inteiro
// 4. Clique em "Implantar" > "Nova implantação"
// 5. Tipo: "App da Web"
// 6. Executar como: "Eu" (sua conta)
// 7. Quem tem acesso: "Qualquer pessoa"
// 8. Clique em "Implantar" e copie a URL gerada
// 9. Cole a URL no arquivo src/config.js do app
// =============================================================

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Create headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Data/Hora',
        'Nome',
        'Clínica',
        'Email',
        'Cidade',
        'Horas/Dia',
        'Dias/Semana',
        'Meta Receita R$',
        'Qtd Procedimentos',
        'Receita Atual R$/mês',
        'Receita Ideal R$/mês',
        'Hora Real Atual R$/h'
      ]);

      sheet.getRange(1, 1, 1, 12).setFontWeight('bold');
    }

    sheet.appendRow([
      new Date().toLocaleString('pt-BR'),
      data.nome || '',
      data.clinica || '',
      data.email || '',
      data.cidade || '',
      data.horasPorDia || '',
      data.diasPorSemana || '',
      data.metaReceita || '',
      data.totalProcedimentos || '',
      data.receitaMensalAtual ? Math.round(data.receitaMensalAtual) : '',
      data.receitaIdealMensal ? Math.round(data.receitaIdealMensal) : '',
      data.horaRealAtual ? Math.round(data.horaRealAtual) : ''
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Calculadora Agenda API ativa' }))
    .setMimeType(ContentService.MimeType.JSON);
}

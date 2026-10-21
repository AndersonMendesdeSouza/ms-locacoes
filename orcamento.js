const serviceGroups = [
  {
    name: 'Som, luz e imagem',
    items: [
      { id: 'som', name: 'Som profissional', description: 'Sonorização para o seu evento.', image: 'assets/eventos/eventoseproducao.png', maxQuantity: 10 },
      { id: 'iluminacao', name: 'Iluminação', description: 'Luz para valorizar cada momento.', image: 'assets/iluminacao/iluminacao.png', maxQuantity: 10 },
      { id: 'laser', name: 'Laser', description: 'Efeitos para criar impacto visual.', image: 'assets/laser/laser.png', maxQuantity: 10 },
      { id: 'led', name: 'Painel de LED', description: 'Imagem e destaque para a sua produção.', image: 'assets/eventos/evento2.png', maxQuantity: 10 }
    ]
  },
  {
    name: 'Estruturas e coberturas',
    items: [
      { id: 'palco', name: 'Palco', description: 'Espaço para suas apresentações.', image: 'assets/eventos/eventoseproducao.png', maxQuantity: 10 },
      { id: 'grid', name: 'Grid', description: 'Sustentação para luz e equipamentos.', image: 'assets/eventos/evento.png', maxQuantity: 10 },
      { id: 'tenda', name: 'Tenda', description: 'Cobertura para receber seus convidados.', image: 'assets/tendas/tenda.png', maxQuantity: 50 },
      { id: 'tunel', name: 'Túnel', description: 'Passagens cobertas para o seu espaço.', image: 'assets/tuneis/tuneo.png', maxQuantity: 50 }
    ]
  },
  {
    name: 'Complementos para receber bem',
    items: [
      { id: 'mesa', name: 'Mesa', description: 'Apoio e conforto para seus convidados.', image: 'assets/mesasfreezercadeira/mesas.png', maxQuantity: 500 },
      { id: 'cadeira', name: 'Cadeira', description: 'Um lugar para cada convidado.', image: 'assets/mesasfreezercadeira/cadeira.png', maxQuantity: 1000 },
      { id: 'freezer', name: 'Freezer', description: 'Bebidas e alimentos bem conservados.', image: 'assets/mesasfreezercadeira/freezer.png', maxQuantity: 50 }
    ]
  }
];

const requestMessage = 'Olá, MS Locações! Gostaria de um orçamento para os itens desta solicitação. Por favor, confirmem a disponibilidade e as condições para o meu evento.';
const catalog = document.getElementById('service-groups');
const template = document.getElementById('budget-item-template');
const summaryList = document.getElementById('summary-items');
const summaryEmpty = document.getElementById('summary-empty');
const feedback = document.getElementById('selection-feedback');
const quantityError = document.getElementById('quantity-error');
const whatsappButton = document.getElementById('whatsapp-button');
const generationStatus = document.getElementById('generation-status');
const generationError = document.getElementById('generation-error');
const whatsappFallback = document.getElementById('whatsapp-fallback');
const pdfDialog = document.getElementById('pdf-dialog');
const pdfDialogCancel = document.getElementById('pdf-dialog-cancel');
const pdfDialogConfirm = document.getElementById('pdf-dialog-confirm');
const itemControls = [];

document.getElementById('year').textContent = new Date().getFullYear();

const menuToggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu');

menuToggle.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  menuToggle.textContent = isOpen ? '✕' : '☰';
});

menu.addEventListener('click', event => {
  if (event.target.closest('a')) {
    menu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    menuToggle.textContent = '☰';
  }
});

for (const group of serviceGroups) {
  const section = document.createElement('section');
  section.className = 'service-group';

  const heading = document.createElement('h3');
  heading.className = 'group-title';
  heading.textContent = group.name;
  section.append(heading);

  const grid = document.createElement('div');
  grid.className = 'budget-items';

  for (const service of group.items) {
    const item = template.content.firstElementChild.cloneNode(true);
    const checkbox = item.querySelector('.item-checkbox');
    const quantity = item.querySelector('.quantity-input');
    const minus = item.querySelector('.quantity-minus');
    const plus = item.querySelector('.quantity-plus');

    item.querySelector('.item-photo').src = service.image;
    item.querySelector('.item-name').textContent = service.name;
    item.querySelector('.item-description').textContent = service.description;

    checkbox.id = `select-${service.id}`;
    checkbox.setAttribute('aria-label', `Selecionar ${service.name}`);
    quantity.id = `quantity-${service.id}`;
    quantity.max = service.maxQuantity;
    quantity.setAttribute('aria-label', `Quantidade de ${service.name}, de 1 a ${service.maxQuantity}`);
    minus.setAttribute('aria-label', `Diminuir quantidade de ${service.name}`);
    plus.setAttribute('aria-label', `Aumentar quantidade de ${service.name}`);

    itemControls.push({ service, item, checkbox, quantity, minus, plus });
    checkbox.addEventListener('change', updateSummary);
    quantity.addEventListener('input', updateSummary);

    minus.addEventListener('click', () => {
      const currentQuantity = Number(quantity.value) || 1;
      quantity.value = Math.max(1, Math.min(service.maxQuantity, Math.floor(currentQuantity) - 1));
      updateSummary();
    });

    plus.addEventListener('click', () => {
      const currentQuantity = Number(quantity.value) || 0;
      quantity.value = Math.min(service.maxQuantity, Math.max(1, Math.floor(currentQuantity) + 1));
      updateSummary();
    });

    grid.append(item);
  }

  section.append(grid);
  catalog.append(section);
}

function updateSummary() {
  summaryList.replaceChildren();
  generationStatus.hidden = true;
  generationError.hidden = true;
  whatsappFallback.hidden = true;
  let selectedCount = 0;
  let hasInvalidQuantity = false;

  for (const control of itemControls) {
    const { service, item, checkbox, quantity, minus, plus } = control;
    const isSelected = checkbox.checked;
    quantity.disabled = !isSelected;
    const isValid = quantity.validity.valid;
    const amount = Number(quantity.value);

    item.classList.toggle('is-selected', isSelected);
    minus.disabled = !isSelected || (isValid && amount <= 1);
    plus.disabled = !isSelected || (isValid && amount >= service.maxQuantity);
    quantity.setAttribute('aria-invalid', String(isSelected && !isValid));

    if (!isSelected) {
      continue;
    }

    selectedCount += 1;
    if (!isValid) {
      hasInvalidQuantity = true;
    }

    const line = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'summary-item-label';
    label.textContent = service.name;

    const quantityLabel = document.createElement('strong');
    quantityLabel.textContent = isValid ? `${amount} un.` : 'Confira a quantidade';
    line.append(label, quantityLabel);
    summaryList.append(line);
  }

  summaryEmpty.hidden = selectedCount > 0;
  quantityError.hidden = !hasInvalidQuantity;
  feedback.textContent = selectedCount === 0 ? 'Nenhum item selecionado' : `${selectedCount} ${selectedCount === 1 ? 'tipo de item selecionado' : 'tipos de itens selecionados'}`;
  whatsappButton.disabled = selectedCount === 0 || hasInvalidQuantity;
}

function createRequestPdf(selectedItems) {
  if (!window.jspdf?.jsPDF) {
    throw new Error('A biblioteca de PDF não foi carregada.');
  }

  const pdf = new window.jspdf.jsPDF({ format: 'a4', unit: 'mm' });
  const generatedAt = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo'
  }).format(new Date());

  pdf.setProperties({
    title: 'Solicitação de orçamento | MS Locações & Eventos',
    subject: 'Itens e quantidades para orçamento',
    author: 'MS Locações & Eventos'
  });

  pdf.setFillColor('#081822');
  pdf.roundedRect(18, 16, 174, 34, 4, 4, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor('#f5fafc');
  pdf.text('MS', 26, 37);
  pdf.setTextColor('#3cd6e8');
  pdf.text('.', 42, 37);
  pdf.setFontSize(9);
  pdf.setTextColor('#f5fafc');
  pdf.text('LOCAÇÕES', 55, 30);
  pdf.setTextColor('#3cd6e8');
  pdf.text('& EVENTOS', 55, 36);
  pdf.setTextColor('#f5fafc');
  pdf.text('SOLICITAÇÃO', 184, 30, { align: 'right' });
  pdf.text('DE ORÇAMENTO', 184, 36, { align: 'right' });

  pdf.setTextColor('#10222d');
  pdf.setFontSize(21);
  pdf.text('Itens para o meu evento', 18, 68);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor('#526570');
  pdf.text(`Gerado em ${generatedAt}`, 18, 78);
  pdf.text('Seleção de equipamentos para análise da equipe MS Locações.', 18, 85);

  pdf.setFillColor('#e4f2f4');
  pdf.rect(18, 94, 174, 11, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor('#08798e');
  pdf.text('ITEM SELECIONADO', 24, 101);
  pdf.text('QUANTIDADE', 186, 101, { align: 'right' });

  let rowY = 105;
  pdf.setFontSize(11);

  for (const item of selectedItems) {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor('#10222d');
    pdf.text(item.name, 24, rowY + 7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(String(item.quantity), 186, rowY + 7, { align: 'right' });
    pdf.setDrawColor('#d8e3e6');
    pdf.line(18, rowY + 11, 192, rowY + 11);
    rowY += 11;
  }

  const messageY = rowY + 12;
  pdf.setFillColor('#f0f5f6');
  pdf.roundedRect(18, messageY, 174, 33, 3, 3, 'F');
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor('#08798e');
  pdf.text('MENSAGEM PARA A EQUIPE', 24, messageY + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor('#10222d');
  pdf.text(pdf.splitTextToSize(requestMessage, 162), 24, messageY + 16);

  pdf.setFontSize(9);
  pdf.setTextColor('#526570');
  pdf.text('Esta solicitação está sujeita à confirmação de disponibilidade e condições de locação.', 18, messageY + 42);
  pdf.setDrawColor('#d8e3e6');
  pdf.line(18, 282, 192, 282);
  pdf.setFontSize(8);
  pdf.text('MS Locações & Eventos | Buriti Alegre - GO', 18, 288);
  pdf.text('Solicitação de orçamento', 192, 288, { align: 'right' });

  return pdf;
}

whatsappButton.addEventListener('click', () => {
  updateSummary();
  if (whatsappButton.disabled) {
    return;
  }
  pdfDialog.showModal();
});

pdfDialogCancel.addEventListener('click', () => {
  pdfDialog.close();
});

pdfDialogConfirm.addEventListener('click', () => {
  if (!pdfDialog.open) {
    return;
  }
  pdfDialog.close();
  updateSummary();
  if (whatsappButton.disabled) {
    return;
  }

  const selectedItems = [];
  for (const { service, checkbox, quantity } of itemControls) {
    if (checkbox.checked) {
      selectedItems.push({ name: service.name, quantity: Number(quantity.value) });
    }
  }

  try {
    const pdf = createRequestPdf(selectedItems);
    pdf.save('solicitacao-ms-locacoes.pdf');
  } catch (error) {
    console.error('Falha ao gerar a solicitação em PDF:', error);
    generationError.textContent = 'Não foi possível gerar o PDF. Recarregue a página e tente novamente.';
    generationError.hidden = false;
    return;
  }

  const message = [requestMessage, '', 'Itens selecionados:'];
  for (const item of selectedItems) {
    message.push(`• ${item.name}: ${item.quantity} unidade(s)`);
  }
  message.push('', 'Gerei o PDF desta solicitação e vou anexá-lo à conversa.');
  const url = `https://wa.me/5564999999687?text=${encodeURIComponent(message.join('\n'))}`;

  generationStatus.textContent = 'PDF gerado! Anexe o documento à conversa no WhatsApp. Se a conversa não abrir, use o link abaixo.';
  generationStatus.hidden = false;
  whatsappFallback.href = url;
  whatsappFallback.hidden = false;
  window.open(url, '_blank', 'noopener,noreferrer');
});

updateSummary();

// Valores fictícios em centavos. Substitua pela tabela aprovada antes de oferecer estimativas reais.
const serviceGroups = [
  {
    name: 'Som, luz e imagem',
    items: [
      { id: 'som', name: 'Som profissional', description: 'Sonorização para o seu evento.', image: 'assets/eventos/eventoseproducao.png', price: 180000, maxQuantity: 10 },
      { id: 'iluminacao', name: 'Iluminação', description: 'Luz para valorizar cada momento.', image: 'assets/iluminacao/iluminacao.png', price: 90000, maxQuantity: 10 },
      { id: 'laser', name: 'Laser', description: 'Efeitos para criar impacto visual.', image: 'assets/laser/laser.png', price: 50000, maxQuantity: 10 },
      { id: 'led', name: 'Painel de LED', description: 'Imagem e destaque para a sua produção.', image: 'assets/eventos/evento2.png', price: 150000, maxQuantity: 10 }
    ]
  },
  {
    name: 'Estruturas e coberturas',
    items: [
      { id: 'palco', name: 'Palco', description: 'Espaço para suas apresentações.', image: 'assets/eventos/eventoseproducao.png', price: 200000, maxQuantity: 10 },
      { id: 'grid', name: 'Grid', description: 'Sustentação para luz e equipamentos.', image: 'assets/eventos/evento.png', price: 80000, maxQuantity: 10 },
      { id: 'tenda', name: 'Tenda', description: 'Cobertura para receber seus convidados.', image: 'assets/tendas/tenda.png', price: 35000, maxQuantity: 50 },
      { id: 'tunel', name: 'Túnel', description: 'Passagens cobertas para o seu espaço.', image: 'assets/tuneis/tuneo.png', price: 45000, maxQuantity: 50 }
    ]
  },
  {
    name: 'Complementos para receber bem',
    items: [
      { id: 'mesa', name: 'Mesa', description: 'Apoio e conforto para seus convidados.', image: 'assets/mesasfreezercadeira/mesas.png', price: 1500, maxQuantity: 500 },
      { id: 'cadeira', name: 'Cadeira', description: 'Um lugar para cada convidado.', image: 'assets/mesasfreezercadeira/cadeira.png', price: 500, maxQuantity: 1000 },
      { id: 'freezer', name: 'Freezer', description: 'Bebidas e alimentos bem conservados.', image: 'assets/mesasfreezercadeira/freezer.png', price: 18000, maxQuantity: 50 }
    ]
  }
];

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const catalog = document.getElementById('service-groups');
const template = document.getElementById('budget-item-template');
const summaryList = document.getElementById('summary-items');
const summaryEmpty = document.getElementById('summary-empty');
const feedback = document.getElementById('selection-feedback');
const totalDisplay = document.getElementById('budget-total');
const quantityError = document.getElementById('quantity-error');
const whatsappButton = document.getElementById('whatsapp-button');
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

function formatPrice(cents) {
  return currency.format(cents / 100);
}

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
    item.querySelector('.item-price strong').textContent = formatPrice(service.price);

    checkbox.id = `select-${service.id}`;
    checkbox.setAttribute('aria-label', `Selecionar ${service.name}`);
    checkbox.setAttribute('aria-describedby', 'demo-notice');
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
  let total = 0;
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

    const lineTotal = isValid ? service.price * amount : 0;
    total += lineTotal;

    const line = document.createElement('li');
    const label = document.createElement('span');
    label.className = 'summary-item-label';
    label.textContent = service.name;

    const details = document.createElement('small');
    details.textContent = isValid ? `${amount} × ${formatPrice(service.price)} / diária` : 'Confira a quantidade';
    label.append(details);

    const subtotal = document.createElement('strong');
    subtotal.textContent = isValid ? formatPrice(lineTotal) : '—';
    line.append(label, subtotal);
    summaryList.append(line);
  }

  summaryEmpty.hidden = selectedCount > 0;
  quantityError.hidden = !hasInvalidQuantity;
  feedback.textContent = selectedCount === 0 ? 'Nenhum item selecionado' : `${selectedCount} ${selectedCount === 1 ? 'tipo de item selecionado' : 'tipos de itens selecionados'}`;
  totalDisplay.textContent = hasInvalidQuantity ? '—' : formatPrice(total);
  whatsappButton.disabled = selectedCount === 0 || hasInvalidQuantity;
}

whatsappButton.addEventListener('click', () => {
  // Revalida os campos antes de preparar a mensagem.
  updateSummary();
  if (whatsappButton.disabled) {
    return;
  }

  const message = [
    'Olá, MS Locações! Montei uma seleção no simulador e gostaria de solicitar um orçamento real para uma diária:',
    ''
  ];

  for (const { service, checkbox, quantity } of itemControls) {
    if (checkbox.checked) {
      message.push(`• ${service.name}: ${Number(quantity.value)} unidade(s)`);
    }
  }

  message.push('', 'O simulador usa valores fictícios. Poderiam confirmar os preços reais e a disponibilidade para o meu evento?');
  const url = `https://wa.me/556484188209?text=${encodeURIComponent(message.join('\n'))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
});

updateSummary();

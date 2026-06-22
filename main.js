const loginScreen = document.querySelector('#loginScreen');
const lobbyScreen = document.querySelector('#lobbyScreen');
const loginForm = document.querySelector('#loginForm');
const guestButton = document.querySelector('#guestButton');
const playerNameInput = document.querySelector('#playerName');
const playerDisplay = document.querySelector('#playerDisplay');
const playerAvatar = document.querySelector('#playerAvatar');
const passwordInput = document.querySelector('#password');
const passwordToggle = document.querySelector('#passwordToggle');
const balanceDisplay = document.querySelector('#balanceDisplay');
const filterButtons = document.querySelectorAll('.filter-button');
const tableCards = [...document.querySelectorAll('.table-card')];
const joinModal = document.querySelector('#joinModal');
const modalTitle = document.querySelector('#modalTitle');
const modalEntry = document.querySelector('#modalEntry');
const modalPrize = document.querySelector('#modalPrize');
const modalClose = document.querySelector('#modalClose');
const confirmJoin = document.querySelector('#confirmJoin');
const quickJoin = document.querySelector('#quickJoin');
const soundButton = document.querySelector('#soundButton');
const toast = document.querySelector('#toast');

let selectedTable = null;
let balance = 12500;
let toastTimeout;

const formatMoney = value => `$ ${new Intl.NumberFormat('es-AR').format(value)}`;

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase() || 'TI';
}

function showLobby(name) {
  const safeName = name.trim() || 'Invitado';
  playerDisplay.textContent = safeName;
  playerAvatar.textContent = initials(safeName);
  loginScreen.classList.remove('is-active');
  lobbyScreen.classList.add('is-active');
  window.scrollTo({ top: 0, behavior: 'instant' });
  requestAnimationFrame(() => revealVisibleElements(lobbyScreen));
}

loginForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!loginForm.checkValidity()) {
    loginForm.reportValidity();
    return;
  }
  const button = loginForm.querySelector('.login-button');
  button.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i><span>Abriendo el salón...</span>';
  button.disabled = true;
  setTimeout(() => showLobby(playerNameInput.value), 650);
});

guestButton.addEventListener('click', () => showLobby('Invitado 33'));

passwordToggle.addEventListener('click', () => {
  const show = passwordInput.type === 'password';
  passwordInput.type = show ? 'text' : 'password';
  passwordToggle.innerHTML = `<i class="fa-solid fa-eye${show ? '-slash' : ''}"></i>`;
  passwordToggle.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
});

function revealVisibleElements(scope = document) {
  scope.querySelectorAll('.fade-in').forEach((element, index) => {
    setTimeout(() => element.classList.add('visible'), index * 110);
  });
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-in').forEach(element => observer.observe(element));

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(item => item.classList.toggle('is-active', item === button));
    const filter = button.dataset.filter;
    tableCards.forEach(card => {
      const shouldShow = filter === 'all' || card.dataset.status === filter || card.dataset.tier === filter;
      card.classList.toggle('is-hidden', !shouldShow);
    });
  });
});

function openJoinModal(card) {
  selectedTable = card;
  const entry = Number(card.dataset.entry);
  modalTitle.textContent = card.dataset.name;
  modalEntry.textContent = formatMoney(entry);
  modalPrize.textContent = formatMoney(Math.round(entry * 3.6));
  confirmJoin.disabled = entry > balance;
  confirmJoin.textContent = entry > balance ? 'Saldo insuficiente' : 'Confirmar y jugar';
  joinModal.hidden = false;
  document.body.style.overflow = 'hidden';
  setTimeout(() => modalClose.focus(), 30);
}

function closeJoinModal() {
  joinModal.hidden = true;
  document.body.style.overflow = '';
  selectedTable?.querySelector('.join-button')?.focus();
}

document.querySelectorAll('.join-button:not(:disabled)').forEach(button => {
  button.addEventListener('click', () => openJoinModal(button.closest('.table-card')));
});

modalClose.addEventListener('click', closeJoinModal);
joinModal.addEventListener('click', event => {
  if (event.target === joinModal) closeJoinModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !joinModal.hidden) closeJoinModal();
});

confirmJoin.addEventListener('click', () => {
  if (!selectedTable) return;
  const entry = Number(selectedTable.dataset.entry);
  if (entry > balance) return;

  balance -= entry;
  balanceDisplay.textContent = formatMoney(balance);
  const button = selectedTable.querySelector('.join-button');
  button.innerHTML = '<i class="fa-solid fa-chair"></i> Ya estás sentado';
  button.disabled = true;
  selectedTable.classList.add('table-card--featured');
  closeJoinModal();
  showToast(`¡Te sumaste a ${selectedTable.dataset.name}!`);
});

quickJoin.addEventListener('click', () => {
  const available = tableCards.filter(card => card.dataset.status === 'available' && Number(card.dataset.entry) <= balance && !card.querySelector('.join-button').disabled);
  if (!available.length) {
    showToast('No hay mesas disponibles por ahora.');
    return;
  }
  const choice = available[Math.floor(Math.random() * available.length)];
  choice.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => openJoinModal(choice), 450);
});

function showToast(message) {
  clearTimeout(toastTimeout);
  toast.querySelector('span').textContent = message;
  toast.classList.add('is-visible');
  toastTimeout = setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

soundButton.addEventListener('click', () => {
  const muted = soundButton.classList.toggle('is-muted');
  soundButton.innerHTML = `<i class="fa-solid fa-volume-${muted ? 'xmark' : 'high'}"></i>`;
  soundButton.setAttribute('aria-label', muted ? 'Activar sonidos' : 'Desactivar sonidos');
  showToast(muted ? 'Sonidos desactivados' : 'Sonidos activados');
});

document.querySelector('#tournamentButton').addEventListener('click', () => showToast('El torneo abre el viernes a las 21:00.'));

document.querySelectorAll('.bottom-nav button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.bottom-nav button').forEach(item => item.classList.toggle('is-active', item === button));
    if (!button.matches(':first-child')) showToast(`${button.textContent.trim()}: sección de muestra`);
  });
});

revealVisibleElements(loginScreen);

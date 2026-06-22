const loginScreen = document.querySelector('#loginScreen');
const lobbyScreen = document.querySelector('#lobbyScreen');
const gameScreen = document.querySelector('#gameScreen');
const gameLoading = document.querySelector('#gameLoading');
const loadingMessage = document.querySelector('#loadingMessage');
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
const loginSound = document.querySelector('#loginSound');
const toast = document.querySelector('#toast');
const gameTitle = document.querySelector('#gameTitle');
const gameEntry = document.querySelector('#gameEntry');
const gamePlayerAvatar = document.querySelector('#gamePlayerAvatar');
const gamePlayerName = document.querySelector('#gamePlayerName');
const turnMessage = document.querySelector('#turnMessage');
const cardHint = document.querySelector('#cardHint');
const leaveGame = document.querySelector('#leaveGame');
const gameSound = document.querySelector('#gameSound');
const gameSettings = document.querySelector('#gameSettings');
const chatButton = document.querySelector('#chatButton');
const playCards = [...document.querySelectorAll('.play-card')];
const gameActions = [...document.querySelectorAll('.game-action')];
const fantasyModals = [...document.querySelectorAll('.fantasy-overlay')];
const menuButtons = [...document.querySelectorAll('.bottom-nav button')];

let selectedTable = null;
let balance = 12500;
let toastTimeout;
let gameReactionTimeout;

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
  document.body.classList.add('lobby-active');
  window.scrollTo({ top: 0, behavior: 'auto' });
  window.trucoAudio?.play('open');
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
  if (event.key === 'Escape') closeFantasyModals();
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
  startGameTransition(selectedTable);
});

function startGameTransition(table) {
  const messages = ['Barajando el mazo...', 'Repartiendo las cartas...', 'Preparando tu lugar...'];
  gameLoading.hidden = false;
  document.body.style.overflow = 'hidden';
  loadingMessage.textContent = messages[0];

  setTimeout(() => { loadingMessage.textContent = messages[1]; }, 430);
  setTimeout(() => { loadingMessage.textContent = messages[2]; }, 900);
  setTimeout(() => enterGame(table), 1400);
}

function enterGame(table) {
  gameTitle.textContent = table.dataset.name;
  gameEntry.textContent = formatMoney(Number(table.dataset.entry));
  gamePlayerAvatar.textContent = playerAvatar.textContent;
  gamePlayerName.textContent = playerDisplay.textContent;
  loadingMessage.textContent = 'Barajando el mazo...';
  gameLoading.hidden = true;
  lobbyScreen.classList.remove('is-active');
  gameScreen.classList.add('is-active');
  document.body.classList.remove('lobby-active');
  document.body.classList.add('game-active');
  document.body.style.overflow = 'hidden';
  resetGameInterface();
  window.trucoAudio?.play('deal');
}

function resetGameInterface() {
  clearTimeout(gameReactionTimeout);
  turnMessage.innerHTML = '<span></span> Es tu turno de jugar';
  turnMessage.classList.remove('is-reacting');
  cardHint.textContent = 'Elegí una carta o cantá tu jugada';
  playCards.forEach(card => {
    card.classList.remove('is-selected');
    card.setAttribute('aria-pressed', 'false');
  });
  gameActions.forEach(action => action.classList.remove('is-called'));
}

leaveGame.addEventListener('click', () => {
  gameScreen.classList.remove('is-active');
  lobbyScreen.classList.add('is-active');
  document.body.classList.remove('game-active');
  document.body.classList.add('lobby-active');
  document.body.style.overflow = '';
  window.scrollTo({ top: 0, behavior: 'auto' });
  showToast('Volviste al salón principal.');
});

playCards.forEach(card => {
  card.addEventListener('click', () => {
    const wasSelected = card.classList.contains('is-selected');
    playCards.forEach(item => {
      item.classList.remove('is-selected');
      item.setAttribute('aria-pressed', 'false');
    });
    if (!wasSelected) {
      card.classList.add('is-selected');
      card.setAttribute('aria-pressed', 'true');
      cardHint.textContent = `${card.dataset.card} seleccionada`;
    } else {
      cardHint.textContent = 'Elegí una carta o cantá tu jugada';
    }
  });
});

gameActions.forEach(action => {
  action.addEventListener('click', () => {
    clearTimeout(gameReactionTimeout);
    gameActions.forEach(item => item.classList.remove('is-called'));
    action.classList.add('is-called');
    turnMessage.innerHTML = `<span></span> ${action.dataset.call}`;
    turnMessage.classList.add('is-reacting');
    cardHint.textContent = action.classList.contains('game-action--fold') ? 'La mano queda en pausa' : 'Esperando la respuesta del rival';

    gameReactionTimeout = setTimeout(() => {
      turnMessage.innerHTML = '<span></span> El rival está pensando...';
      turnMessage.classList.remove('is-reacting');
      action.classList.remove('is-called');
    }, 1150);
  });
});

chatButton.addEventListener('click', () => {
  const phrases = ['¡Quiero!', 'Buena mano', 'Dale, jugá', 'Flor de carta'];
  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  turnMessage.innerHTML = `<span></span> ${phrase}`;
  turnMessage.classList.add('is-reacting');
  setTimeout(() => turnMessage.classList.remove('is-reacting'), 650);
});

gameSettings.addEventListener('click', () => showToast('Ajustes de mesa: interfaz de muestra.'));

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

function updateAudioControls(muted) {
  [loginSound, soundButton, gameSound].forEach(button => {
    button.classList.toggle('is-muted', muted);
    button.innerHTML = `<i class="fa-solid fa-volume-${muted ? 'xmark' : 'high'}"></i>`;
    button.setAttribute('aria-label', muted ? 'Activar sonidos y música' : 'Desactivar sonidos y música');
    button.setAttribute('aria-pressed', String(muted));
  });
}

function toggleAudio() {
  if (!window.trucoAudio) return;
  if (!window.trucoAudio.isMuted()) window.trucoAudio.play('click');
  const muted = window.trucoAudio.toggleMuted();
  showToast(muted ? 'Música y efectos desactivados' : 'Música y efectos activados');
}

soundButton.addEventListener('click', toggleAudio);
gameSound.addEventListener('click', toggleAudio);
loginSound.addEventListener('click', toggleAudio);
document.addEventListener('truco:audiochange', event => updateAudioControls(event.detail.muted));
updateAudioControls(window.trucoAudio?.isMuted() ?? false);

function syncFantasyProfile() {
  const name = playerDisplay.textContent;
  const avatar = playerAvatar.textContent;
  document.querySelector('#profileName').textContent = name;
  document.querySelector('#profileAvatar').textContent = avatar;
  document.querySelector('#rankingPlayerName').innerHTML = `${name} <b>Vos</b>`;
  document.querySelector('#rankingPlayerAvatar').textContent = avatar;
}

function openFantasyModal(panel) {
  const modal = document.querySelector(`#${panel}Modal`);
  if (!modal) return;
  clearTimeout(toastTimeout);
  toast.classList.remove('is-visible');
  fantasyModals.forEach(item => { item.hidden = true; });
  syncFantasyProfile();
  modal.hidden = false;
  document.body.classList.add('fantasy-open');
  setTimeout(() => modal.querySelector('.fantasy-close')?.focus(), 30);
}

function closeFantasyModals(restoreMenu = true) {
  const hadOpenModal = fantasyModals.some(modal => !modal.hidden);
  fantasyModals.forEach(modal => { modal.hidden = true; });
  document.body.classList.remove('fantasy-open');
  if (restoreMenu && hadOpenModal) {
    menuButtons.forEach(button => button.classList.toggle('is-active', button.dataset.panel === 'tables'));
    document.querySelector('[data-panel="tables"]')?.focus();
  }
}

fantasyModals.forEach(modal => {
  modal.querySelector('.fantasy-close').addEventListener('click', () => closeFantasyModals());
  modal.addEventListener('click', event => {
    if (event.target === modal) closeFantasyModals();
  });
});

document.querySelectorAll('.prototype-action').forEach(button => {
  button.addEventListener('click', () => showToast(button.dataset.message));
});

document.querySelector('#tournamentButton').addEventListener('click', () => {
  menuButtons.forEach(button => button.classList.toggle('is-active', button.dataset.panel === 'tournaments'));
  openFantasyModal('tournaments');
});

menuButtons.forEach(button => {
  button.addEventListener('click', () => {
    menuButtons.forEach(item => item.classList.toggle('is-active', item === button));
    const panel = button.dataset.panel;
    if (panel === 'tables') {
      closeFantasyModals(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    openFantasyModal(panel);
  });
});

revealVisibleElements(loginScreen);

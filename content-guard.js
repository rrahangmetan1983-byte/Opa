// These UI restrictions are deterrents, never a substitute for authentication.
(() => {
  const editable = target => target instanceof Element && target.closest('input,textarea,[contenteditable="true"]');
  const protectedContent = target => target instanceof Element && target.closest('.brand,.event,.detail,.modal');
  document.addEventListener('copy', event => { if (!editable(event.target)) event.preventDefault(); });
  document.addEventListener('cut', event => { if (!editable(event.target)) event.preventDefault(); });
  document.addEventListener('contextmenu', event => {
    if (!editable(event.target) && (protectedContent(event.target) || event.target instanceof HTMLImageElement)) event.preventDefault();
  });
  document.addEventListener('dragstart', event => {
    if (event.target instanceof HTMLImageElement || protectedContent(event.target)) event.preventDefault();
  });
  const logout = document.createElement('form');
  logout.id = 'familyLogout';
  logout.method = 'post';
  logout.action = '/logout';
  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = 'Uitloggen';
  logout.append(button);
  document.body.append(logout);
})();

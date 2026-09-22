(function () {
  const residentMemory = {
    places: 'r-places', community: 'r-community', today: 'r-today', you: 'r-you'
  };
  let currentResident = 'r-community';
  let currentManager = 'm-portfolio';
  let activeAccount = 'cedar'; // cedar | lamar
  let role = 'resident'; // resident | manager

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return [...(root || document).querySelectorAll(sel)]; }

  window.setRole = function (r) {
    role = r;
    $all('.role-switch button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-role') === r);
    });
    $('#ws-resident').classList.toggle('active', r === 'resident');
    $('#ws-manager').classList.toggle('active', r === 'manager');
    try { history.replaceState(null, '', r === 'manager' ? '#mgr/' + currentManager : '#' + currentResident); } catch (e) {}
  };

  window.go = function (name) {
    if (name.indexOf('m-') === 0) { goMgr(name); return; }
    const next = $('[data-screen="' + name + '"]');
    if (!next) { console.warn('Missing screen:', name); return; }
    const prev = $('[data-screen="' + currentResident + '"]');
    if (prev && prev !== next) {
      prev.classList.remove('active');
      prev.classList.add('exit-left');
      setTimeout(function () { prev.classList.remove('exit-left'); }, 300);
    }
    next.classList.add('active');
    currentResident = name;
    const navKey = next.getAttribute('data-nav') || 'community';
    if (Object.prototype.hasOwnProperty.call(residentMemory, navKey)) residentMemory[navKey] = name;
    updateResidentNav(navKey);
    next.scrollTop = 0;
    if (role !== 'resident') setRole('resident');
    try { history.replaceState(null, '', '#' + name); } catch (e) {}
  };

  window.navTo = function (tab) {
    go(residentMemory[tab] || ('r-' + tab));
  };

  function updateResidentNav(activeTab) {
    $all('.bottom-nav .nav-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-nav') === activeTab);
    });
  }

  window.goMgr = function (name) {
    $all('.mgr-screen').forEach(function (s) {
      s.classList.toggle('active', s.getAttribute('data-mscreen') === name);
    });
    $all('.mgr-nav-item').forEach(function (n) {
      n.classList.toggle('on', n.getAttribute('data-mnav') === name);
    });
    const title = $('#mgr-title');
    const titles = {
      'm-portfolio': 'Portfolio',
      'm-residents': 'Residents & owners',
      'm-accounts': 'Accounts · source ledger',
      'm-exceptions': 'Exception queue',
      'm-maintenance': 'Maintenance',
      'm-community': 'Community',
      'm-move': 'Move-in / move-out',
      'm-admin': 'Administration'
    };
    if (title) title.textContent = titles[name] || 'Manager';
    currentManager = name;
    if (role !== 'manager') setRole('manager');
    try { history.replaceState(null, '', '#mgr/' + name); } catch (e) {}
  };

  window.switchAccount = function (id) {
    activeAccount = id;
    $all('.acct-chip').forEach(function (c) {
      c.classList.toggle('on', c.getAttribute('data-acct') === id);
    });
    $all('[data-acct-panel]').forEach(function (p) {
      p.classList.toggle('hide', p.getAttribute('data-acct-panel') !== id);
    });
    toast(id === 'cedar' ? 'Cedar Grove Condos · Unit 204 (HOA)' : 'South Lamar Flats · Apt 3B (rent)');
  };

  window.openPaySheet = function () {
    $('#pay-overlay').classList.add('open');
    $('#pay-sheet').classList.add('open');
  };
  window.closePaySheet = function () {
    $('#pay-overlay').classList.remove('open');
    $('#pay-sheet').classList.remove('open');
  };
  window.submitPay = function () {
    closePaySheet();
    toast('Payment initiated · waiting on processor');
    go('r-payment-state');
  };

  window.segBills = function (mode) {
    $all('#bill-seg button').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-seg') === mode);
    });
    $all('[data-bill-panel]').forEach(function (p) {
      p.classList.toggle('hide', p.getAttribute('data-bill-panel') !== mode);
    });
  };

  window.togglePhoto = function (el) {
    el.classList.toggle('filled');
  };

  window.submitMaint = function () {
    toast('Request submitted · pending triage');
    go('r-maint-status');
  };

  window.reserveAmenity = function (name) {
    toast('Reserved · ' + name);
    go('r-amenities');
  };

  window.cancelAmenity = function () {
    toast('Reservation canceled · capacity released');
  };

  window.submitArch = function () {
    toast('Architectural request submitted');
    go('r-arch-history');
  };

  window.toggleCheck = function (el) {
    const item = el.closest('.checklist-item');
    if (item && item.classList.contains('blocked') && el.checked) {
      el.checked = false;
      toast('Cannot close — unsettled balance remains');
      return;
    }
  };

  window.mgrAction = function (msg) {
    toast(msg);
  };

  window.openMgrModal = function (id) {
    const m = $('#' + id);
    if (m) m.classList.add('open');
  };
  window.closeMgrModal = function (id) {
    const m = $('#' + id);
    if (m) m.classList.remove('open');
  };

  window.toast = function (msg) {
    var t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(window.__toastTimer);
    window.__toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  };

  window.toggleAudience = function (btn) {
    if (btn.classList.contains('locked')) {
      toast('Not in mandate · cannot target this audience');
      return;
    }
    btn.classList.toggle('on');
  };

  function bootFromHash() {
    var h = (location.hash || '').replace(/^#/, '');
    if (h.indexOf('mgr/') === 0) {
      setRole('manager');
      goMgr(h.slice(4) || 'm-portfolio');
    } else if (h.indexOf('m-') === 0) {
      setRole('manager');
      goMgr(h);
    } else if (h) {
      setRole('resident');
      go(h);
    } else {
      setRole('resident');
      go('r-community');
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closePaySheet();
      $all('.mgr-modal-overlay.open').forEach(function (m) { m.classList.remove('open'); });
    }
  });

  bootFromHash();
})();

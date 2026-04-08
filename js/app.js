document.addEventListener('DOMContentLoaded', () => {
    const STAND_BOT_CONFIG = {
        BIN_ID: '68b4029243b1c97be931d983',
        API_KEY: '$2a$10$OWB0wBTxocZeAjW4yY5pyOQwnVSUr5a3bovRM9LZM5NJI8zpiT3eS',
    };
    const LINK_TRACKER_CONFIG = {
        API_KEY: "$2a$10$KXx5Yb2HF6z292WnEjQcY.P/WggIJ9sbwMXyhT9UmzFPtlyavGGlK",
        BIN_ID: "6877dbaf3052b733d10d94bc",
        DOMAIN: "https://modelmschief.github.io/404_check/",
    };

    const views = { standBot: document.getElementById('stand-bot-view'), linkTracker: document.getElementById('link-tracker-view') };
    const nav = { standBot: document.querySelectorAll('.stand-bot-nav'), mobileStandBot: document.querySelectorAll('.mobile-stand-bot-nav'), userDisplay: document.getElementById('user-display'), logoutButton: document.getElementById('logout-button') };
    const viewBtns = { home: document.getElementById('home-view-btn'), tracker: document.getElementById('tracker-view-btn'), mobileTracker: document.getElementById('mobile-tracker-view-btn'), trackerCard: document.getElementById('tracker-feature-card'), ctaTrackLink: document.getElementById('ctaTrackLink') };
    const login = { section: document.getElementById('login-section'), button: document.getElementById('login-button'), input: document.getElementById('user-id'), error: document.getElementById('login-error') };
    const dashboard = { section: document.getElementById('dashboard-section'), createBtn: document.getElementById('create-link-button'), linkInput: document.getElementById('original-link'), newLinkDisplay: document.getElementById('new-link-display'), newLinkInput: document.getElementById('new-short-link') };
    const mobileMenu = { menu: document.getElementById('mobile-menu'), panel: document.querySelector('#mobile-menu > div'), openBtn: document.getElementById('mobile-menu-button'), closeBtn: document.getElementById('close-mobile-menu') };
    const modal = { container: document.getElementById('confirmation-modal'), confirmBtn: document.getElementById('confirm-delete-btn'), cancelBtn: document.getElementById('cancel-delete-btn') };
    const spinner = document.getElementById('loading-spinner');
    let clicksChart = null;
    let currentUserId = null;
    let linkToDelete = null;

    const themeToggle = document.getElementById('themeToggle');
    const sunIcon = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>`;
    const moonIcon = `<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>`;

    // Default to Dark Mode if not specified
    const isDark = localStorage.getItem('theme') !== 'light';
    if (isDark) {
        document.documentElement.classList.add('dark');
        if(themeToggle) themeToggle.innerHTML = sunIcon;
    } else {
        if(themeToggle) themeToggle.innerHTML = moonIcon;
    }

    if(themeToggle) {
        themeToggle.addEventListener('click', () => {
            const isDarkNow = document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
            themeToggle.innerHTML = isDarkNow ? sunIcon : moonIcon;
        });
    }

    function openMenu() {
        mobileMenu.menu.classList.add('active');
        // mobileMenu.menu.classList.remove('hidden');
        // setTimeout(() => mobileMenu.panel.classList.remove('translate-x-full'), 10);
    }
    function closeMenu() {
        mobileMenu.menu.classList.remove('active');
        // mobileMenu.panel.classList.add('translate-x-full');
        // setTimeout(() => mobileMenu.menu.classList.add('hidden'), 300);
    }

    if(mobileMenu.openBtn) mobileMenu.openBtn.addEventListener('click', openMenu);
    if(mobileMenu.closeBtn) mobileMenu.closeBtn.addEventListener('click', closeMenu);
    if(mobileMenu.menu) mobileMenu.menu.addEventListener('click', (e) => { if (e.target === mobileMenu.menu) closeMenu(); });

    function switchView(viewName) {
        if (!views[viewName]) return;
        Object.values(views).forEach(v => { if(v) v.classList.remove('active'); });
        views[viewName].classList.add('active');

        localStorage.setItem('activeView', viewName);
        const isTracker = viewName === 'linkTracker';

        [...nav.standBot, ...nav.mobileStandBot].forEach(el => el.style.display = isTracker ? 'none' : 'block');
        if(nav.userDisplay) nav.userDisplay.classList.toggle('hidden', !isTracker || !currentUserId);
        if(nav.logoutButton) nav.logoutButton.classList.toggle('hidden', !isTracker || !currentUserId);

        closeMenu();
    }

    async function fetchData(config) {
        const res = await fetch(`https://api.jsonbin.io/v3/b/${config.BIN_ID}/latest`, { headers: { 'X-Master-Key': config.API_KEY } });
        if (!res.ok) throw new Error('Could not fetch data.');
        return (await res.json()).record || {};
    }

    async function updateData(config, newData) {
        await fetch(`https://api.jsonbin.io/v3/b/${config.BIN_ID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'X-Master-Key': config.API_KEY },
            body: JSON.stringify(newData)
        });
    }

    // --- FIXED: ROBUST PROMOTER BOT ANALYTICS LOGGER ---
    async function logPromoterBotEvent(eventName) {
            if (STAND_BOT_CONFIG.BIN_ID.includes('YOUR_') || STAND_BOT_CONFIG.API_KEY.includes('YOUR_')) {
            console.warn('Promoter Bot JSONBin ID/API Key not configured. Logging is disabled.');
            return;
        }
        const payload = { ts: new Date().toISOString(), event: eventName, ua: navigator.userAgent };
        try {
            const getResponse = await fetch(`https://api.jsonbin.io/v3/b/${STAND_BOT_CONFIG.BIN_ID}/latest`, {
                headers: { 'X-Master-Key': STAND_BOT_CONFIG.API_KEY }
            });
            let currentData = { events: [] };
            if (getResponse.ok) {
                const latestRecord = await getResponse.json();
                if (latestRecord.record && Array.isArray(latestRecord.record.events)) {
                    currentData = latestRecord.record;
                }
            } else if (getResponse.status !== 404) {
                console.warn(`JSONBin (Promoter): Failed to GET latest bin. Status: ${getResponse.status}`);
            }
            currentData.events.push(payload);
            await updateData(STAND_BOT_CONFIG, currentData);
        } catch (error) {
            console.warn('Promoter Bot logging failed:', error);
        }
    }

    // --- LINK TRACKER LOGIC ---
    function showSpinner(show) {
        if(spinner) spinner.classList.toggle('hidden', !show);
    }

    async function loginUser(userId) {
        showSpinner(true);
        login.error.textContent = '';
        try {
            localStorage.setItem('loggedInUserId', userId);
            currentUserId = userId;
            await refreshDashboard();
        } catch (e) {
            login.error.textContent = `Error: ${e.message}`;
        } finally {
            showSpinner(false);
        }
    }

    async function refreshDashboard() {
            if (!currentUserId) return;
            showSpinner(true);
            try {
            const allData = await fetchData(LINK_TRACKER_CONFIG);
            displayDashboard(currentUserId, allData);
            } catch(e) {
            alert('Could not refresh data.');
            } finally {
            showSpinner(false);
            }
    }

    function displayDashboard(userId, allData) {
        if(nav.userDisplay) nav.userDisplay.textContent = `User: ${userId}`;
        if(nav.userDisplay) nav.userDisplay.classList.remove('hidden');
        if(nav.logoutButton) nav.logoutButton.classList.remove('hidden');
        if(login.section) login.section.classList.add('hidden');
        if(dashboard.section) dashboard.section.classList.remove('hidden');

        const userLinks = Object.entries(allData).filter(([_, v]) => v && v.owner_id === userId).map(([k, v]) => ({ short_code: k, ...v }));
        renderStats(userLinks);
        renderChart(userLinks);
        renderTable(userLinks);
    }

    function renderStats(links) {
        const totalLinksEl = document.getElementById('total-links');
        const totalClicksEl = document.getElementById('total-clicks');
        if(totalLinksEl) totalLinksEl.textContent = links.length;
        if(totalClicksEl) totalClicksEl.textContent = links.reduce((s, l) => s + (l.clicks || 0), 0);
    }

    function renderChart(links) {
        const chartCanvas = document.getElementById('clicks-chart');
        if (!chartCanvas) return;

        const sorted = [...links].sort((a, b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 5);
        const ctx = chartCanvas.getContext('2d');
        if(clicksChart) clicksChart.destroy();
        clicksChart = new Chart(ctx, { type: 'bar', data: { labels: sorted.map(l => l.short_code), datasets: [{ label: 'Clicks', data: sorted.map(l => l.clicks || 0), backgroundColor: 'rgba(99, 102, 241, 0.6)' }] }, options: { indexAxis: 'y' } });
    }

    function renderTable(links) {
        const tableBody = document.getElementById('links-table-body');
        if(!tableBody) return;

        const trashIcon = `<svg class="w-4 h-4" style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`;
        tableBody.innerHTML = links.length === 0 ? `<tr><td colspan="5" class="text-center py-8 text-muted">No links created yet.</td></tr>` : links.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(link => {
            const shortUrl = `${LINK_TRACKER_CONFIG.DOMAIN}${link.short_code}`;
            return `<tr>
                        <td><a href="${shortUrl}" target="_blank" class="text-primary font-medium">${shortUrl}</a></td>
                        <td class="max-w-xs truncate" style="max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${link.original_link}</td>
                        <td class="font-bold">${link.clicks || 0}</td>
                        <td class="text-sm">${new Date(link.created_at).toLocaleDateString()}</td>
                        <td><button class="delete-btn btn-icon text-danger" data-short-code="${link.short_code}">${trashIcon}</button></td>
                    </tr>`;
        }).join('');
    }

    async function createNewLink() {
        if(!dashboard.linkInput) return;
        const originalLink = dashboard.linkInput.value.trim();
        if (!originalLink || !currentUserId) return alert('Please enter a valid URL.');
        showSpinner(true);
        try {
            const allData = await fetchData(LINK_TRACKER_CONFIG);
            const shortCode = Math.random().toString(36).substring(2, 8);
            allData[shortCode] = { original_link: originalLink, owner_id: currentUserId, created_at: new Date().toISOString(), clicks: 0 };
            await updateData(LINK_TRACKER_CONFIG, allData);
            dashboard.linkInput.value = '';
            if(dashboard.newLinkInput) dashboard.newLinkInput.value = `${LINK_TRACKER_CONFIG.DOMAIN}${shortCode}`;
            if(dashboard.newLinkDisplay) dashboard.newLinkDisplay.classList.remove('hidden');
            await refreshDashboard();
        } catch(e) { alert(`Error: ${e.message}`); }
        finally { showSpinner(false); }
    }

    function showDeleteModal(shortCode) {
        linkToDelete = shortCode;
        if(modal.container) {
             modal.container.classList.remove('hidden');
             modal.container.classList.add('active'); // Added for CSS transition
        }
    }
    function hideDeleteModal() {
        linkToDelete = null;
        if(modal.container) {
            modal.container.classList.add('hidden');
            modal.container.classList.remove('active');
        }
    }

    async function deleteLink() {
        if (!linkToDelete) return;
        hideDeleteModal();
        showSpinner(true);
        try {
            const allData = await fetchData(LINK_TRACKER_CONFIG);
            if (allData[linkToDelete]) {
                delete allData[linkToDelete];
                await updateData(LINK_TRACKER_CONFIG, allData);
            }
            await refreshDashboard();
        } catch (e) {
            alert(`Error deleting link: ${e.message}`);
        } finally {
            showSpinner(false);
        }
    }

    function logoutUser() {
        localStorage.removeItem('loggedInUserId');
        currentUserId = null;
        if(dashboard.section) dashboard.section.classList.add('hidden');
        if(login.section) login.section.classList.remove('hidden');
        if(nav.userDisplay) nav.userDisplay.classList.add('hidden');
        if(nav.logoutButton) nav.logoutButton.classList.add('hidden');
        if(login.input) login.input.value = '';
    }

    // --- EVENT LISTENERS ---
    logPromoterBotEvent('visit');
    const btnStart = document.getElementById('ctaStart');
    if(btnStart) btnStart.addEventListener('click', () => logPromoterBotEvent('click_start'));
    const btnClone = document.getElementById('ctaClone');
    if(btnClone) btnClone.addEventListener('click', () => logPromoterBotEvent('click_clone'));
    const btnGroup = document.getElementById('ctaGroup');
    if(btnGroup) btnGroup.addEventListener('click', () => logPromoterBotEvent('click_add_group'));
    const btnPremium = document.getElementById('ctaPremium');
    if(btnPremium) btnPremium.addEventListener('click', () => logPromoterBotEvent('click_premium_support'));

    if(viewBtns.home) viewBtns.home.addEventListener('click', () => switchView('standBot'));
    if(viewBtns.tracker) viewBtns.tracker.addEventListener('click', () => switchView('linkTracker'));
    if(viewBtns.mobileTracker) viewBtns.mobileTracker.addEventListener('click', () => switchView('linkTracker'));
    if(viewBtns.trackerCard) viewBtns.trackerCard.addEventListener('click', () => switchView('linkTracker'));
    if(viewBtns.ctaTrackLink) viewBtns.ctaTrackLink.addEventListener('click', () => switchView('linkTracker'));

    if(login.button) login.button.addEventListener('click', () => { if (login.input.value.trim()) loginUser(login.input.value.trim()); });
    if(dashboard.createBtn) dashboard.createBtn.addEventListener('click', createNewLink);
    if(nav.logoutButton) nav.logoutButton.addEventListener('click', logoutUser);

    const tableBody = document.getElementById('links-table-body');
    if(tableBody) {
        tableBody.addEventListener('click', (e) => {
            const button = e.target.closest('.delete-btn');
            if (button) showDeleteModal(button.dataset.shortCode);
        });
    }

    if(modal.confirmBtn) modal.confirmBtn.addEventListener('click', deleteLink);
    if(modal.cancelBtn) modal.cancelBtn.addEventListener('click', hideDeleteModal);

    const savedView = localStorage.getItem('activeView') || 'standBot';
    const savedUserId = localStorage.getItem('loggedInUserId');

    // If the elements don't exist (e.g. on terms page), don't try to switch view
    if (views.standBot && views.linkTracker) {
        switchView(savedView);
        if (savedView === 'linkTracker' && savedUserId) {
            if(login.input) login.input.value = savedUserId;
            loginUser(savedUserId);
        }
    }
});

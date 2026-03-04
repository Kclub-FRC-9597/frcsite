async function renderSeasonsLayout(hash) {
    const seasonPath = hash.replace('#seasons', '') || '/2026';
    const app = document.getElementById('app');

    const header = await loadHeader();
    const footer = await loadFooter();
    const content = await renderSeasonContent(seasonPath);

    const logoutBtn = isAdmin() ? '<li><a href="#" onclick="logout()">登出</a></li>' : '';

    app.innerHTML = renderSeasonsLayoutTemplate({
        header,
        footer,
        seasonPath,
        content,
        logoutBtn
    });
}

async function renderSeasonContent(path) {
    if (path === '/2026') {
        return await renderSeason2026();
    } else if (path === '/2025') {
        return await renderSeason2025();
    } else if (path === '/2024') {
        return await renderSeason2024();
    }
    return await renderSeason2026();
}

async function renderSeason2026() {
    const sponsorsHtml = await renderSponsorsSection(2026);
    return renderSeason2026Template(sponsorsHtml);
}

async function renderSeason2025() {
    const sponsorsHtml = await renderSponsorsSection(2025);
    return renderSeason2025Template(sponsorsHtml);
}

async function renderSeason2024() {
    const sponsorsHtml = await renderSponsorsSection(2024);
    return renderSeason2024Template(sponsorsHtml);
}

window.renderSeasonsLayout = renderSeasonsLayout;
window.renderSeasonContent = renderSeasonContent;
window.renderSeason2026 = renderSeason2026;
window.renderSeason2025 = renderSeason2025;
window.renderSeason2024 = renderSeason2024;

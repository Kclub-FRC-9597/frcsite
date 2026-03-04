async function getSponsorsByYear(year) {
    try {
        const response = await apiFetch(`/api/sponsors?year=${year}`);
        if (!response.ok) throw new Error('Failed to fetch sponsors');
        return await response.json();
    } catch (err) {
        console.error('Error fetching sponsors:', err);
        return [];
    }
}

async function getAllSponsors() {
    try {
        const response = await apiFetch('/api/sponsors');
        if (!response.ok) throw new Error('Failed to fetch sponsors');
        return await response.json();
    } catch (err) {
        console.error('Error fetching all sponsors:', err);
        return [];
    }
}

function normalizeSponsorName(name) {
    return String(name || '').trim().toLowerCase();
}

async function getReusableSponsorsForYear(year) {
    const [allSponsors, currentSponsors] = await Promise.all([
        getAllSponsors(),
        getSponsorsByYear(year)
    ]);

    const currentNames = new Set(
        (currentSponsors || []).map(sponsor => normalizeSponsorName(sponsor.name)).filter(Boolean)
    );

    const uniqueByName = new Map();
    for (const sponsor of (allSponsors || [])) {
        const key = normalizeSponsorName(sponsor.name);
        if (!key) continue;

        const existing = uniqueByName.get(key);
        if (!existing || Number(sponsor.updated_at || 0) > Number(existing.updated_at || 0)) {
            uniqueByName.set(key, sponsor);
        }
    }

    return Array.from(uniqueByName.values())
        .filter(sponsor => !currentNames.has(normalizeSponsorName(sponsor.name)))
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN'));
}

async function addSponsor(year, name, logoUrl = null, website = null) {
    if (!isAdmin()) {
        alert('需要管理员权限');
        return false;
    }
    try {
        const response = await apiFetch('/api/sponsors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: Number(year), name, logo_url: logoUrl, website })
        });
        if (!response.ok) throw new Error('Failed to add sponsor');
        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Error adding sponsor:', err);
        alert('添加赞助商失败');
        return false;
    }
}

async function updateSponsor(id, year, name, logoUrl = null, website = null) {
    if (!isAdmin()) {
        alert('需要管理员权限');
        return false;
    }
    try {
        const response = await apiFetch(`/api/sponsors?id=${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ year: Number(year), name, logo_url: logoUrl, website })
        });
        if (!response.ok) throw new Error('Failed to update sponsor');
        return await response.json();
    } catch (err) {
        console.error('Error updating sponsor:', err);
        alert('更新赞助商失败');
        return false;
    }
}

async function deleteSponsor(id) {
    if (!isAdmin()) {
        alert('需要管理员权限');
        return false;
    }
    if (!confirm('确定要删除这个赞助商吗？')) return false;
    try {
        const response = await apiFetch(`/api/sponsors?id=${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to delete sponsor');
        return await response.json();
    } catch (err) {
        console.error('Error deleting sponsor:', err);
        alert('删除赞助商失败');
        return false;
    }
}

async function renderSponsorsSection(year) {
    const sponsors = await getSponsorsByYear(year);
    if (!sponsors || sponsors.length === 0) {
        return '<p class="sponsor-empty-text">暂无赞助商信息</p>';
    }

    let html = '<div class="sponsor-list">';
    for (const sponsor of sponsors) {
        if (sponsor.logo_url) {
            html += `<div class="sponsor-logo-item">
                <a href="${sponsor.website || '#'}" target="_blank" rel="noreferrer" class="sponsor-logo-link">
                    <img src="${sponsor.logo_url}" alt="${sponsor.name}" class="sponsor-logo-image">
                </a>
            </div>`;
        } else {
            if (sponsor.website) {
                html += `<div class="sponsor-name-chip">
                    <a href="${sponsor.website}" target="_blank" rel="noreferrer" class="sponsor-name-link">${sponsor.name}</a>
                </div>`;
            } else {
                html += `<div class="sponsor-name-chip">
                    <span class="sponsor-name-text">${sponsor.name}</span>
                </div>`;
            }
        }
    }
    html += '</div>';

    if (isAdmin()) {
        html += `<button onclick="showSponsorsManagement(${year})" class="sponsor-manage-btn">✏️ 编辑赞助商</button>`;
    }

    return html;
}

async function showSponsorsManagement(year) {
    if (!isAdmin()) {
        alert('需要管理员权限');
        return;
    }

    const sponsors = await getSponsorsByYear(year);
    const reusableSponsors = await getReusableSponsorsForYear(year);
    const app = document.getElementById('app');

    let sponsorRows = sponsors.map(s => `
        <div class="sponsor-row-card">
            <div class="sponsor-row-grid">
                <div>
                    <label class="sponsor-row-label">名称:</label>
                    <input type="text" value="${s.name}" id="sponsor_name_${s.id}" class="sponsor-row-input">
                </div>
                <div>
                    <label class="sponsor-row-label">Logo URL:</label>
                    <input type="text" value="${s.logo_url || ''}" id="sponsor_logo_${s.id}" class="sponsor-row-input">
                </div>
                <div>
                    <label class="sponsor-row-label">网站:</label>
                    <input type="text" value="${s.website || ''}" id="sponsor_website_${s.id}" class="sponsor-row-input">
                </div>
                <div class="sponsor-row-actions">
                    <button onclick="saveSponsorEdit('${s.id}', ${year})" class="sponsor-action-btn sponsor-action-save">💾</button>
                    <button onclick="deleteSponsorAndRefresh('${s.id}', ${year})" class="sponsor-action-btn sponsor-action-delete">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');

    if (sponsorRows === '') {
        sponsorRows = '<p class="sponsor-empty-text">暂无赞助商，点击下方"添加赞助商"创建</p>';
    }

    let reusableRows = reusableSponsors.map(s => `
        <div class="sponsor-row-card">
            <div class="sponsor-row-grid">
                <div>
                    <label class="sponsor-row-label">名称:</label>
                    <div class="sponsor-name-text">${s.name}</div>
                </div>
                <div>
                    <label class="sponsor-row-label">Logo URL:</label>
                    <div class="sponsor-name-text">${s.logo_url || '-'}</div>
                </div>
                <div>
                    <label class="sponsor-row-label">网站:</label>
                    <div class="sponsor-name-text">${s.website || '-'}</div>
                </div>
                <div class="sponsor-row-actions">
                    <button onclick="addExistingSponsorToYear(${year}, '${s.id}')" class="sponsor-action-btn sponsor-action-save">➕</button>
                </div>
            </div>
        </div>
    `).join('');

    if (reusableRows === '') {
        reusableRows = '<p class="sponsor-empty-text">暂无可复用赞助商</p>';
    }

    app.innerHTML = `
        ${await loadHeader()}
        <div class="content sponsor-manage-content">
            <h1>📝 ${year}赛季赞助商管理</h1>
            
            <div class="sponsor-manage-section sponsor-manage-list-section">
                <h3 class="sponsor-manage-title sponsor-manage-title-list">当前赞助商列表</h3>
                ${sponsorRows}
            </div>

            <div class="sponsor-manage-section sponsor-manage-list-section">
                <h3 class="sponsor-manage-title sponsor-manage-title-list">⚡ 从已有赞助商快速添加</h3>
                ${reusableRows}
            </div>

            <div class="sponsor-manage-section sponsor-manage-add-section">
                <h3 class="sponsor-manage-title sponsor-manage-title-add">➕ 添加新赞助商</h3>
                <div class="sponsor-add-grid">
                    <div>
                        <label class="sponsor-add-label">赞助商名称 *</label>
                        <input type="text" id="new_sponsor_name" placeholder="例如: SolidWorks" class="sponsor-add-input">
                    </div>
                    <div>
                        <label class="sponsor-add-label">Logo URL</label>
                        <input type="text" id="new_sponsor_logo" placeholder="https://..." class="sponsor-add-input">
                    </div>
                    <div>
                        <label class="sponsor-add-label">公司网站</label>
                        <input type="text" id="new_sponsor_website" placeholder="https://..." class="sponsor-add-input">
                    </div>
                    <div class="sponsor-add-action">
                        <button onclick="addNewSponsor(${year})" class="sponsor-add-btn">添加赞助商</button>
                    </div>
                </div>
            </div>

            <div class="sponsor-back-wrap">
                <button id="backToSeasonBtn" class="sponsor-back-btn">返回赛季页面</button>
            </div>
        </div>
        ${await loadFooter()}
    `;

    setTimeout(function() {
        const btn = document.getElementById('backToSeasonBtn');
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const targetHash = `#seasons/${year}`;
                window.location.hash = targetHash;
                setTimeout(() => {
                    renderApp();
                }, 50);
            });
            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                const targetHash = `#seasons/${year}`;
                window.location.hash = targetHash;
                setTimeout(() => {
                    renderApp();
                }, 50);
                return false;
            };
        }
    }, 100);
}

async function addExistingSponsorToYear(year, sourceId) {
    if (!isAdmin()) {
        alert('需要管理员权限');
        return;
    }

    const allSponsors = await getAllSponsors();
    const source = (allSponsors || []).find(sponsor => String(sponsor.id) === String(sourceId));
    if (!source) {
        alert('未找到可复用赞助商');
        return;
    }

    const currentSponsors = await getSponsorsByYear(year);
    const exists = (currentSponsors || []).some(
        sponsor => normalizeSponsorName(sponsor.name) === normalizeSponsorName(source.name)
    );
    if (exists) {
        alert('当前赛季已存在该赞助商');
        return;
    }

    const result = await addSponsor(year, source.name, source.logo_url || null, source.website || null);
    if (result && result.ok) {
        alert('添加成功');
        await showSponsorsManagement(year);
    }
}

async function saveSponsorEdit(id, year) {
    const name = document.getElementById(`sponsor_name_${id}`).value;
    const logo = document.getElementById(`sponsor_logo_${id}`).value;
    const website = document.getElementById(`sponsor_website_${id}`).value;

    if (!name.trim()) {
        alert('赞助商名称不能为空');
        return;
    }

    const result = await updateSponsor(id, year, name, logo || null, website || null);
    if (result && result.ok) {
        alert('更新成功');
        await showSponsorsManagement(year);
    }
}

async function deleteSponsorAndRefresh(id, year) {
    const result = await deleteSponsor(id);
    if (result && result.ok) {
        alert('删除成功');
        await showSponsorsManagement(year);
    }
}

async function addNewSponsor(year) {
    const name = document.getElementById('new_sponsor_name').value;
    const logo = document.getElementById('new_sponsor_logo').value;
    const website = document.getElementById('new_sponsor_website').value;

    if (!name.trim()) {
        alert('赞助商名称不能为空');
        return;
    }

    const result = await addSponsor(year, name, logo || null, website || null);
    if (result && result.ok) {
        alert('添加成功');
        await showSponsorsManagement(year);
    }
}

window.getSponsorsByYear = getSponsorsByYear;
window.addSponsor = addSponsor;
window.updateSponsor = updateSponsor;
window.deleteSponsor = deleteSponsor;
window.renderSponsorsSection = renderSponsorsSection;
window.showSponsorsManagement = showSponsorsManagement;
window.saveSponsorEdit = saveSponsorEdit;
window.deleteSponsorAndRefresh = deleteSponsorAndRefresh;
window.addNewSponsor = addNewSponsor;
window.addExistingSponsorToYear = addExistingSponsorToYear;

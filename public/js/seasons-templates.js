function renderSeasonsLayoutTemplate({ header, footer, seasonPath, content, logoutBtn }) {
    return `
        ${header}
        <div class="container">
            <div class="sidebar" id="seasonsSidebar">
                <h3>赛季</h3>
                <ul>
                    <li><a href="#seasons/2026" class="${seasonPath === '/2026' ? 'active' : ''}">🏆 2026 赛季</a></li>
                    <li><a href="#seasons/2025" class="${seasonPath === '/2025' ? 'active' : ''}">📊 2025 赛季</a></li>
                    <li><a href="#seasons/2024" class="${seasonPath === '/2024' ? 'active' : ''}">🎊 2024 新秀年</a></li>
                    <li class="sidebar-home-link"><a href="#home">返回主页</a></li>
                    ${logoutBtn}
                </ul>
            </div>
            <div class="content" id="seasonsContent">
                ${content}
            </div>
        </div>
        ${footer}
    `;
}

function renderSeason2026Template(sponsorsHtml) {
    return `
        <h1>🏆 2026 赛季</h1>
        <div class="season-status-active">⏳ 当前进行中</div>

        <div class="season-panel season-panel-center">
            <p class="season-panel-text-main">📋 2026赛季赛事数据收集中...</p>
            <p class="season-panel-text-sub">请关注团队近期的比赛表现</p>
        </div>

        <div class="season-highlight season-highlight-goal">
            <p class="season-highlight-title"><strong>📍 赛季目标：</strong></p>
            <ul class="season-highlight-list">
                <li>延续上赛季的优秀表现，力争更好的赛区排名</li>
                <li>积累更多比赛经验，提升团队技术实力</li>
                <li>争取获得更多奖项认可</li>
            </ul>
        </div>

        <div class="season-highlight season-highlight-sponsor">
            <p class="season-sponsor-title">🤝 2026赛季赞助商</p>
            <div class="season-sponsor-content">${sponsorsHtml}</div>
        </div>
    `;
}

function renderSeason2025Template(sponsorsHtml) {
    return `
        <h1>📊 2025 赛季</h1>
        <div class="season-status-muted">赛季已完成</div>

        <div class="season-panel">
            <table class="season-table">
                <tr class="season-table-head-blue">
                    <th>赛事</th>
                    <th>排名</th>
                    <th>成绩</th>
                    <th>奖项</th>
                    <th>联盟</th>
                </tr>
                <tr class="season-table-row-divider">
                    <td class="season-cell-primary">上海区域赛 (Shanghai Regional)</td>
                    <td>第 17 名</td>
                    <td>9-5-1</td>
                    <td class="season-cell-award-red">🥊 分区决赛队伍</td>
                    <td>第 5 联队（主帅 4613）</td>
                </tr>
                <tr>
                    <td class="season-cell-primary">迈阿密谷区域赛 (Miami Valley Regional)</td>
                    <td>第 11 名</td>
                    <td>7-5-0</td>
                    <td class="season-cell-muted">-</td>
                    <td>第 7 联队（担任主帅）</td>
                </tr>
            </table>
        </div>

        <div class="season-metrics-grid">
            <div class="season-metric-card season-metric-blue">
                <p class="season-metric-label season-metric-label-blue">总成绩</p>
                <p class="season-metric-value">16-10-1</p>
                <p class="season-metric-note">赛季战绩</p>
            </div>
            <div class="season-metric-card season-metric-purple">
                <p class="season-metric-label season-metric-label-purple">全球排名</p>
                <p class="season-metric-value">#398</p>
                <p class="season-metric-note">区域排名赛积分池</p>
            </div>
        </div>

        <div class="season-highlight season-highlight-warning">
            <p class="season-highlight-title"><strong>📊 关键数据：</strong></p>
            <ul class="season-highlight-list">
                <li>上海赛事：39 区域排名赛积分（14 资格赛 + 5 联队 + 20 淘汰赛）</li>
                <li>迈阿密赛事：26 区域排名赛积分（16 资格赛 + 10 联队）</li>
            </ul>
        </div>

        <div class="season-highlight season-highlight-sponsor">
            <p class="season-sponsor-title">🤝 2025赛季赞助商</p>
            <div class="season-sponsor-content">${sponsorsHtml}</div>
        </div>
    `;
}

function renderSeason2024Template(sponsorsHtml) {
    return `
        <h1>🎊 2024 赛季（新秀年）</h1>
        <div class="season-status-muted">团队第一个赛季</div>

        <div class="season-panel">
            <table class="season-table">
                <tr class="season-table-head-purple">
                    <th>赛事</th>
                    <th>排名</th>
                    <th>成绩</th>
                    <th>奖项</th>
                    <th>联盟</th>
                </tr>
                <tr class="season-table-row-divider">
                    <td class="season-cell-primary">七叶树区域赛 (Buckeye Regional)</td>
                    <td>第 9 名</td>
                    <td>9-4-0</td>
                    <td class="season-cell-award-green">🌟 新秀灵感奖</td>
                    <td>第 6 联队（选秀 2252, 5667）</td>
                </tr>
                <tr>
                    <td class="season-cell-primary">迈阿密谷区域赛 (Miami Valley Regional)</td>
                    <td>第 29 名</td>
                    <td>5-8-2</td>
                    <td class="season-cell-award-green">🌟 新秀灵感奖</td>
                    <td>第 4 联队（主帅 5811）</td>
                </tr>
            </table>
        </div>

        <div class="season-metrics-grid">
            <div class="season-metric-card season-metric-green">
                <p class="season-metric-label season-metric-label-purple">总成绩</p>
                <p class="season-metric-value">14-12-2</p>
                <p class="season-metric-note">赛季战绩（首赛季）</p>
            </div>
            <div class="season-metric-card season-metric-cyan">
                <p class="season-metric-label season-metric-label-cyan">主要奖项</p>
                <p class="season-metric-value">2 个</p>
                <p class="season-metric-note">连获新秀灵感奖</p>
            </div>
        </div>

        <div class="season-highlight season-highlight-warning">
            <p class="season-highlight-title"><strong>📊 关键成就：</strong></p>
            <ul class="season-highlight-list">
                <li>🌟 两场地区赛均获得新秀灵感奖（Rookie Inspiration Award）</li>
                <li>🎯 七叶树区域赛排名第 9，创造新秀年最佳排名</li>
                <li>🤝 成功与多支优质队伍建立联队合作关系</li>
                <li>🎨 机器人代号：321 Krish endo</li>
            </ul>
        </div>

        <div class="season-highlight season-highlight-sponsor">
            <p class="season-sponsor-title">🤝 2024赛季赞助商</p>
            <div class="season-sponsor-content">${sponsorsHtml}</div>
        </div>
    `;
}

window.renderSeasonsLayoutTemplate = renderSeasonsLayoutTemplate;
window.renderSeason2026Template = renderSeason2026Template;
window.renderSeason2025Template = renderSeason2025Template;
window.renderSeason2024Template = renderSeason2024Template;

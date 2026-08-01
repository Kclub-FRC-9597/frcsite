// home.js — 主页内容数据和渲染
(function () {

window.DEFAULT_HOMEPAGE_CONTENT = {
    aboutUs: {
        p1: '<strong>Luban Robotics（鲁班机器人）</strong>是一支隶属于 K CLUB 的年轻而富有朝气的 FRC 竞技机器人团队。我们以中国古代伟大工匠鲁班命名，以教育为核心使命，通过机器人竞赛这个平台，致力于激发学生的兴趣、提升学生的能力。',
        p2: '我们的核心理念是：<strong class="home-inline-accent">基于兴趣，依托赛事，提升能力</strong>。自2024年成立以来，我们在学生的科学探索、工程实践和团队协作中，秉承精益求精的工匠精神，打造每一辆竞赛机器人。通过 FIRST Robotics Competition（国际机器人竞赛）的舞台，我们帮助学生在创新、协作和坚持中学会解决真实世界的问题。',
        p3: '我们相信，<strong class="home-inline-accent">教育的价值超越赛场</strong>。无论在成败得失的淬炼中，还是在技术突破的欣喜中，我们都致力于培养学生对科学和工程的热情，铸造他们的领导力、责任感和创新思维，成为未来的技术引领者。'
    },
    features: [
        { icon: '🔧', title: '技术创新', color: '#667eea', description: '融合机械设计、电子工程、编程开发等多学科知识，打造高性能竞赛机器人' },
        { icon: '👥', title: '团队协作', color: '#764ba2', description: '培养学生的沟通能力、领导力和团队精神，共同应对挑战，共同成长进步' },
        { icon: '🏆', title: '竞赛精神', color: '#667eea', description: '参加 FIRST Robotics Competition，与全球优秀团队切磋交流，追求卓越表现' },
        { icon: '📚', title: '教育赋能', color: '#764ba2', description: '基于兴趣、依托赛事、提升能力，激发学生的科学热情，铸造领导力和创新思维' }
    ],
    tools: {
        description: '为了更好地进行赛事数据分析和战略规划，我们开发了专业的 Scouting 系统：',
        items: [
            { icon: '📋', name: 'PreScouting', color: '#667eea', description: '赛前数据收集与团队评估' },
            { icon: '📊', name: 'Scouting', color: '#764ba2', description: '现场实时数据记录与分析' },
            { icon: '📈', name: 'Analysis', color: '#667eea', description: '数据可视化与战略决策支持' }
        ]
    }
};

window.getHomePageContent = function () {
    var saved = localStorage.getItem('homepage_content');
    if (saved) return JSON.parse(saved);
    localStorage.setItem('homepage_content', JSON.stringify(window.DEFAULT_HOMEPAGE_CONTENT));
    return JSON.parse(JSON.stringify(window.DEFAULT_HOMEPAGE_CONTENT));
};

window.saveHomePageContent = function (content) {
    localStorage.setItem('homepage_content', JSON.stringify(content));
};

window.renderHome = async function () {
    var app = document.getElementById('app');
    var header = await window.loadHeader();
    var footer = await window.loadFooter();
    var content = window.getHomePageContent();

    var featuresHtml = content.features.map(function (feature) {
        return '<div class="home-feature-card">' +
            '<h3 class="home-feature-title">' + feature.icon + ' ' + feature.title + '</h3>' +
            '<p class="home-feature-desc">' + feature.description + '</p>' +
            '</div>';
    }).join('');

    // 赛事（Scouting 工具）为登录后功能，未登录默认不显示入口
    var isLoggedIn = !!window.currentUser;
    var toolsHeroBtn = isLoggedIn ? '<a href="#tools/prescouting" class="hero-btn-secondary">🔧 进入 Scouting 工具</a>' : '';
    var toolsSection = isLoggedIn
        ? '<h2 class="home-section-title anim-fade-in-up">Scouting 工具</h2>' +
          '<p style="color: var(--text-muted); margin-bottom: 8px; font-size: 0.95em;" class="anim-fade-in-up anim-delay-1">为了更好地进行赛事数据分析和战略规划，我们开发了专业的 Scouting 系统：</p>' +
          '<div class="home-tools-grid anim-fade-in-up anim-delay-2">' +
          '<div class="home-tool-card"><span class="tool-icon">📋</span><h4>PreScouting</h4><p>赛前数据收集与团队评估</p><a href="#tools/prescouting" class="tool-link">开始使用</a></div>' +
          '<div class="home-tool-card"><span class="tool-icon">📊</span><h4>Scouting</h4><p>现场实时数据记录与分析</p><a href="#tools/scouting" class="tool-link">开始使用</a></div>' +
          '<div class="home-tool-card"><span class="tool-icon">📈</span><h4>Analysis</h4><p>数据可视化与战略决策支持</p><a href="#tools/analysis" class="tool-link">查看数据</a></div>' +
          '</div>'
        : '';

    app.innerHTML =
        header +
        '<div class="content home-content">' +
        '<div class="home-hero">' +
        '<h1 class="anim-fade-in-up"><strong>Luban Robotics</strong> #FRC9597</h1>' +
        '<div class="hero-actions anim-fade-in-up anim-delay-2">' +
        '<a href="#seasons/2026" class="hero-btn-primary">🏆 查看赛季</a>' +
        toolsHeroBtn +
        '</div></div>' +
        '<div class="home-about-grid anim-fade-in-up anim-delay-1"><div>' +
        '<p class="home-about-text home-about-text-gap">' + content.aboutUs.p1 + '</p>' +
        '<p class="home-about-text home-about-text-gap">' + content.aboutUs.p2 + '</p>' +
        '<div class="home-quote"><p class="home-about-text">' + content.aboutUs.p3 + '</p></div>' +
        '</div>' +
        '<div class="home-stats">' +
        '<div class="home-stat-card anim-scale-in anim-delay-1"><span class="stat-icon">🏆</span><div class="stat-info"><div class="stat-number">3</div><div class="stat-label">参赛赛季</div></div></div>' +
        '<div class="home-stat-card anim-scale-in anim-delay-2"><span class="stat-icon">👥</span><div class="stat-info"><div class="stat-number">20+</div><div class="stat-label">团队成员</div></div></div>' +
        '<div class="home-stat-card anim-scale-in anim-delay-3"><span class="stat-icon">🤖</span><div class="stat-info"><div class="stat-number">4</div><div class="stat-label">机器人迭代</div></div></div>' +
        '</div></div>' +
        '<h2 class="home-section-title anim-fade-in-up">核心理念</h2>' +
        '<div class="home-features-grid anim-fade-in-up anim-delay-1">' + featuresHtml + '</div>' +
        toolsSection +
        '</div>' +
        footer;

    var cards = app.querySelectorAll('.home-feature-card');
    cards.forEach(function (card, index) {
        var color = content.features[index] ? content.features[index].color : '#667eea';
        card.style.setProperty('--feature-color', color);
    });
};

})();

/**
 * 鲁班锁页面 — 展示各种鲁班锁的种类和解法说明
 */
function renderLubanLock() {
    const app = document.getElementById('app');

    const locks = [
        { name: '六子联芳', desc: '经典六根鲁班锁，结构对称，是最基础的入门款式。', difficulty: '⭐', image: '🔲' },
        { name: '孔明锁', desc: '相传由诸葛亮发明，利用榫卯结构实现无需钉子的牢固连接。', difficulty: '⭐⭐', image: '🔳' },
        { name: '十二姐妹', desc: '由十二根木条组成，结构复杂，需要缜密的空间思维能力。', difficulty: '⭐⭐⭐', image: '🧩' },
        { name: '八角球', desc: '外形呈八边形球体，内部结构精巧，拆解容易复原困难。', difficulty: '⭐⭐⭐', image: '⚙️' },
        { name: '笼中取物', desc: '核心玩法是在不破坏结构的情况下取出笼中物体，考验观察力。', difficulty: '⭐⭐⭐⭐', image: '🔐' },
        { name: '心锁', desc: '爱心造型的鲁班锁，兼具美观与挑战性，适合作为礼品。', difficulty: '⭐⭐', image: '❤️' },
        { name: '四方锁', desc: '四根主梁交错组成，结构简明但解法巧妙，适合初学者进阶。', difficulty: '⭐', image: '📦' },
        { name: '连环套', desc: '多环相扣的结构，每一步拆解都需要特定的顺序和角度。', difficulty: '⭐⭐⭐⭐', image: '⛓️' },
        { name: '两面针', desc: '两面不对称设计，增加了拼装难度，考验空间想象力。', difficulty: '⭐⭐⭐', image: '📍' }
    ];

    const cardsHtml = locks.map((lock, i) => `
        <div class="lock-card anim-fade-in-up anim-delay-${Math.min(i + 1, 4)}">
            <div class="lock-image">${lock.image}</div>
            <h3 class="lock-name">${lock.name}</h3>
            <div class="lock-difficulty">${lock.difficulty}</div>
            <p class="lock-desc">${lock.desc}</p>
        </div>
    `).join('');

    // Use cached header/footer if loadHeader/loadFooter is defined globally
    const render = async () => {
        const header = typeof loadHeader === 'function' ? await loadHeader() : '';
        const footer = typeof loadFooter === 'function' ? await loadFooter() : '';

        app.innerHTML = `
            ${header}
            <div class="content home-content">
                <div class="lock-hero">
                    <h1 class="anim-fade-in-up">🧩 鲁班锁</h1>
                    <p class="lock-hero-sub anim-fade-in-up anim-delay-1">
                        鲁班锁，又称孔明锁、八卦锁，是一种古老的中国益智玩具。<br>
                        无需钉子绳索，仅靠榫卯结构就能将木条紧密连接——<br>
                        正如 Luban Robotics 所秉承的工匠智慧。
                    </p>
                </div>

                <div class="lock-grid">
                    ${cardsHtml}
                </div>
            </div>
            ${footer}
        `;
    };

    render();
}

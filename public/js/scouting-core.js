// scouting-core.js — Scouting 模块（配置、表单、数据、模板）
(function () {

window.renderScouting = function () {
    return '<h1>Scouting</h1>' +
        '<div class="scouting-toolbar">' +
        '<button onclick="showScoutingConfig()">配置字段</button>' +
        '<button onclick="showScoutingForm()">开始收集数据</button>' +
        '<button onclick="showScoutingData()">查看数据</button>' +
        '</div><div id="scouting-content"><p>点击上方按钮开始配置或收集数据。</p></div>';
};

window.getFieldTypeText = function (type) {
    var types = { text: '文本', number: '数字', radio: '单选', checkbox: '多选' };
    return types[type] || type;
};

window.getScoutingConfig = function () {
    var SCOUTING_VERSION = 3;
    var defaultTemplate = window.getDefaultTemplate();
    var saved = localStorage.getItem('scouting_config');
    var savedVersion = parseInt(localStorage.getItem('scouting_config_version') || '0');
    if (!saved || savedVersion !== SCOUTING_VERSION) {
        var nc = { fields: defaultTemplate.fields };
        window.saveScoutingConfig(nc);
        localStorage.setItem('scouting_config_version', SCOUTING_VERSION.toString());
        return nc;
    }
    var config = JSON.parse(saved);
    var existingIds = {};
    config.fields.forEach(function (f) { existingIds[f.id] = true; });
    var newFields = defaultTemplate.fields.filter(function (f) { return !existingIds[f.id]; });
    if (newFields.length > 0) { config.fields = config.fields.concat(newFields); window.saveScoutingConfig(config); }
    return config;
};

window.getDefaultTemplate = function () {
    return {
        name: '默认比赛模板',
        fields: [
            { id: 'team', label: '赛队队号', type: 'text', required: true },
            { id: 'stage', label: '阶段', type: 'radio', required: true, options: ['排位', '淘汰', '练习赛'] },
            { id: 'auto_tasks', label: '自动阶段任务', type: 'checkbox', required: false, options: ['shooting', 'feeding', '干扰', '离开起始线', '挂车'] },
            { id: 'auto_efficiency', label: '自动阶段效率', type: 'radio', required: false, options: ['低', '中', '高'] },
            { id: 'teleop_switch_tasks', label: '过度切换任务', type: 'checkbox', required: false, options: ['shooting', 'feeding', '干扰', '瞎逛', '挂车'] },
            { id: 'teleop_switch_efficiency', label: '过度切换效率', type: 'radio', required: false, options: ['低', '中', '高'] },
            { id: 'shift1_furnace', label: 'Shift 1 熔炉状态', type: 'radio', required: false, options: ['开', '关'] },
            { id: 'shift1_tasks', label: 'Shift 1任务', type: 'checkbox', required: false, options: ['shooting', 'feeding', '干扰', '瞎逛', '挂车'] },
            { id: 'shift1_efficiency', label: 'Shift 1效率', type: 'radio', required: false, options: ['低', '中', '高'] },
            { id: 'shift2_furnace', label: 'Shift 2 熔炉状态', type: 'radio', required: false, options: ['开', '关'] },
            { id: 'shift2_tasks', label: 'Shift 2任务', type: 'checkbox', required: false, options: ['shooting', 'feeding', '干扰', '瞎逛', '挂车'] },
            { id: 'shift2_efficiency', label: 'Shift 2效率', type: 'radio', required: false, options: ['低', '中', '高'] },
            { id: 'shift3_furnace', label: 'Shift 3 熔炉状态', type: 'radio', required: false, options: ['开', '关'] },
            { id: 'shift3_tasks', label: 'Shift 3任务', type: 'checkbox', required: false, options: ['shooting', 'feeding', '干扰', '瞎逛', '挂车'] },
            { id: 'shift3_efficiency', label: 'Shift 3效率', type: 'radio', required: false, options: ['低', '中', '高'] },
            { id: 'shift4_furnace', label: 'Shift 4 熔炉状态', type: 'radio', required: false, options: ['开', '关'] },
            { id: 'shift4_tasks', label: 'Shift 4任务', type: 'checkbox', required: false, options: ['shooting', 'feeding', '干扰', '瞎逛', '挂车'] },
            { id: 'shift4_efficiency', label: 'Shift 4效率', type: 'radio', required: false, options: ['低', '中', '高'] },
            { id: 'endgame_tasks', label: 'End game任务', type: 'checkbox', required: false, options: ['shooting', 'feeding', '干扰', '瞎逛', '挂车'] },
            { id: 'endgame_efficiency', label: 'End game效率', type: 'radio', required: false, options: ['低', '中', '高'] }
        ]
    };
};

window.getScoutingTemplates = function () { var t = localStorage.getItem('scouting_templates'); return t ? JSON.parse(t) : []; };
window.saveScoutingTemplates = function (t) { localStorage.setItem('scouting_templates', JSON.stringify(t)); };
window.saveScoutingConfig = function (c) { localStorage.setItem('scouting_config', JSON.stringify(c)); };

window.loadTemplate = function (name) {
    if (name === '默认比赛模板') { window.saveScoutingConfig({ fields: window.getDefaultTemplate().fields }); window.showScoutingConfig(); return; }
    var t = window.getScoutingTemplates().find(function (x) { return x.name === name; });
    if (t) { window.saveScoutingConfig({ fields: t.fields }); window.showScoutingConfig(); }
};

window.saveAsTemplate = function () {
    var config = window.getScoutingConfig(), name = prompt('请输入模板名称：');
    if (!name) return;
    var templates = window.getScoutingTemplates();
    if (templates.find(function (x) { return x.name === name; }) || name === '默认比赛模板') { alert('模板名称已存在'); return; }
    templates.push({ name: name, fields: config.fields });
    window.saveScoutingTemplates(templates);
    alert('模板保存成功！');
    window.showScoutingConfig();
};

window.showTemplateManager = function () {
    var templates = window.getScoutingTemplates();
    var content = document.getElementById('scouting-content');
    var html = '<h2>模板管理</h2><div class="entry-card template-default-card"><h3>默认比赛模板</h3><p>系统内置模板</p><button onclick="loadTemplate(\'默认比赛模板\')">使用此模板</button></div>';
    templates.forEach(function (t, i) { html += '<div class="entry-card"><h3>' + t.name + '</h3><p>包含 ' + t.fields.length + ' 个字段</p><button onclick="loadTemplate(\'' + t.name + '\')">使用</button><button onclick="deleteTemplate(' + i + ')">删除</button></div>'; });
    if (!templates.length) html += '<p class="scouting-empty-top">暂无自定义模板</p>';
    html += '<button onclick="showScoutingConfig()" class="scouting-btn-top">返回配置</button>';
    content.innerHTML = html;
};

window.deleteTemplate = function (index) {
    if (!confirm('确定要删除这个模板吗？')) return;
    var t = window.getScoutingTemplates(); t.splice(index, 1); window.saveScoutingTemplates(t); window.showTemplateManager();
};

window.showScoutingConfig = function () {
    var config = window.getScoutingConfig(), templates = window.getScoutingTemplates(), content = document.getElementById('scouting-content');
    var html = '<h2>配置字段</h2><div class="scouting-toolbar scouting-toolbar-config"><div class="scouting-template-col"><label class="scouting-template-label">快速加载模板</label><select id="template-selector" onchange="if(this.value) loadTemplate(this.value)" class="scouting-template-select"><option value="">选择模板...</option><option value="默认比赛模板">默认比赛模板</option>';
    templates.forEach(function (t) { html += '<option value="' + t.name + '">' + t.name + '</option>'; });
    html += '</select></div><div class="scouting-template-actions"><button onclick="showTemplateManager()">管理模板</button><button onclick="saveAsTemplate()">保存为模板</button></div></div><div id="field-list">';
    config.fields.forEach(function (f, i) {
        html += '<div class="entry-card entry-card-static"><h3>' + f.label + '</h3><p>类型: ' + window.getFieldTypeText(f.type) + '</p>';
        if (f.options) html += '<p>选项: ' + f.options.join(', ') + '</p>';
        if (f.required) html += '<p class="scouting-required">✓ 必填</p>';
        html += '<button onclick="editScoutingField(' + i + ')">编辑</button><button onclick="deleteScoutingField(' + i + ')">删除</button></div>';
    });
    html += '</div><button onclick="addScoutingField()">添加新字段</button>';
    content.innerHTML = html;
};

window.addScoutingField = function () {
    var content = document.getElementById('scouting-content');
    content.innerHTML = '<h2>添加字段</h2><div class="form-group"><label>字段标签</label><input type="text" id="field-label" placeholder="例如: Auto Score"></div><div class="form-group"><label>字段ID（英文，无空格）</label><input type="text" id="field-id" placeholder="例如: auto_score"></div><div class="form-group"><label>字段类型</label><select id="field-type" onchange="toggleOptionsField()"><option value="text">文本</option><option value="number">数字</option><option value="radio">单选</option><option value="checkbox">多选</option></select></div><div class="form-group options-hidden" id="options-group"><label>选项（用逗号分隔）</label><input type="text" id="field-options" placeholder="例如: 选项1, 选项2, 选项3"></div><div class="form-group"><label><input type="checkbox" id="field-required"> 必填字段</label></div><button onclick="saveNewScoutingField()">保存</button><button onclick="showScoutingConfig()">取消</button>';
};

window.toggleOptionsField = function () {
    var g = document.getElementById('options-group'); if (!g) return;
    var t = document.getElementById('field-type').value;
    if (t === 'radio' || t === 'checkbox') { g.classList.remove('options-hidden'); } else { g.classList.add('options-hidden'); }
};

window.saveNewScoutingField = function () {
    var label = document.getElementById('field-label').value, id = document.getElementById('field-id').value;
    var type = document.getElementById('field-type').value, required = document.getElementById('field-required').checked;
    var oi = (document.getElementById('field-options') || {}).value || '';
    if (!label || !id) { alert('请填写字段标签和ID'); return; }
    var field = { id: id, label: label, type: type, required: required };
    if ((type === 'radio' || type === 'checkbox')) { if (!oi) { alert('请填写选项'); return; } field.options = oi.split(',').map(function (o) { return o.trim(); }); }
    var config = window.getScoutingConfig(); config.fields.push(field); window.saveScoutingConfig(config); window.showScoutingConfig();
};

window.editScoutingField = function (index) {
    var config = window.getScoutingConfig(), field = config.fields[index], content = document.getElementById('scouting-content');
    content.innerHTML = '<h2>编辑字段</h2><div class="form-group"><label>字段标签</label><input type="text" id="field-label" value="' + field.label + '"></div><div class="form-group"><label>字段ID</label><input type="text" id="field-id" value="' + field.id + '" readonly class="field-id-readonly"></div><div class="form-group"><label>字段类型</label><select id="field-type" onchange="toggleOptionsField()"><option value="text"' + (field.type==='text'?' selected':'') + '>文本</option><option value="number"' + (field.type==='number'?' selected':'') + '>数字</option><option value="radio"' + (field.type==='radio'?' selected':'') + '>单选</option><option value="checkbox"' + (field.type==='checkbox'?' selected':'') + '>多选</option></select></div><div class="form-group' + (field.type==='radio'||field.type==='checkbox'?'':' options-hidden') + '" id="options-group"><label>选项（用逗号分隔）</label><input type="text" id="field-options" value="' + (field.options?field.options.join(', '):'') + '"></div><div class="form-group"><label><input type="checkbox" id="field-required"' + (field.required?' checked':'') + '> 必填字段</label></div><button onclick="updateScoutingField(' + index + ')">保存</button><button onclick="showScoutingConfig()">取消</button>';
};

window.updateScoutingField = function (index) {
    var label = document.getElementById('field-label').value, type = document.getElementById('field-type').value;
    var required = document.getElementById('field-required').checked, oi = (document.getElementById('field-options') || {}).value || '';
    if (!label) { alert('请填写字段标签'); return; }
    var config = window.getScoutingConfig(); config.fields[index].label = label; config.fields[index].type = type; config.fields[index].required = required;
    if (type === 'radio' || type === 'checkbox') { if (!oi) { alert('请填写选项'); return; } config.fields[index].options = oi.split(',').map(function (o) { return o.trim(); }); }
    else { delete config.fields[index].options; }
    window.saveScoutingConfig(config); window.showScoutingConfig();
};

window.deleteScoutingField = function (index) { if (!confirm('确定要删除这个字段吗？')) return; var c = window.getScoutingConfig(); c.fields.splice(index, 1); window.saveScoutingConfig(c); window.showScoutingConfig(); };

window.getFieldSection = function (id) { var s = { auto_tasks:'auto', auto_efficiency:'auto', teleop_switch_tasks:'teleop', teleop_switch_efficiency:'teleop', shift1_furnace:'shift1', shift1_tasks:'shift1', shift1_efficiency:'shift1', shift2_furnace:'shift2', shift2_tasks:'shift2', shift2_efficiency:'shift2', shift3_furnace:'shift3', shift3_tasks:'shift3', shift3_efficiency:'shift3', shift4_furnace:'shift4', shift4_tasks:'shift4', shift4_efficiency:'shift4', endgame_tasks:'endgame', endgame_efficiency:'endgame' }; return s[id]||'basic'; };
window.getSectionTitle = function (s) { var t = { auto:'⚙️ 自动阶段', teleop:'🔄 过度切换', shift1:'🎯 Shift 1', shift2:'🎯 Shift 2', shift3:'🎯 Shift 3', shift4:'🎯 Shift 4', endgame:'🏁 End Game' }; return t[s]||''; };

window.renderFormField = function (field) { var h='<div class="form-group"><label>' + field.label + (field.required?' *':'') + '</label>'; if(field.type==='text')h+='<input type="text" id="field-'+field.id+'"'+(field.required?' required':'')+'>'; else if(field.type==='number')h+='<input type="number" step="any" id="field-'+field.id+'"'+(field.required?' required':'')+'>'; else if(field.type==='radio'&&field.options){field.options.forEach(function(o,i){h+='<div><label class="label-normal">'+o+'<input type="radio" name="field-'+field.id+'" value="'+o+'"'+(field.required&&i===0?' required':'')+'></label></div>'});} else if(field.type==='checkbox'&&field.options){field.options.forEach(function(o){h+='<div><label class="label-normal">'+o+'<input type="checkbox" name="field-'+field.id+'" value="'+o+'"></label></div>'});} return h+'</div>'; };

window.showScoutingForm = function () {
    var config = window.getScoutingConfig(), content = document.getElementById('scouting-content'), html='<h2>数据收集</h2><form id="scouting-form">';
    var fbs = {}, sections = [];
    config.fields.forEach(function(f){var s=window.getFieldSection(f.id);if(!fbs[s]){fbs[s]=[];sections.push(s);}fbs[s].push(f);});
    sections.forEach(function(s){var fs=fbs[s],st=window.getSectionTitle(s);if(s==='basic'){fs.forEach(function(f){html+=window.renderFormField(f);});}else{html+='<div class="scouting-section">';if(st)html+='<div class="scouting-section-title">'+st+'</div>';fs.forEach(function(f){html+=window.renderFormField(f);});html+='</div>';}});
    html+='<button type="button" onclick="submitScoutingData()">提交</button><button type="button" onclick="showScoutingData()">查看数据</button></form>';
    content.innerHTML = html;
};

window.submitScoutingData = async function () {
    var config = window.getScoutingConfig(), data = { ts: Date.now() };
    for (var i = 0; i < config.fields.length; i++) { var f = config.fields[i]; if (f.type === 'checkbox') { var cbs = document.querySelectorAll('input[name="field-' + f.id + '"]:checked'); data[f.id] = []; for (var j = 0; j < cbs.length; j++) data[f.id].push(cbs[j].value); } else if (f.type === 'radio') { var r = document.querySelector('input[name="field-' + f.id + '"]:checked'); data[f.id] = r ? r.value : ''; } else { var input = document.getElementById('field-' + f.id); data[f.id] = input ? input.value : ''; } if (f.required && (!data[f.id] || (Array.isArray(data[f.id]) && !data[f.id].length))) { alert('请填写必填字段: ' + f.label); return; } }
    if (window.isAdmin()) { var res = await window.apiFetch('/api/scouting', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) }); if(!res.ok){alert('提交失败');return;} } else { var sd = window.getLocalScoutingData(); data.id = crypto.randomUUID(); sd.push(data); window.saveLocalScoutingData(sd); }
    alert(window.isAdmin()?'数据提交成功！':'数据提交成功（本地保存）！'); window.showScoutingForm();
};

window.showScoutingData = async function () {
    var config = window.getScoutingConfig(), sd = await window.getScoutingEntries(''), content = document.getElementById('scouting-content');
    if (!sd.length) { content.innerHTML = '<h2>收集的数据</h2><p>暂无数据</p><button onclick="showScoutingForm()">开始收集</button>'; return; }
    var html = '<h2>收集的数据</h2><button onclick="showScoutingForm()" class="btn-mb-15">继续收集</button><button onclick="exportScoutingData()" class="btn-mb-15 btn-ml-10">导出数据</button>';
    sd.reverse().forEach(function(e,i){html+='<div class="entry-card"><h3>记录 #'+(sd.length-i)+'</h3><div class="entry-detail">';config.fields.forEach(function(f){var v=e[f.id],dv='';if(Array.isArray(v))dv=v.join(', ');else dv=v||'-';html+='<div class="detail-item"><strong>'+f.label+':</strong> '+dv+'</div>';});html+='<div class="detail-item"><strong>提交时间:</strong> '+new Date(e.ts).toLocaleString()+'</div></div>';if(!window.isAdmin())html+='<button onclick="deleteScoutingEntry(\''+e.id+'\')">删除</button>';html+='</div>';});
    if (window.isAdmin()) { var le = window.getLocalScoutingData(); if (le.length) { html += '<h3 class="section-title-top-24">本地数据（待提交）</h3>'; le.forEach(function(e,i){html+='<div class="entry-card"><h3>本地记录 #'+(i+1)+'</h3><div class="entry-detail">';config.fields.forEach(function(f){var v=e[f.id],dv='';if(Array.isArray(v))dv=v.join(', ');else dv=v||'-';html+='<div class="detail-item"><strong>'+f.label+':</strong> '+dv+'</div>';});html+='<div class="detail-item"><strong>提交时间:</strong> '+new Date(e.ts||Date.now()).toLocaleString()+'</div></div><button onclick="submitLocalScouting(\''+e.id+'\')" class="btn-mt-10">提交到服务器</button></div>';}); } }
    content.innerHTML = html;
};

window.deleteScoutingEntry = function (id) { if(!confirm('确定要删除这条记录吗？'))return; var d=window.getLocalScoutingData(),f=d.filter(function(e){return e.id!==id;});window.saveLocalScoutingData(f);window.showScoutingData(); };

window.exportScoutingData = async function () {
    var config = window.getScoutingConfig(), sd = await window.getScoutingEntries('');
    if (!sd.length) { alert('暂无数据可导出'); return; }
    var csv = config.fields.map(function(f){return f.label;}).join(',') + ',提交时间\n';
    sd.forEach(function(e){var row=config.fields.map(function(f){var v=e[f.id];return Array.isArray(v)?'"'+v.join('; ')+'"':'"'+(v||'')+'"';}).join(',');csv+=row+','+new Date(e.ts).toLocaleString()+'\n';});
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }), link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'scouting_data_' + Date.now() + '.csv'; link.click();
};

})();

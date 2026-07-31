// analysis-core.js — Analysis 模块
(function () {

window.renderAnalysis = function () {
    return '<h1>Analysis</h1><div class="analysis-toolbar"><button onclick="showAnalysisOverview()">数据总览</button><button onclick="showTeamComparison()">赛队对比</button></div><div id="analysis-content"><p>点击上方按钮查看数据分析。</p></div>';
};

window.showAnalysisOverview = async function () {
    var content = document.getElementById('analysis-content'), pre = await window.getPrescoutEntries(''), sc = await window.getScoutingEntries(''), scfg = window.getScoutingConfig(), teams = [];
    pre.forEach(function(e){if(teams.indexOf(e.teamNumber)<0)teams.push(e.teamNumber);});
    sc.forEach(function(e){if(e.team&&teams.indexOf(e.team)<0)teams.push(e.team);});
    var html = '<h2>数据总览</h2><p>共 '+teams.length+' 支赛队 | PreScouting: '+pre.length+' 条记录 | Scouting: '+sc.length+' 条记录</p><h3 class="analysis-subtitle-30">PreScouting 数据</h3>';
    if (pre.length) { html += '<div class="analysis-table-wrap"><table class="analysis-table analysis-table-gap"><thead><tr class="analysis-table-head-blue"><th>队号</th><th>队名</th><th>赛事</th><th>练习时长</th><th>比赛次数</th><th>底盘</th><th>记录者</th><th>操作</th></tr></thead><tbody>';
    pre.forEach(function(e){ html+='<tr class="analysis-row"><td class="analysis-cell analysis-cell-strong">'+e.teamNumber+'</td><td class="analysis-cell">'+e.teamName+'</td><td class="analysis-cell">'+e.event+'</td><td class="analysis-cell">'+e.practice+'h</td><td class="analysis-cell">'+e.compCount+'</td><td class="analysis-cell">'+e.chassis+'</td><td class="analysis-cell">'+e.collector+'</td><td class="analysis-cell"><button onclick="showTeamDetail(\''+e.teamNumber+'\')" class="analysis-btn-sm">查看详情</button>'+(window.currentRole==='admin'?'<button onclick="deletePrescoutEntry(\''+e.id+'\')" class="analysis-btn-sm" style="background:#dc3545;">删除</button>':'')+'</td></tr>'; });
    html += '</tbody></table></div>'; } else { html += '<p class="analysis-empty">暂无PreScouting数据</p>'; }
    html += '<h3 class="analysis-subtitle-40">Scouting 数据</h3>';
    if (sc.length) { html+='<div class="analysis-table-wrap"><table class="analysis-table analysis-table-gap"><thead><tr class="analysis-table-head-purple">';
    scfg.fields.forEach(function(f){html+='<th>'+f.label+'</th>';}); html+='<th>提交时间</th><th>操作</th></tr></thead><tbody>';
    sc.forEach(function(e){html+='<tr class="analysis-row">';scfg.fields.forEach(function(f){var v=e[f.id],dv='';if(Array.isArray(v))dv=v.join(', ');else dv=v||'-';html+='<td class="analysis-cell">'+dv+'</td>';});html+='<td class="analysis-cell">'+new Date(e.ts).toLocaleString()+'</td><td class="analysis-cell"><button onclick="showTeamDetail(\''+(e.team||'')+'\')" class="analysis-btn-sm">查看详情</button>'+(window.currentRole==='admin'?'<button onclick="deleteScoutingEntry(\''+e.id+'\')" class="analysis-btn-sm" style="background:#dc3545;">删除</button>':'')+'</td></tr>';});
    html+='</tbody></table></div>'; } else { html+='<p class="analysis-empty">暂无Scouting数据</p>'; }
    content.innerHTML = html;
};

window.deletePrescoutEntry = async function (id) { if(!confirm('确定要删除此 PreScouting 记录吗？'))return; try{var r=await fetch('/api/prescout?id='+id,{method:'DELETE',headers:{Authorization:'Bearer '+(window.currentToken||'')}});if(r.ok){alert('记录已删除');window.showAnalysisOverview();}else{var e=await r.json();alert('删除失败: '+(e.error||'?'));}}catch(e){alert('删除失败: '+e.message);} };
window.deleteScoutingEntry = async function (id) { if(!confirm('确定要删除此 Scouting 记录吗？'))return; try{var r=await fetch('/api/scouting?id='+id,{method:'DELETE',headers:{Authorization:'Bearer '+(window.currentToken||'')}});if(r.ok){alert('记录已删除');window.showAnalysisOverview();}else{var e=await r.json();alert('删除失败: '+(e.error||'?'));}}catch(e){alert('删除失败: '+e.message);} };

window.showTeamDetail = async function (tn) {
    if(!tn){alert('未找到赛队信息');return;} var c=document.getElementById('analysis-content'),allP=await window.getPrescoutEntries(''),tp=allP.filter(function(e){return e.teamNumber===tn;}),allS=await window.getScoutingEntries(''),ts=allS.filter(function(e){return e.team===tn;}),scfg=window.getScoutingConfig();
    var h='<div class="analysis-toolbar"><button onclick="showAnalysisOverview()">← 返回总览</button></div><h2>赛队 '+tn+' 详细数据</h2><p>PreScouting: '+tp.length+' 条 | Scouting: '+ts.length+' 条</p><h3 class="analysis-subtitle-30">PreScouting 阶段</h3>';
    if(tp.length){tp.forEach(function(e){h+='<div class="entry-card"><h3>Team '+e.teamNumber+' - '+e.teamName+'</h3><div class="entry-detail"><div class="detail-item"><strong>Event:</strong> '+e.event+'</div><div class="detail-item"><strong>Collector:</strong> '+e.collector+'</div><div class="detail-item"><strong>Practice:</strong> '+e.practice+'h</div><div class="detail-item"><strong>Competitions:</strong> '+e.compCount+'</div><div class="detail-item"><strong>Chassis:</strong> '+e.chassis+'</div><div class="detail-item"><strong>提交时间:</strong> '+new Date(e.ts).toLocaleString()+'</div></div></div>';});}else{h+='<p class="analysis-empty">该赛队暂无PreScouting数据</p>';}
    h+='<h3 class="analysis-subtitle-40">Scouting 阶段</h3>';
    if(ts.length){ts.forEach(function(e,i){h+='<div class="entry-card"><h3>记录 #'+(i+1)+'</h3><div class="entry-detail">';scfg.fields.forEach(function(f){var v=e[f.id],dv='';if(Array.isArray(v))dv=v.join(', ');else dv=v||'-';h+='<div class="detail-item"><strong>'+f.label+':</strong> '+dv+'</div>';});h+='<div class="detail-item"><strong>提交时间:</strong> '+new Date(e.ts).toLocaleString()+'</div></div></div>';});}else{h+='<p class="analysis-empty">该赛队暂无Scouting数据</p>';}
    c.innerHTML = h;
};

window.showTeamComparison = async function () {
    var c=document.getElementById('analysis-content'),pre=await window.getPrescoutEntries(''),sc=await window.getScoutingEntries(''),map={};
    pre.forEach(function(e){if(!map[e.teamNumber])map[e.teamNumber]={number:e.teamNumber,name:e.teamName,preCount:0,scCount:0,practices:[],compCounts:[],chassis:{}};var t=map[e.teamNumber];t.preCount++;if(e.practice)t.practices.push(parseInt(e.practice)||0);if(e.compCount)t.compCounts.push(e.compCount);if(e.chassis)t.chassis[e.chassis]=(t.chassis[e.chassis]||0)+1;});
    sc.forEach(function(e){var tn=e.team||'';if(tn){if(!map[tn])map[tn]={number:tn,name:'-',preCount:0,scCount:0,practices:[],compCounts:[],chassis:{}};map[tn].scCount++;}});
    var teams=Object.keys(map).map(function(k){return map[k];}).sort(function(a,b){return(parseInt(a.number)||0)-(parseInt(b.number)||0);});
    var h='<h2>赛队对比</h2><p>共 '+teams.length+' 支赛队</p><div class="analysis-table-wrap analysis-table-wrap-gap"><table class="analysis-table"><thead><tr class="analysis-table-head-gradient"><th>队号</th><th>队名</th><th class="analysis-cell-center">PreScouting</th><th class="analysis-cell-center">平均练习时长</th><th class="analysis-cell-center">平均比赛次数</th><th class="analysis-cell-center">常用底盘</th><th class="analysis-cell-center">Scouting</th><th class="analysis-cell-center">总计</th><th>操作</th></tr></thead><tbody>';
    teams.forEach(function(t){var total=t.preCount+t.scCount,avgP=t.practices.length?(t.practices.reduce(function(a,b){return a+b;},0)/t.practices.length).toFixed(1):'-',avgC=t.compCounts.length?(t.compCounts.reduce(function(a,b){return a+b;},0)/t.compCounts.length).toFixed(1):'-',cc=Object.keys(t.chassis).length?Object.keys(t.chassis).sort(function(a,b){return t.chassis[b]-t.chassis[a];})[0]:'-';
    h+='<tr class="analysis-row"><td class="analysis-cell analysis-cell-strong">'+t.number+'</td><td class="analysis-cell">'+t.name+'</td><td class="analysis-cell analysis-cell-center">'+t.preCount+'</td><td class="analysis-cell analysis-cell-center">'+avgP+'h</td><td class="analysis-cell analysis-cell-center">'+avgC+'</td><td class="analysis-cell analysis-cell-center">'+cc+'</td><td class="analysis-cell analysis-cell-center">'+t.scCount+'</td><td class="analysis-cell analysis-cell-center analysis-cell-strong">'+total+'</td><td class="analysis-cell"><button onclick="showTeamDetail(\''+t.number+'\')" class="analysis-btn-sm">查看详情</button></td></tr>';});
    h+='</tbody></table></div>'; c.innerHTML = h;
};

})();

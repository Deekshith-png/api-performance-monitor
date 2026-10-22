let latencyChart;
const $ = id => document.getElementById(id);
function showNotice(message, isError=false){const n=$("notice");n.textContent=message;n.className=isError?"notice error":"notice";n.hidden=false;}
function formatTime(value){return value?new Date(value).toLocaleString():"—";}
function escapeHtml(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
async function refreshDashboard(){
 const [sr,hr]=await Promise.all([fetch("/api/summary"),fetch("/api/history?limit=20")]);
 const s=await sr.json(), h=await hr.json();
 $("total-checks").textContent=s.total_checks;$("success-rate").innerHTML=`${s.success_rate_percent}<span class="unit">%</span>`;
 $("average-time").innerHTML=`${s.average_response_ms}<span class="unit"> ms</span>`;$("failed-checks").textContent=s.failed_checks;
 $("history-body").innerHTML=h.length?h.map(i=>{const status=i.status_code===null?"Connection error":`HTTP ${i.status_code}`;return `<tr><td class="endpoint" title="${escapeHtml(i.url)}">${escapeHtml(i.url)}</td><td><span class="pill ${i.success?"ok":"bad"}">${i.success?"Success":"Failed"} · ${status}</span></td><td class="latency">${i.response_time_ms} ms</td><td>${escapeHtml(formatTime(i.checked_at))}</td></tr>`;}).join(""):'<tr><td colspan="4" class="empty-table">No checks yet.</td></tr>';
 const ch=[...h].reverse();$("empty-chart").style.display=ch.length?"none":"block";
 const data={labels:ch.map(i=>new Date(i.checked_at).toLocaleTimeString()),datasets:[{label:"Response time (ms)",data:ch.map(i=>i.response_time_ms),borderColor:"#6655e8",backgroundColor:"rgba(102,85,232,.12)",fill:true,tension:.35,pointRadius:3}]};
 if(latencyChart){latencyChart.data=data;latencyChart.update();}else if(window.Chart){latencyChart=new Chart($("latency-chart"),{type:"line",data,options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{grid:{display:false},ticks:{color:"#8791a4",maxTicksLimit:8}},y:{beginAtZero:true,grid:{color:"#eef0f6"},ticks:{color:"#8791a4"}}}}});}
}
$("check-form").addEventListener("submit",async e=>{e.preventDefault();const b=$("check-button");b.disabled=true;b.textContent="Checking…";$("notice").hidden=true;try{const r=await fetch("/api/check",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:$("url").value.trim()})});const result=await r.json();if(!r.ok)throw Error(result.error||"Could not check URL.");if(result.success)showNotice(`Check completed: HTTP ${result.status_code} in ${result.response_time_ms} ms.`);else if(result.status_code!==null)showNotice(`Endpoint returned HTTP ${result.status_code} in ${result.response_time_ms} ms. Recorded as failed.`,true);else showNotice(`Connection failed after ${result.response_time_ms} ms: ${result.error}`,true);await refreshDashboard();}catch(err){showNotice(err.message||"Something went wrong.",true);}finally{b.disabled=false;b.innerHTML='Run check <span>→</span>'; }});
document.querySelectorAll(".example").forEach(b=>b.addEventListener("click",()=>{$("url").value=b.dataset.url;$("url").focus();}));
$("clear-history").addEventListener("click",async()=>{if(!confirm("Clear all saved check history?"))return;await fetch("/api/history/clear",{method:"POST"});await refreshDashboard();showNotice("Check history cleared.");});
refreshDashboard().catch(()=>showNotice("Could not load dashboard data. Refresh the page.",true));

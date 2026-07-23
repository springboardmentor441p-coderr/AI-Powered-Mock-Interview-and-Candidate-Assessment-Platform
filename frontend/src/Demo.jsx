import React from 'react';

const demoHTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SmartHire AI — demo</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#0d1015; --bg-2:#141821; --surface:#1a1f28; --surface-2:#212834;
  --border:#293040; --border-2:#39435580;
  --text:#eef0f3; --text-dim:#9aa3b2; --text-faint:#5b6472;
  --amber:#ffb020; --amber-dim:#3a2f18;
  --teal:#3ecf8e; --teal-dim:#123626;
  --coral:#ff6b5e; --coral-dim:#3a1f1c;
  --radius:10px;
  --f-display:'Space Grotesk',sans-serif;
  --f-body:'Inter',sans-serif;
  --f-mono:'IBM Plex Mono',monospace;
}
*{box-sizing:border-box;margin:0;padding:0;}
body{background:var(--bg);color:var(--text);font-family:var(--f-body);padding-top:44px;-webkit-font-smoothing:antialiased;}
a{color:inherit;text-decoration:none;}
button{font-family:inherit;cursor:pointer;}
h1,h2,h3{font-family:var(--f-display);font-weight:600;letter-spacing:-0.01em;}
.mono{font-family:var(--f-mono);}

/* demo chrome */
.demo-bar{position:fixed;top:0;left:0;right:0;height:44px;background:#05070a;border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;padding:0 20px;z-index:999;overflow-x:auto;white-space:nowrap;}
.demo-label{font-family:var(--f-mono);font-size:10px;letter-spacing:.08em;color:var(--text-faint);text-transform:uppercase;flex-shrink:0;margin-right:16px;}
.demo-pills{display:flex;gap:4px;}
.demo-pill{background:transparent;border:1px solid var(--border);color:var(--text-dim);font-family:var(--f-mono);
  font-size:10.5px;letter-spacing:.03em;padding:5px 10px;border-radius:6px;transition:all .15s;}
.demo-pill.active{background:var(--amber-dim);border-color:var(--amber);color:var(--amber);}
.demo-pill:hover{border-color:var(--border-2);color:var(--text);}

.page{display:none;}
.page.active{display:block;}
.wrap{max-width:1120px;margin:0 auto;padding:0 32px;}

/* buttons */
.btn{display:inline-flex;align-items:center;gap:8px;padding:11px 20px;border-radius:8px;font-size:14px;font-weight:500;border:1px solid transparent;transition:all .15s;}
.btn-amber{background:var(--amber);color:#1a1305;}
.btn-amber:hover{background:#ffc247;}
.btn-ghost{background:transparent;color:var(--text);border-color:var(--border-2);}
.btn-ghost:hover{border-color:var(--text-dim);}
.btn-coral{background:var(--coral-dim);color:var(--coral);border-color:#5a2a24;}
.btn-block{width:100%;justify-content:center;}

/* misc */
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);padding:20px;}
.tag{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-family:var(--f-mono);padding:4px 9px;border-radius:5px;border:1px solid;}
.tag-teal{background:var(--teal-dim);color:var(--teal);border-color:#1c5a3d;}
.tag-coral{background:var(--coral-dim);color:var(--coral);border-color:#5a2a24;}
.tag-amber{background:var(--amber-dim);color:var(--amber);border-color:#5a4318;}
.dot{width:7px;height:7px;border-radius:50%;display:inline-block;}
.pulse{animation:pulse 1.6s ease-in-out infinite;}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.35;}}
.bar-track{height:6px;border-radius:3px;background:var(--surface-2);overflow:hidden;}
.bar-fill{height:100%;border-radius:3px;transition:width .6s ease;}
.icon{width:18px;height:18px;stroke:currentColor;fill:none;stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0;}

/* ============ LANDING ============ */
.l-nav{display:flex;align-items:center;justify-content:space-between;padding:22px 0;}
.logo{font-family:var(--f-display);font-weight:700;font-size:17px;display:flex;align-items:center;gap:8px;}
.logo .dot{background:var(--amber);width:8px;height:8px;}
.l-links{display:flex;gap:28px;font-size:13.5px;color:var(--text-dim);}
.l-cta{display:flex;gap:10px;}
.hero{display:grid;grid-template-columns:1.15fr 1fr;gap:56px;align-items:center;padding:64px 0 88px;}
.hero h1{font-size:44px;line-height:1.08;margin-bottom:18px;}
.hero h1 span{color:var(--amber);}
.hero p{color:var(--text-dim);font-size:16px;line-height:1.6;max-width:440px;margin-bottom:28px;}
.vitals-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:22px;}
.vitals-head{display:flex;align-items:center;gap:8px;font-family:var(--f-mono);font-size:11px;color:var(--text-faint);letter-spacing:.06em;margin-bottom:18px;text-transform:uppercase;}
.vital-row{margin-bottom:16px;}
.vital-row:last-child{margin-bottom:0;}
.vital-label{display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim);margin-bottom:6px;}
.vital-label .mono{color:var(--text);} 
.trust{display:flex;gap:0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:20px 0;margin-bottom:80px;}
.trust div{flex:1;text-align:center;border-right:1px solid var(--border);} 
.trust div:last-child{border-right:none;} 
.trust .num{font-family:var(--f-mono);font-size:22px;color:var(--amber);} 
.trust .lbl{font-size:11.5px;color:var(--text-faint);margin-top:4px;} 
.feat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:88px;} 
.feat-card .icon{color:var(--amber);margin-bottom:14px;} 
.feat-card h3{font-size:15px;margin-bottom:8px;} 
.feat-card p{font-size:12.5px;color:var(--text-dim);line-height:1.55;} 
.steps{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:88px;} 
.step-num{font-family:var(--f-mono);color:var(--amber);font-size:12px;margin-bottom:10px;} 
.step h3{font-size:16px;margin-bottom:6px;} 
.step p{font-size:13px;color:var(--text-dim);} 
.cta-band{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:48px;text-align:center;margin-bottom:80px;} 
.cta-band h2{font-size:26px;margin-bottom:10px;} 
.cta-band p{color:var(--text-dim);margin-bottom:22px;} 

/* ============ LOGIN ============ */
.login-shell{display:grid;grid-template-columns:1fr 1fr;min-height:calc(100vh - 44px);} 
.login-brand{background:var(--bg-2);display:flex;flex-direction:column;justify-content:center;padding:64px;border-right:1px solid var(--border);} 
.login-brand blockquote{font-family:var(--f-display);font-size:24px;line-height:1.4;margin-bottom:16px;} 
.login-brand cite{font-size:12.5px;color:var(--text-faint);font-style:normal;} 
.login-form-side{display:flex;align-items:center;justify-content:center;padding:40px;} 
.login-form{width:100%;max-width:360px;} 
.login-form h2{font-size:24px;margin-bottom:6px;} 
.login-form>p{color:var(--text-dim);font-size:13.5px;margin-bottom:28px;} 
.field{margin-bottom:14px;} 
.field label{display:block;font-size:12px;color:var(--text-dim);margin-bottom:6px;} 
.field input{width:100%;background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:11px 13px;color:var(--text);font-size:14px;} 
.field input:focus{outline:none;border-color:var(--amber);} 
.divider{display:flex;align-items:center;gap:12px;color:var(--text-faint);font-size:11.5px;margin:20px 0;} 
.divider::before,.divider::after{content:"";flex:1;height:1px;background:var(--border);} 

/* ============ APP SHELL (dashboard/upload/setup/history) ============ */
.app-shell{display:grid;grid-template-columns:216px 1fr;min-height:calc(100vh - 44px);} 
.sidebar{background:var(--bg-2);border-right:1px solid var(--border);padding:24px 14px;display:flex;flex-direction:column;} 
.side-link{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:7px;font-size:13.5px;color:var(--text-dim);margin-bottom:2px;} 
.side-link.active{background:var(--surface);color:var(--text);} 
.side-link .icon{width:16px;height:16px;} 
.app-main{padding:32px 40px;} 
.app-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;} 
.app-head h1{font-size:22px;margin-bottom:4px;} 
.app-head p{color:var(--text-dim);font-size:13.5px;} 
.stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:24px;} 
.stat-card .num{font-family:var(--f-mono);font-size:30px;color:var(--amber);} 
.stat-card .lbl{font-size:12px;color:var(--text-dim);margin-top:2px;} 
.chart-bars{display:flex;align-items:flex-end;gap:8px;height:80px;margin-top:16px;} 
.chart-bars div{flex:1;background:var(--surface-2);border-radius:3px 3px 0 0;position:relative;} 
.chart-bars div.hi{background:var(--teal);} 
.sess-row{display:flex;align-items:center;justify-content:space-between;padding:13px 0;border-bottom:1px solid var(--border);} 
.sess-row:last-child{border-bottom:none;} 
.sess-left{display:flex;align-items:center;gap:12px;} 
.sess-icon{width:34px;height:34px;border-radius:8px;background:var(--surface-2);display:flex;align-items:center;justify-content:center;} 
.sess-title{font-size:13.5px;font-weight:500;} 
.sess-sub{font-size:11.5px;color:var(--text-faint);} 

/* ============ UPLOAD ============ */
.drop{border:1.5px dashed var(--border-2);border-radius:12px;padding:56px;text-align:center;background:var(--surface);margin-bottom:24px;} 
.drop .icon{width:32px;height:32px;color:var(--amber);margin-bottom:14px;} 
.skill-tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;} 

/* ============ SETUP ============ */
.setup-block{margin-bottom:26px;} 
.setup-label{font-size:12px;color:var(--text-dim);letter-spacing:.04em;text-transform:uppercase;font-family:var(--f-mono);margin-bottom:10px;} 
.pill-row{display:flex;gap:10px;flex-wrap:wrap;} 
.pill-opt{padding:10px 18px;border-radius:8px;border:1px solid var(--border-2);font-size:13.5px;color:var(--text-dim);} 
.pill-opt.sel{border-color:var(--amber);color:var(--amber);background:var(--amber-dim);} 
.pill-opt.sel.teal{border-color:var(--teal);color:var(--teal);background:var(--teal-dim);} 
.pill-opt.sel.coral{border-color:var(--coral);color:var(--coral);background:var(--coral-dim);} 

/* ============ INTERVIEW ROOM ============ */
.room-shell{padding-top:0;} 
.room-head{display:flex;justify-content:space-between;align-items:center;padding:16px 40px;border-bottom:1px solid var(--border);background:var(--bg-2);} 
.room-dots{display:flex;gap:6px;} 
.room-dots span{width:6px;height:6px;border-radius:50%;background:var(--border-2);} 
.room-dots span.done{background:var(--amber);} 
.timer{font-family:var(--f-mono);color:var(--amber);font-size:15px;} 
.room-body{display:grid;grid-template-columns:1fr 1fr;gap:0;min-height:calc(100vh - 44px - 60px - 70px);} 
.cam-panel{background:#000;position:relative;display:flex;align-items:center;justify-content:center;border-right:1px solid var(--border);} 
.cam-avatar{width:110px;height:110px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;} 
.cam-avatar .icon{width:40px;height:40px;color:var(--text-faint);} 
.cam-badge{position:absolute;top:16px;left:16px;background:rgba(0,0,0,.6);border:1px solid var(--teal);color:var(--teal);
  font-family:var(--f-mono);font-size:11px;padding:5px 10px;border-radius:6px;display:flex;align-items:center;gap:6px;} 
.rec-badge{position:absolute;top:16px;right:16px;background:rgba(0,0,0,.6);color:var(--coral);font-family:var(--f-mono);font-size:11px;
  padding:5px 10px;border-radius:6px;display:flex;align-items:center;gap:6px;} 
.chat-panel{display:flex;flex-direction:column;padding:24px;} 
.chat-scroll{flex:1;} 
.bubble{border-radius:12px;padding:12px 15px;font-size:13.5px;line-height:1.55;margin-bottom:12px;max-width:88%;} 
.bubble.ai{background:var(--surface);border:1px solid var(--border);border-bottom-left-radius:4px;} 
.bubble.user{background:var(--amber-dim);border:1px solid #5a4318;border-bottom-right-radius:4px;margin-left:auto;color:var(--text);} 
.cursor{display:inline-block;width:6px;height:13px;background:var(--amber);vertical-align:middle;animation:pulse 1s step-end infinite;} 
.vitals-mini{border-top:1px solid var(--border);padding-top:16px;margin-top:auto;} 
.mic-row{display:flex;align-items:center;gap:12px;margin-top:16px;} 
.mic-btn{width:44px;height:44px;border-radius:50%;background:var(--surface-2);border:1px solid var(--border-2);display:flex;align-items:center;justify-content:center;} 
.wave{display:flex;align-items:center;gap:3px;flex:1;height:28px;} 
.wave span{width:3px;background:var(--amber);border-radius:2px;} 
.room-foot{display:flex;justify-content:flex-end;padding:14px 40px;border-top:1px solid var(--border);background:var(--bg-2);} 

/* ============ REPORT ============ */
.report-top{display:flex;align-items:center;gap:28px;margin-bottom:28px;} 
.score-ring{width:120px;height:120px;border-radius:50%;flex-shrink:0;position:relative;
  background:conic-gradient(var(--teal) 0% 76%, var(--surface-2) 76% 100%);
  display:flex;align-items:center;justify-content:center;} 
.score-ring::before{content:"";position:absolute;width:92px;height:92px;border-radius:50%;background:var(--bg);} 
.score-ring span{position:relative;font-family:var(--f-mono);font-size:26px;color:var(--text);} 
.cat-row{margin-bottom:14px;} 
.cat-label{display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;color:var(--text-dim);} 
.tag-row{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0;} 
.transcript-line{font-size:13px;color:var(--text-dim);line-height:1.7;padding:3px 0;} 
.transcript-line b{color:var(--text);} 

/* ============ HISTORY ============ */
.hist-table{width:100%;border-collapse:collapse;} 
.hist-table th{text-align:left;font-size:11px;color:var(--text-faint);font-family:var(--f-mono);text-transform:uppercase;letter-spacing:.05em;padding:0 0 10px;border-bottom:1px solid var(--border);} 
.hist-table td{padding:13px 0;border-bottom:1px solid var(--border);font-size:13.5px;} 
.trend-up{color:var(--teal);font-family:var(--f-mono);font-size:12.5px;} 

@media(max-width:860px){
  .hero,.feat-grid,.steps,.stat-grid,.room-body{grid-template-columns:1fr;}
  .app-shell,.login-shell{grid-template-columns:1fr;}
  .sidebar{display:none;}
}
</style>
</head>
<body>

<div class="demo-bar">
  <span class="demo-label">SmartHire AI — interactive demo</span>
  <div class="demo-pills">
    <button class="demo-pill active" onclick="showPage('landing',this)">Landing</button>
    <button class="demo-pill" onclick="showPage('login',this)">Login</button>
    <button class="demo-pill" onclick="showPage('dashboard',this)">Dashboard</button>
    <button class="demo-pill" onclick="showPage('upload',this)">Resume</button>
    <button class="demo-pill" onclick="showPage('setup',this)">Setup</button>
    <button class="demo-pill" onclick="showPage('interview',this)">Interview room</button>
    <button class="demo-pill" onclick="showPage('report',this)">Report</button>
    <button class="demo-pill" onclick="showPage('history',this)">History</button>
  </div>
</div>

<!-- UPLOAD PAGE (embedded demo) -->
<section class="page" id="page-upload">
  <div class="app-shell">
    <aside class="sidebar">
      <div class="logo" style="margin-bottom:24px;padding:0 12px;"><span class="dot"></span>SmartHire</div>
      <a class="side-link" onclick="showPage('dashboard',null)">Dashboard</a>
      <a class="side-link" onclick="showPage('setup',null)">Practice</a>
      <a class="side-link" onclick="showPage('history',null)">History</a>
      <a class="side-link active">Resume</a>
    </aside>
    <main class="app-main">
      <div class="app-head"><div><h1>Resume</h1><p>Upload your resume so questions are tailored to your real experience.</p></div></div>
      <div class="drop">
        <svg class="icon" viewBox="0 0 24 24" style="width:32px;height:32px;margin:0 auto 14px;"><path d="M12 3v12M7 8l5-5 5 5M5 21h14"/></svg>
        <div style="font-size:14px;margin-bottom:4px;">Drag and drop your resume here</div>
        <div style="font-size:12px;color:var(--text-faint);margin-bottom:16px;">PDF, up to 5MB</div>
        <button class="btn btn-ghost" onclick="parent.postMessage({type:'triggerFilePicker'}, '*')">Browse files</button>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
          <h3 style="font-size:14px;" id="extracted-profile-title">Extracted profile — none</h3>
          <span class="tag tag-teal" id="extracted-status">not parsed</span>
        </div>
        <div style="font-size:12px;color:var(--text-faint);margin-bottom:4px;">Skills detected</div>
        <div class="skill-tags" id="skill-tags">
          <!-- tags inserted here -->
        </div>
        <div style="margin-top:18px;font-size:13px;color:var(--text-dim);" id="resume-preview"></div>
      </div>
    </main>
  </div>
</section>

<script>
// listen for parent upload results and update UI
window.addEventListener('message', function(e){
  if(!e?.data) return;
  if(e.data.type === 'uploadResult'){
    var p = e.data.payload || {};
    var title = document.getElementById('extracted-profile-title');
    var status = document.getElementById('extracted-status');
    var tags = document.getElementById('skill-tags');
    var preview = document.getElementById('resume-preview');
    if(p.error){
      title.textContent = 'Upload failed';
      status.textContent = 'error';
      preview.textContent = p.error;
      tags.innerHTML = '';
      return;
    }
    title.textContent = 'Extracted profile — ' + (p.resume_name || 'uploaded');
    status.textContent = p.resume_name ? 'parsed' : 'uploaded';
    // simple keyword extraction for demo purposes
    var text = (p.resume_preview || '').toLowerCase();
    var keywords = ['python','fastapi','postgresql','react','docker','sql','javascript','ml','django','flask','aws'];
    tags.innerHTML = '';
    keywords.forEach(function(k){ if(text.indexOf(k) !== -1){ var s = document.createElement('span'); s.className='tag tag-amber'; s.textContent = k.charAt(0).toUpperCase()+k.slice(1); tags.appendChild(s); } });
    preview.textContent = p.resume_preview ? p.resume_preview.slice(0,800) : '';
  }
});
</script>

<script>
function showPage(id, el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  var target = document.getElementById('page-'+id);
  if(target) target.classList.add('active');
  document.querySelectorAll('.demo-pill').forEach(p=>p.classList.remove('active'));
  var idx = ['landing','login','dashboard','upload','setup','interview','report','history'].indexOf(id);
  if(document.querySelectorAll('.demo-pill')[idx]) document.querySelectorAll('.demo-pill')[idx].classList.add('active');
  window.scrollTo(0,0);
}

// animated vitals and helper scripts are present in the full demo file in root; iframe will run them.
</script>
</body>
</html>`;

import { useEffect, useRef } from 'react';

export default function Demo(){
  const iframeRef = useRef(null);

  useEffect(()=>{
    function handleMessage(e){
      if(!e?.data) return;
      if(e.data.type === 'triggerFilePicker'){
        // create file input in parent, upload to backend, then post result back
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf,.doc,.docx,.txt';
        input.onchange = async ()=>{
          const file = input.files?.[0];
          if(!file) return;
          const form = new FormData();
          const email = 'demo@example.com';
          form.append('email', email);
          form.append('file', file);
          try{
            const res = await fetch('http://127.0.0.1:8000/candidates/upload', { method: 'POST', body: form });
            const json = await res.json();
            // send result back to iframe
            if(iframeRef.current && iframeRef.current.contentWindow){
              iframeRef.current.contentWindow.postMessage({ type: 'uploadResult', payload: json }, '*');
            }
          }catch(err){
            if(iframeRef.current && iframeRef.current.contentWindow){
              iframeRef.current.contentWindow.postMessage({ type: 'uploadResult', payload: { error: String(err) } }, '*');
            }
          }
        };
        // trigger file picker
        input.click();
      }
    }
    window.addEventListener('message', handleMessage);
    return ()=> window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      title="SmartHire demo"
      srcDoc={demoHTML}
      style={{width:'100%',height:'calc(100vh - 64px)',border:'0'}}
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
    />
  );
}

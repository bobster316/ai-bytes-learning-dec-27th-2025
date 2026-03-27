import { CompletedLesson } from '../types/course-upgrade';

/**
 * Generates premium SYNAPSE-design HTML for lessons.
 * Matches the synapse_lesson_v2 reference template:
 *  - Dark void theme with --pulse / --iris accent system
 *  - Animated neural-network canvas hero
 *  - Three-column layout (left sidebar, main, right sidebar)
 *  - Objective card, callout blocks, image-text rows
 *  - Key Terms accordion
 *  - Interactive quiz section with XP feedback
 *  - Confetti on quiz completion
 */
export function generateLessonHTML(lessonData: CompletedLesson): string {
  const content = (lessonData as any).content || {};
  const topicContent = (lessonData as any).topicContent || content.topicContent || (typeof content === 'string' ? content : '');
  const keyTakeaways = lessonData.metadata?.keyTakeaways || ((lessonData as any).keyTakeaway ? [(lessonData as any).keyTakeaway] : (content.keyTakeaway ? [content.keyTakeaway] : []));
  const nextTeaser = (lessonData as any).nextLessonTeaser || (lessonData as any).nextTopicTeaser || content.nextTopicTeaser || '';
  const duration = lessonData.metadata?.estimatedDuration || 7;
  const objective = (lessonData as any).learningObjective || content.learningObjective || keyTakeaways[0] || '';
  const quizItems = ((lessonData as any).quiz || content.quiz || []) as Array<{
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
  }>;
  const keyTerms = ((lessonData as any).keyTerms || content.keyTerms || []) as Array<{
    term: string;
    definition: string;
  }>;
  const sections = ((lessonData as any).sections || content.sections || []) as Array<{
    heading?: string;
    body: string;
    imageUrl?: string;
    imageCaption?: string;
    callout?: { type: 'tip' | 'warn'; title: string; body: string };
  }>;
  const blocks = ((lessonData as any).blocks || content.blocks || ((lessonData as any).content_blocks) || []) as Array<any>;

  /* ── helpers ──────────────────────────────────────────────── */
  const esc = (s: any) =>
    String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  const md = (s: string): string => {
    let h = esc(s);
    h = h.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    h = h.replace(/\*(.*?)\*/g, '<em>$1</em>');
    h = h.replace(/`(.*?)`/g, '<code>$1</code>');
    return h;
  };

  const renderBody = (text: string): string => {
    if (!text) return '';
    const lines = text.split('\n');
    let html = '';
    let inUl = false;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) { if (inUl) { html += '</ul>'; inUl = false; } continue; }
      if (line.startsWith('## ')) {
        if (inUl) { html += '</ul>'; inUl = false; }
        html += `<h2 class="s-head">${md(line.slice(3))}</h2>`;
      } else if (line.startsWith('### ')) {
        if (inUl) { html += '</ul>'; inUl = false; }
        html += `<h3 class="s-sub">${md(line.slice(4))}</h3>`;
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inUl) { html += '<ul class="body-list">'; inUl = true; }
        html += `<li>${md(line.slice(2))}</li>`;
      } else {
        if (inUl) { html += '</ul>'; inUl = false; }
        html += `<p class="body-p">${md(line)}</p>`;
      }
    }
    if (inUl) html += '</ul>';
    return html;
  };

  /* ── blocks HTML ────────────────────────────────────────── */
  let sectionsHTML = '';
  if (blocks.length > 0) {
    sectionsHTML = blocks.map((b, i) => {
      let out = '';
      if (b.type === 'text') {
        out += `<div class="text-block" style="margin-bottom: 48px;">`;
        if (b.heading) out += `<h2 class="text-block__heading" style="font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:700;color:var(--white);margin-bottom:20px;padding-left:16px;border-left:3px solid var(--pulse);">${md(b.heading)}</h2>`;
        if (b.text || b.body) out += renderBody(b.text || b.body);
        out += `</div>`;
      } else if (b.type === 'full_image') {
        out += `<div class="full-image">
          ${b.imageUrl ? `<img src="${esc(b.imageUrl)}" />` : `<div class="full-image--placeholder"><div class="full-image--placeholder__inner"><div class="full-image--placeholder__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div><div class="full-image--placeholder__text">${esc(b.imagePrompt || 'Generating Image...')}</div></div></div>`}
          ${b.caption ? `<div class="full-image__caption"><p>${esc(b.caption)}</p></div>` : ''}
        </div>`;
      } else if (b.type === 'image_text_row') {
        out += `<div class="image-text-row ${b.reverse ? 'reverse' : ''}">
          <div class="image-text-row__image">
            ${b.imageUrl ? `<img src="${esc(b.imageUrl)}" />` : `<div class="full-image--placeholder__text" style="padding:20px;text-align:center;">${esc(b.imagePrompt || 'Generating...')}</div>`}
          </div>
          <div>
            ${b.label ? `<div class="image-text-row__label">${esc(b.label)}</div>` : ''}
            ${b.title ? `<div class="image-text-row__title">${md(b.title)}</div>` : ''}
            <div class="image-text-row__text body-p">${renderBody(b.text)}</div>
          </div>
        </div>`;
      } else if (b.type === 'type_cards') {
        out += `<div class="type-cards">
          ${(b.cards || []).map((c: any) => `
            <div class="type-card">
              <div class="type-card__image">
                ${c.imageUrl ? `<img src="${esc(c.imageUrl)}" />` : `<div class="type-card__image-placeholder">${esc(c.imagePrompt || '')}</div>`}
                ${c.badge ? `<span class="type-card__badge badge--${c.badgeColor || 'pulse'}">${esc(c.badge)}</span>` : ''}
              </div>
              <div class="type-card__body">
                <div class="type-card__title">${esc(c.title)}</div>
                <div class="type-card__desc">${md(c.desc)}</div>
              </div>
            </div>
          `).join('')}
        </div>`;
      } else if (b.type === 'industry_tabs') {
        out += `<div class="industry-tabs">
          ${b.heading ? `<h2 class="industry-tabs__heading text-block__heading" style="font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:700;margin-bottom:8px;padding-left:16px;border-left:3px solid var(--amber);">${md(b.heading)}</h2>` : ''}
          ${b.intro ? `<div class="industry-tabs__intro body-p text-slate-400" style="margin-bottom:24px;">${md(b.intro)}</div>` : ''}
          <div class="tab-bar">
            ${(b.tabs || []).map((t: any, idx: number) => `<button class="tab-btn ${idx === 0 ? 'active' : ''}" onclick="document.querySelectorAll('#indGroup${i} .tab-btn').forEach(b=>b.classList.remove('active'));this.classList.add('active');document.querySelectorAll('#indGroup${i} .tab-panel').forEach(p=>p.classList.remove('active'));document.getElementById('indPanel${i}_${idx}').classList.add('active');">${esc(t.label)}</button>`).join('')}
          </div>
          <div id="indGroup${i}">
            ${(b.tabs || []).map((t: any, idx: number) => `
              <div class="tab-panel ${idx === 0 ? 'active' : ''}" id="indPanel${i}_${idx}">
                <div class="tab-panel__image">
                  ${t.imageUrl ? `<img src="${esc(t.imageUrl)}" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" />` : `<div class="type-card__image-placeholder">${esc(t.imagePrompt || '')}</div>`}
                  ${t.caption ? `<div class="tab-panel__image-caption">${esc(t.caption)}</div>` : ''}
                </div>
                <div class="tab-panel__body">
                  <div class="tab-panel__title" style="font-family:'Syne',sans-serif;font-size:16px;font-weight:700;margin-bottom:8px;">${md(t.title)}</div>
                  <div class="tab-panel__text body-p">${renderBody(t.text)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>`;
      } else if (b.type === 'callout') {
        const isWarn = b.title?.toLowerCase().includes('warning') || b.title?.toLowerCase().includes('caution') || b.style === 'warn';
        out += `<div class="callout ${isWarn ? 'callout--warning' : 'callout--tip'}">
          <div class="callout__icon">${isWarn ? '⚠️' : '💡'}</div>
          <div>
            <div class="callout__title">${esc(b.title || '')}</div>
            <div class="callout__body body-p">${md(b.body || b.text || '')}</div>
          </div>
        </div>`;
      } else if (b.type === 'objective') {
        out += `<div class="obj-card" style="margin-bottom: 48px;">
          <div class="obj-lbl">Learning Objective</div>
          <div class="obj-text">${md(b.text || objective || '')}</div>
        </div>`;
      }
      return out;
    }).join('');
  } else {
    sectionsHTML = sections.length > 0
      ? sections.map(sec => {
        let out = '';
        if (sec.heading) out += `<h2 class="s-head">${md(sec.heading)}</h2>`;
        if (sec.callout) {
          out += `<div class="callout ${sec.callout.type === 'warn' ? 'callout--warning' : 'callout--tip'}">
              <div class="callout__icon">${sec.callout.type === 'tip' ? '💡' : '⚠️'}</div>
              <div><div class="callout__title">${esc(sec.callout.title)}</div>
              <div class="callout__body body-p">${md(sec.callout.body)}</div></div>
            </div>`;
        }
        if (sec.imageUrl) {
          out += `<div class="section-image">
              <img src="${esc(sec.imageUrl)}" alt="${esc(sec.heading || '')}">
              ${sec.imageCaption ? `<div class="img-caption"><span>◈</span> ${esc(sec.imageCaption)}</div>` : ''}
            </div>`;
        }
        out += renderBody(sec.body);
        return out;
      }).join('')
      : renderBody(topicContent);
  }

  /* ── quiz HTML ────────────────────────────────────────────── */
  const quizHTML = quizItems.length > 0 ? `
  <section class="quiz-section">
    <div class="quiz-hdr">
      <div class="quiz-hdr-left">
        <div class="quiz-label">Knowledge Check</div>
        <div class="quiz-title">Test your understanding</div>
      </div>
      <div class="quiz-progress">
        <div class="gbar"><div class="gfill" id="gfill"></div></div>
      </div>
    </div>
    <div class="quiz-steps">
      ${quizItems.map((q, qi) => `
        <div class="step-dot ${qi === 0 ? 'on' : ''}" id="p${qi}"></div>
      `).join('')}
    </div>
    ${quizItems.map((q, qi) => `
      <div class="qcard ${qi === 0 ? 'active' : ''}" id="qc${qi}">
        <div class="q-num">Q${qi + 1} of ${quizItems.length}</div>
        <div class="q-text">${md(q.question)}</div>
        <div class="q-opts">
          ${q.options.map((opt, oi) => `
            <div class="q-opt" onclick="selOpt(this,${qi},${oi === q.correctIndex})">${md(opt)}</div>
          `).join('')}
        </div>
        <div class="q-actions">
          <button class="btn-check" id="ck${qi}" disabled onclick="chk(${qi})">Check Answer</button>
        </div>
        <div class="fb-box" id="fb${qi}">
          ${q.explanation ? esc(q.explanation) : ''}
        </div>
      </div>
    `).join('')}
    <div class="donecard" id="donecard">
      <div class="done-title">🎉 Complete!</div>
      <div class="done-score">You scored <span id="fscore">0/${quizItems.length}</span></div>
      <div class="done-msg">Keep up the great work!</div>
    </div>
  </section>
  <div class="confetti" id="cft"></div>
  ` : '';

  /* ── key terms HTML ───────────────────────────────────────── */
  const keyTermsHTML = keyTerms.length > 0 ? `
  <section class="kt-section">
    <h2 class="s-head">Key Terms</h2>
    <div class="kt-list">
      ${keyTerms.map(kt => `
        <div class="kt-item" onclick="togTerm(this)">
          <div class="kt-term">${md(kt.term)} <span>+</span></div>
          <div class="kt-def">${md(kt.definition)}</div>
        </div>
      `).join('')}
    </div>
  </section>
  ` : '';

  /* ── takeaways HTML ───────────────────────────────────────── */
  const takeawaysHTML = keyTakeaways.length > 0 ? `
  <section class="takeaways">
    <h2 class="s-head">Key Takeaways</h2>
    <ul class="takeaway-list">
      ${keyTakeaways.map((t: string) => `<li><span class="tk-dot">✦</span>${md(t)}</li>`).join('')}
    </ul>
  </section>
  ` : '';

  /* ── teaser HTML ──────────────────────────────────────────── */
  const teaserHTML = nextTeaser ? `
  <div class="teaser">
    <span class="teaser-lbl">Coming up</span>
    <span class="teaser-text">${esc(nextTeaser)}</span>
  </div>
  ` : '';

  /* ── full HTML ────────────────────────────────────────────── */
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(lessonData.lessonTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --void:#161B33;--obsidian:#1C2242;--carbon:#242B4A;--slate:#2A3250;--mist:#353F63;
  --silver:#8997bd;--ghost:#d2d8e8;--white:#F0F0FF;
  --pulse:#00FFB3;--pulse-dim:rgba(0,255,179,0.09);--pulse-glow:rgba(0,255,179,0.35);
  --iris:#4b98ad;--iris-dim:rgba(155,143,255,0.09);--iris-glow:rgba(155,143,255,0.35);
  --amber:#FFB347;--amber-dim:rgba(255,179,71,0.09);
  --nova:#FF6B6B;--nova-dim:rgba(255,107,107,0.10);--cyan:#00D4FF;
  --r:14px;--r-lg:22px;--r-xl:32px;
}
*{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{
  background:var(--void);color:var(--white);
  font-family:'Syne',sans-serif;min-height:100vh;overflow-x:hidden;
  -webkit-font-smoothing:antialiased;
}
body::before{
  content:'';position:fixed;inset:0;pointer-events:none;z-index:0;
  background:
    radial-gradient(ellipse 70% 50% at 12% 8%,rgba(0,255,179,.045) 0%,transparent 65%),
    radial-gradient(ellipse 55% 45% at 88% 82%,rgba(155,143,255,.055) 0%,transparent 60%),
    radial-gradient(ellipse 40% 50% at 50% 50%,rgba(255,107,107,.02) 0%,transparent 70%);
}
body>*{position:relative;z-index:1;}
::selection{background:rgba(0,255,179,.25);color:var(--white);}

/* NAV */
nav{
  display:flex;align-items:center;justify-content:space-between;
  padding:13px 28px;border-bottom:1px solid rgba(255,255,255,.05);
  background:rgba(4,4,11,.88);backdrop-filter:blur(28px);
  position:sticky;top:0;z-index:200;
}
.nav-brand{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--ghost);}
.nav-dot{width:7px;height:7px;border-radius:50%;background:var(--pulse);box-shadow:0 0 12px var(--pulse-glow);animation:breathe 2.5s ease-in-out infinite;}
@keyframes breathe{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.5);opacity:.45;}}
.nav-pill{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;padding:5px 12px;border-radius:20px;font-family:'DM Mono',monospace;}
.nav-pill.xp{background:var(--pulse-dim);border:1px solid rgba(0,255,179,.18);color:var(--pulse);}
.nav-pill.streak{background:var(--amber-dim);border:1px solid rgba(255,179,71,.18);color:var(--amber);}
.nav-right{display:flex;align-items:center;gap:14px;}

/* PROGRESS BAR */
.global-bar{height:3px;background:var(--slate);position:sticky;top:56px;z-index:199;}
.global-fill{height:100%;width:8%;background:linear-gradient(90deg,var(--pulse),var(--iris));transition:width .6s cubic-bezier(.4,0,.2,1);position:relative;}
.global-fill::after{content:'';position:absolute;right:-1px;top:-3px;width:8px;height:8px;border-radius:50%;background:var(--pulse);box-shadow:0 0 10px var(--pulse-glow);}

/* LAYOUT */
.layout{display:grid;grid-template-columns:250px 1fr 272px;max-width:1420px;margin:0 auto;min-height:calc(100vh - 60px);}
@media(max-width:1100px){.layout{grid-template-columns:1fr;}.sidebar-l,.sidebar-r{display:none;}}

/* SIDEBAR LEFT */
.sidebar-l{border-right:1px solid rgba(255,255,255,.04);padding:22px 16px;position:sticky;top:59px;height:calc(100vh - 59px);overflow-y:auto;scrollbar-width:none;}
.sidebar-l::-webkit-scrollbar{display:none;}
.s-label{font-size:9px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--silver);margin-bottom:12px;padding-left:4px;}
.les-item{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:var(--r);cursor:pointer;transition:all .2s;position:relative;margin-bottom:3px;}
.les-item.active{background:var(--pulse-dim);border:1px solid rgba(0,255,179,.15);}
.les-item.active::before{content:'';position:absolute;left:0;top:6px;bottom:6px;width:3px;background:var(--pulse);border-radius:0 3px 3px 0;}
.les-item.locked{opacity:.3;cursor:not-allowed;}
.les-info{flex:1;min-width:0;}
.les-title{font-size:11px;font-weight:600;color:var(--ghost);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.les-item.active .les-title{color:var(--pulse);}
.les-dur{font-size:9px;color:var(--silver);margin-top:2px;font-family:'DM Mono',monospace;}

/* MAIN */
.main{padding:32px 40px 80px;max-width:820px;}

/* NEURAL NETWORK HERO */
.nn-stage{position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:var(--r-xl) var(--r-xl) 0 0;background:var(--obsidian);cursor:crosshair;}
#nnCanvas{position:absolute;inset:0;width:100%;height:100%;}
.nn-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(22,27,51,.05) 0%,rgba(22,27,51,0) 30%,rgba(22,27,51,.55) 75%,var(--void) 100%);pointer-events:none;}
.nn-content{position:absolute;bottom:70px;left:26px;right:26px;pointer-events:none;z-index:5;}
.nn-badge-row{display:flex;gap:8px;margin-bottom:10px;}
.nn-badge{display:inline-flex;align-items:center;gap:6px;font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--ghost);background:rgba(0,0,0,.5);backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.1);padding:4px 11px;border-radius:20px;}
.nn-badge-live{color:var(--pulse);}
.nn-title{font-size:28px;font-weight:800;color:var(--white);line-height:1.15;letter-spacing:-.02em;margin-bottom:8px;}
.nn-title em{font-family:'Instrument Serif',serif;font-style:italic;color:var(--pulse);font-weight:400;}
.nn-sub{font-size:13px;color:var(--ghost);line-height:1.55;max-width:480px;font-family:'Instrument Serif',serif;}
.nn-modes{position:absolute;bottom:14px;left:26px;display:flex;gap:6px;z-index:5;}
.nn-mode{display:flex;align-items:center;gap:6px;padding:7px 14px;border-radius:20px;border:1.5px solid rgba(255,255,255,.1);background:rgba(0,0,0,.45);backdrop-filter:blur(12px);color:var(--ghost);font-size:10.5px;font-weight:700;cursor:pointer;transition:all .25s;letter-spacing:.03em;}
.nn-mode.active{border-color:rgba(0,255,179,.4);background:rgba(0,255,179,.1);color:var(--pulse);}
.nn-stats{position:absolute;bottom:14px;right:26px;display:flex;gap:16px;z-index:5;}
.nn-stat{text-align:center;}
.nn-stat span{display:block;font-size:18px;font-weight:800;font-family:'DM Mono',monospace;color:var(--white);line-height:1;}
.nn-stat small{font-size:8px;color:var(--silver);text-transform:uppercase;letter-spacing:.1em;font-weight:700;}

/* LESSON HEADER */
.lesson-tag{display:inline-flex;align-items:center;gap:6px;font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--pulse);border:1px solid rgba(0,255,179,.25);padding:4px 12px;border-radius:20px;margin-bottom:14px;background:var(--pulse-dim);}
.tag-dot{width:4px;height:4px;border-radius:50%;background:var(--pulse);}
h1.l-title{font-size:36px;font-weight:800;line-height:1.1;letter-spacing:-.03em;color:var(--white);margin-bottom:11px;}
.meta-row{display:flex;align-items:center;gap:16px;margin-bottom:30px;flex-wrap:wrap;}
.meta-chip{display:flex;align-items:center;gap:5px;font-size:11px;color:var(--silver);font-weight:600;}

/* OBJECTIVE CARD */
.obj-card{background:linear-gradient(135deg,rgba(0,255,179,.05),rgba(155,143,255,.03));border:1px solid rgba(0,255,179,.15);border-radius:var(--r-lg);padding:18px 22px;margin-bottom:34px;position:relative;overflow:hidden;}
.obj-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--pulse),var(--iris),transparent);}
.obj-lbl{font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--pulse);margin-bottom:8px;}
.obj-text{font-size:14px;line-height:1.65;color:var(--ghost);font-family:'Instrument Serif',serif;}
.obj-text strong{color:var(--white);font-family:'Syne',sans-serif;font-weight:700;font-size:13px;}

/* BODY */
h2.s-head{font-size:19px;font-weight:700;color:var(--white);margin:32px 0 15px;display:flex;align-items:center;gap:11px;}
h2.s-head::before{content:'';width:20px;height:3px;background:linear-gradient(90deg,var(--pulse),var(--iris));border-radius:2px;flex-shrink:0;}
h3.s-sub{font-size:15px;font-weight:700;color:var(--iris);margin:22px 0 10px;}
.body-p{font-family:'Instrument Serif',serif;font-size:16.5px;line-height:1.8;color:var(--ghost);margin-bottom:15px;}
.body-p strong{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:var(--white);}
.body-list{margin:0 0 18px 22px;color:var(--ghost);font-family:'Instrument Serif',serif;font-size:15px;line-height:1.75;}
.body-list li{margin-bottom:8px;}
code{background:var(--slate);padding:2px 6px;border-radius:5px;font-family:'DM Mono',monospace;font-size:.85em;color:#FF6B9D;}

/* SECTION IMAGE */
.section-image{width:100%;border-radius:var(--r-lg);overflow:hidden;margin-bottom:26px;position:relative;border:1px solid rgba(255,255,255,.06);}
.section-image img{width:100%;height:auto;display:block;}
.section-image .img-caption{position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(4,4,11,.88));padding:26px 18px 12px;font-size:11px;color:var(--ghost);font-family:'DM Mono',monospace;}
.section-image .img-caption span{color:var(--pulse);}

/* CALLOUT */
.callout{border-radius:var(--r);padding:15px 17px;margin-bottom:22px;display:flex;gap:13px;align-items:flex-start;}
.callout.tip{background:var(--pulse-dim);border:1px solid rgba(0,255,179,.15);}
.callout.warn{background:var(--amber-dim);border:1px solid rgba(255,179,71,.15);}
.callout-ico{font-size:16px;flex-shrink:0;}
.callout-ttl{font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;}
.callout.tip .callout-ttl{color:var(--pulse);}
.callout.warn .callout-ttl{color:var(--amber);}
.callout-body{font-size:12.5px;color:var(--ghost);line-height:1.55;font-family:'Instrument Serif',serif;}

/* KEY TAKEAWAYS */
.takeaways{margin:40px 0;padding:24px 26px;background:rgba(155,143,255,.05);border:1px solid rgba(155,143,255,.15);border-radius:var(--r-lg);}
.takeaway-list{list-style:none;margin-top:14px;}
.takeaway-list li{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;font-family:'Instrument Serif',serif;font-size:15px;color:var(--ghost);line-height:1.6;}
.tk-dot{color:var(--pulse);flex-shrink:0;margin-top:2px;}

/* KEY TERMS */
.kt-section{margin:40px 0;}
.kt-list{display:flex;flex-direction:column;gap:8px;}
.kt-item{border-radius:var(--r);border:1px solid rgba(255,255,255,.07);background:var(--carbon);overflow:hidden;cursor:pointer;}
.kt-term{display:flex;justify-content:space-between;align-items:center;padding:13px 17px;font-size:14px;font-weight:600;color:var(--white);}
.kt-term span{color:var(--silver);font-size:18px;font-weight:300;}
.kt-def{display:none;padding:0 17px 14px;font-family:'Instrument Serif',serif;font-size:14px;color:var(--ghost);line-height:1.6;border-top:1px solid rgba(255,255,255,.05);}
.kt-item.open .kt-def{display:block;}
.kt-item.open .kt-term{color:var(--pulse);}
.kt-item.open .kt-term span{color:var(--pulse);}

/* QUIZ */
.quiz-section{margin:48px 0;border:1px solid rgba(255,255,255,.07);border-radius:var(--r-xl);overflow:hidden;background:var(--carbon);}
.quiz-hdr{padding:22px 26px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;align-items:center;}
.quiz-label{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--pulse);margin-bottom:4px;}
.quiz-title{font-size:18px;font-weight:800;color:var(--white);}
.gbar{width:120px;height:5px;background:var(--slate);border-radius:3px;overflow:hidden;}
.gfill{height:100%;width:8%;background:linear-gradient(90deg,var(--pulse),var(--iris));transition:width .5s ease;}
.quiz-steps{display:flex;gap:6px;padding:14px 26px 0;}
.step-dot{width:8px;height:8px;border-radius:50%;background:var(--slate);transition:all .3s;}
.step-dot.on{background:var(--iris);box-shadow:0 0 8px var(--iris-glow);}
.step-dot.done{background:var(--pulse);}
.qcard{display:none;padding:26px;}
.qcard.active{display:block;}
.q-num{font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--silver);margin-bottom:12px;}
.q-text{font-size:17px;font-weight:700;color:var(--white);line-height:1.45;margin-bottom:20px;}
.q-opts{display:flex;flex-direction:column;gap:9px;margin-bottom:20px;}
.q-opt{padding:13px 17px;border-radius:var(--r);border:1.5px solid rgba(255,255,255,.1);background:var(--slate);font-size:14px;color:var(--ghost);cursor:pointer;transition:all .2s;}
.q-opt:hover:not(.dis){border-color:rgba(155,143,255,.5);background:var(--iris-dim);color:var(--white);}
.q-opt.sel{border-color:rgba(155,143,255,.6);background:var(--iris-dim);color:var(--white);}
.q-opt.ok{border-color:rgba(0,255,179,.5);background:var(--pulse-dim);color:var(--pulse);}
.q-opt.ng{border-color:rgba(255,107,107,.5);background:var(--nova-dim);color:var(--nova);}
.q-opt.dis{cursor:default;}
.q-actions{display:flex;gap:10px;align-items:center;}
.btn-check{padding:10px 22px;border-radius:20px;border:none;background:linear-gradient(135deg,var(--pulse),var(--iris));color:var(--void);font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:opacity .2s;}
.btn-check:disabled{opacity:.35;cursor:not-allowed;}
.btn-next{padding:10px 22px;border-radius:20px;border:1.5px solid rgba(0,255,179,.4);background:transparent;color:var(--pulse);font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;}
.fb-box{display:none;margin-top:16px;padding:15px 17px;border-radius:var(--r);font-size:13px;line-height:1.6;font-family:'Instrument Serif',serif;}
.fb-box.show{display:block;}
.fb-box.ok-fb{background:var(--pulse-dim);border:1px solid rgba(0,255,179,.2);color:var(--ghost);}
.fb-box.ng-fb{background:var(--nova-dim);border:1px solid rgba(255,107,107,.2);color:var(--ghost);}
.fb-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.fb-lbl{font-family:'Syne',sans-serif;font-size:12px;font-weight:700;color:var(--white);}
.fb-xp{font-family:'DM Mono',monospace;font-size:11px;color:var(--pulse);font-weight:700;}
.fb-exp strong{color:var(--white);font-family:'Syne',sans-serif;}
.donecard{display:none;text-align:center;padding:40px 26px;}
.donecard.show{display:block;}
.done-title{font-size:32px;margin-bottom:10px;}
.done-score{font-size:22px;font-weight:800;color:var(--white);margin-bottom:6px;}
.done-msg{font-size:14px;color:var(--silver);}

/* TEASER */
.teaser{margin:40px 0;padding:16px 20px;border-top:1px solid rgba(255,255,255,.07);display:flex;align-items:center;gap:12px;}
.teaser-lbl{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--pulse);flex-shrink:0;}
.teaser-text{font-size:13px;color:var(--silver);font-family:'Instrument Serif',serif;font-style:italic;}

/* SIDEBAR RIGHT */
.sidebar-r{border-left:1px solid rgba(255,255,255,.04);padding:22px 16px;position:sticky;top:59px;height:calc(100vh - 59px);overflow-y:auto;scrollbar-width:none;}
.sidebar-r::-webkit-scrollbar{display:none;}
.sr-card{background:var(--carbon);border:1px solid rgba(255,255,255,.06);border-radius:var(--r-lg);padding:16px;margin-bottom:14px;}
.sr-lbl{font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--silver);margin-bottom:10px;}
.sr-note{font-size:12px;color:var(--ghost);line-height:1.55;font-family:'Instrument Serif',serif;}

/* CONFETTI */
.confetti{position:fixed;inset:0;pointer-events:none;z-index:9999;display:none;}
.confetti.on{display:block;}
/* V2 BLOCK COMPONENTS */
.full-image { position: relative; border-radius: var(--r-lg); overflow: hidden; margin-bottom: 48px; aspect-ratio: 16/9; background: var(--carbon); }
.full-image img { width: 100%; height: 100%; object-fit: cover; }
.full-image__caption { position: absolute; bottom: 0; left: 0; right: 0; padding: 32px 24px 20px; background: linear-gradient(to top, rgba(5,5,10,0.95), transparent); }
.full-image__caption p { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--silver); letter-spacing: 0.02em; }
.full-image--placeholder { display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--carbon), var(--slate)); border: 1px solid rgba(255,255,255,0.06); width:100%; height:100%; }
.full-image--placeholder__inner { text-align: center; padding: 40px; }
.full-image--placeholder__icon { width: 48px; height: 48px; margin: 0 auto 16px; border-radius: 50%; background: var(--pulse-glow); display: flex; align-items: center; justify-content: center; }
.full-image--placeholder__icon svg { width: 24px; height: 24px; color: var(--pulse); }
.full-image--placeholder__text { font-family: 'DM Mono', monospace; font-size: 12px; color: var(--silver); max-width: 320px; line-height: 1.5; }

.type-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 48px; }
.type-card { border-radius: var(--r-lg); overflow: hidden; background: var(--carbon); border: 1px solid rgba(255,255,255,0.06); transition: border-color 0.3s, transform 0.3s; }
.type-card:hover { border-color: rgba(255,255,255,0.12); transform: translateY(-4px); }
.type-card__image { aspect-ratio: 16/10; background: var(--slate); display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative; }
.type-card__image img { width: 100%; height: 100%; object-fit: cover; }
.type-card__image-placeholder { font-family: 'DM Mono', monospace; font-size: 11px; color: var(--silver); text-align: center; padding: 12px; }
.type-card__badge { position: absolute; top: 10px; left: 10px; padding: 4px 10px; border-radius: 100px; font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; }
.badge--pulse { background: var(--pulse-glow); color: var(--pulse); border: 1px solid rgba(0,255,179,0.2); }
.badge--iris { background: var(--iris-glow); color: var(--iris); border: 1px solid rgba(155,143,255,0.2); }
.badge--amber { background: var(--amber-glow); color: var(--amber); border: 1px solid rgba(255,179,71,0.2); }
.type-card__body { padding: 18px 16px; }
.type-card__title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: var(--white); margin-bottom: 8px; }
.type-card__desc { font-family: 'Instrument Serif', serif; font-size: 14px; color: var(--silver); line-height: 1.5; }

.image-text-row { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center; margin-bottom: 48px; }
.image-text-row.reverse { direction: rtl; }
.image-text-row.reverse > * { direction: ltr; }
@media (max-width: 700px) { .image-text-row, .image-text-row.reverse { grid-template-columns: 1fr; direction: ltr; } }
.image-text-row__image { aspect-ratio: 4/3; border-radius: var(--r-lg); overflow: hidden; background: var(--carbon); border: 1px solid rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; }
.image-text-row__image img { width: 100%; height: 100%; object-fit: cover; }
.image-text-row__label { font-family: 'DM Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--iris); margin-bottom: 8px; }
.image-text-row__title { font-family: 'Syne', sans-serif; font-size: 1.3rem; font-weight: 700; color: var(--white); margin-bottom: 12px; }

.callout { display: flex; gap: 16px; padding: 24px; border-radius: var(--r-lg); margin-bottom: 48px; border: 1px solid rgba(255,255,255,0.06); }
.callout--tip { background: rgba(0, 255, 179, 0.04); border-left: 3px solid var(--pulse); }
.callout--warning { background: rgba(255, 179, 71, 0.04); border-left: 3px solid var(--amber); }
.callout__icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px; }
.callout--tip .callout__icon { background: var(--pulse-glow); }
.callout--warning .callout__icon { background: var(--amber-glow); }
.callout__title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; color: var(--white); margin-bottom: 6px; }

.industry-tabs { margin-bottom: 48px; }
.tab-bar { display: flex; gap: 4px; margin-bottom: 20px; background: var(--carbon); border-radius: var(--r); padding: 4px; border: 1px solid rgba(255,255,255,0.06); overflow-x: auto; scrollbar-width: none; }
.tab-bar::-webkit-scrollbar { display: none; }
.tab-btn { flex: 1; min-width: 0; padding: 10px 16px; border: none; border-radius: 6px; background: transparent; color: var(--silver); font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.04em; cursor: pointer; transition: all 0.2s; white-space: nowrap; text-align: center; }
.tab-btn:hover { background: rgba(255,255,255,0.04); color: var(--ghost); }
.tab-btn.active { background: var(--slate); color: var(--white); box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
.tab-panel { display: none; border-radius: var(--r-lg); overflow: hidden; background: var(--carbon); border: 1px solid rgba(255,255,255,0.06); }
.tab-panel.active { display: block; }
.tab-panel__image { aspect-ratio: 16/7; background: var(--slate); position: relative; display: flex; align-items: center; justify-content: center; }
.tab-panel__image-caption { position: absolute; bottom: 0; left: 0; right: 0; padding: 20px 24px 14px; background: linear-gradient(to top, rgba(5,5,10,0.9), transparent); font-family: 'DM Mono', monospace; font-size: 11px; color: var(--silver); }
.tab-panel__body { padding: 24px; }

@keyframes fall{to{transform:translateY(100vh) translateX(var(--dx)) rotate(720deg);opacity:0;}}
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <div class="nav-brand"><div class="nav-dot"></div>AI Bytes Learning</div>
  <div class="nav-right">
    <div class="nav-pill streak">🔥 Streak</div>
    <div class="nav-pill xp">⚡ XP</div>
  </div>
</nav>
<div class="global-bar"><div class="global-fill" id="globalFill"></div></div>

<div class="layout">

  <!-- LEFT SIDEBAR -->
  <aside class="sidebar-l">
    <div class="s-label">This Lesson</div>
    <div class="les-item active">
      <div class="les-info">
        <div class="les-title">${esc(lessonData.lessonTitle)}</div>
        <div class="les-dur">${duration} min · In progress</div>
      </div>
    </div>
  </aside>

  <!-- MAIN -->
  <main class="main">

    <!-- Neural Network Hero -->
    <div class="nn-stage" id="nnStage">
      <canvas id="nnCanvas"></canvas>
      <div class="nn-overlay"></div>
      <div class="nn-content">
        <div class="nn-badge-row">
          <div class="nn-badge"><span class="nn-badge-live">●</span> Live Demo</div>
          <div class="nn-badge">Interactive</div>
        </div>
        <div class="nn-title">${esc(lessonData.lessonTitle)}</div>
        <div class="nn-sub">Explore the concept through an interactive neural network simulation</div>
      </div>
      <div class="nn-modes">
        <div class="nn-mode active" onclick="setMode(0,this)" data-color="#00FFB3">
          <div class="nn-mode-dot" style="background:#00FFB3"></div>Forward
        </div>
        <div class="nn-mode" onclick="setMode(1,this)" data-color="#4b98ad">
          <div class="nn-mode-dot" style="background:#4b98ad"></div>Backprop
        </div>
        <div class="nn-mode" onclick="setMode(2,this)" data-color="#FFB347">
          <div class="nn-mode-dot" style="background:#FFB347"></div>Inference
        </div>
      </div>
      <div class="nn-stats">
        <div class="nn-stat"><span id="nnAccuracy">92</span><small>Accuracy %</small></div>
        <div class="nn-stat"><span>${duration}</span><small>Min</small></div>
      </div>
    </div>

    <!-- Lesson Header -->
    <div style="padding:26px 0 0;">
      <div class="lesson-tag"><div class="tag-dot"></div>Micro-Learning · ${duration} Min</div>
      <h1 class="l-title">${esc(lessonData.lessonTitle)}</h1>
      <div class="meta-row">
        <div class="meta-chip">🧠 Interactive Lesson</div>
        <div class="meta-chip">📖 ${duration} min read</div>
      </div>
    </div>

    <!-- Objective -->
    ${objective ? `
    <div class="obj-card">
      <div class="obj-lbl">Learning Objective</div>
      <div class="obj-text">${md(objective)}</div>
    </div>
    ` : ''}

    <!-- Body Content -->
    ${sectionsHTML}

    <!-- Key Takeaways -->
    ${takeawaysHTML}

    <!-- Key Terms -->
    ${keyTermsHTML}

    <!-- Quiz -->
    ${quizHTML}

    <!-- Teaser -->
    ${teaserHTML}

  </main>

  <!-- RIGHT SIDEBAR -->
  <aside class="sidebar-r">
    <div class="sr-card">
      <div class="sr-lbl">About this lesson</div>
      <div class="sr-note">${esc(lessonData.lessonTitle)} — ${duration} minute micro-lesson.</div>
    </div>
    ${keyTakeaways.length > 0 ? `
    <div class="sr-card">
      <div class="sr-lbl">Quick Takeaways</div>
      ${keyTakeaways.slice(0, 3).map((t: string) => `<div class="sr-note" style="margin-bottom:8px;">✦ ${esc(t)}</div>`).join('')}
    </div>
    ` : ''}
  </aside>

</div>

<div class="confetti" id="cft"></div>

<script>
// ── NEURAL NETWORK CANVAS ───────────────────────────────────────────
(function(){
  const canvas=document.getElementById('nnCanvas');
  const ctx=canvas.getContext('2d');
  const stage=document.getElementById('nnStage');
  let W,H,nodes=[],links=[],mode=0,accTarget=92;
  const mouse={x:-999,y:-999};
  const colors=[
    {node:'rgba(0,255,179,',link:'rgba(0,255,179,'},
    {node:'rgba(155,143,255,',link:'rgba(155,143,255,'},
    {node:'rgba(255,179,71,',link:'rgba(255,179,71,'}
  ];
  let currentColor=colors[0];

  function resize(){
    const r=stage.getBoundingClientRect();
    W=canvas.width=r.width;H=canvas.height=r.height;
  }

  function createNetwork(){
    nodes=[];links=[];
    const layers=mode===1?[3,5,5,4,2]:[3,5,4,2];
    layers.forEach((count,li)=>{
      for(let i=0;i<count;i++){
        const x=W*(li+1)/(layers.length+1);
        const spacing=H/(count+1);
        nodes.push({x,y:spacing*(i+1)+(Math.random()*10-5),r:4+Math.random()*3,layer:li,active:Math.random()>.3,pulse:Math.random()*Math.PI*2,energy:0});
      }
    });
    for(let a=0;a<nodes.length;a++){
      for(let b=a+1;b<nodes.length;b++){
        if(nodes[b].layer===nodes[a].layer+1){
          links.push({a,b,signal:Math.random(),speed:.004+Math.random()*.008,strength:Math.random()});
        }
      }
    }
  }

  function animate(){
    ctx.clearRect(0,0,W,H);
    nodes.forEach(n=>{
      const dx=mouse.x-n.x,dy=mouse.y-n.y;
      if(Math.sqrt(dx*dx+dy*dy)<60){n.energy=Math.min(1,n.energy+.06);n.active=true;}
      n.pulse+=.03+n.energy*.02;n.energy*=.995;
    });
    links.forEach(l=>{
      const a=nodes[l.a],b=nodes[l.b];
      l.signal=(l.signal+l.speed)%1;
      const alpha=.06+l.strength*.18;
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
      ctx.strokeStyle=currentColor.link+alpha+')';ctx.lineWidth=.8;ctx.stroke();
      if(a.active&&b.active){
        const sx=a.x+(b.x-a.x)*l.signal,sy=a.y+(b.y-a.y)*l.signal;
        ctx.beginPath();ctx.arc(sx,sy,1.5,0,Math.PI*2);
        ctx.fillStyle=currentColor.link+'0.7)';ctx.fill();
      }
    });
    nodes.forEach(n=>{
      const breathe=Math.sin(n.pulse)*.3+.7;
      const r=n.r*breathe*(.8+n.energy*.5);
      ctx.beginPath();ctx.arc(n.x,n.y,r*3,0,Math.PI*2);
      ctx.fillStyle=currentColor.link+(.04*n.energy)+')';ctx.fill();
      ctx.beginPath();ctx.arc(n.x,n.y,r,0,Math.PI*2);
      ctx.fillStyle=n.active?currentColor.node+'0.8)':'rgba(100,100,140,0.35)';
      ctx.globalAlpha=.5+n.energy*.5;ctx.fill();ctx.globalAlpha=1;
    });
    const accEl=document.getElementById('nnAccuracy');
    const cur=parseFloat(accEl.textContent)||0;
    if(Math.abs(cur-accTarget)>.3)accEl.textContent=Math.round(cur+(accTarget-cur)*.04);
    requestAnimationFrame(animate);
  }

  stage.addEventListener('mousemove',e=>{const r=stage.getBoundingClientRect();mouse.x=e.clientX-r.left;mouse.y=e.clientY-r.top;});
  stage.addEventListener('mouseleave',()=>{mouse.x=-999;mouse.y=-999;});
  setInterval(()=>{const i=Math.floor(Math.random()*nodes.length);if(nodes[i])nodes[i].active=!nodes[i].active;},400);
  setInterval(()=>{const lay=Math.floor(Math.random()*(mode===1?5:4));nodes.filter(n=>n.layer===lay).forEach(n=>{n.energy=1;});},1200);

  window.setMode=function(m,btn){
    mode=m;currentColor=colors[m];accTarget=m===0?92:m===1?78:85;
    document.querySelectorAll('.nn-mode').forEach(b=>{b.classList.remove('active');b.style.borderColor='';b.style.background='';b.style.color='';});
    btn.classList.add('active');
    const c=btn.dataset.color;
    btn.style.borderColor=c+'66';btn.style.background=c+'18';btn.style.color=c;
    createNetwork();
  };

  window.addEventListener('resize',()=>{resize();createNetwork();});
  resize();createNetwork();animate();
})();

// ── QUIZ ─────────────────────────────────────────────────────────────
let _score=0;
function selOpt(el,qi,correct){
  const card=document.getElementById('qc'+qi);
  if(card.dataset.done)return;
  card.querySelectorAll('.q-opt').forEach(o=>o.classList.remove('sel'));
  el.classList.add('sel');el._ok=correct;
  document.getElementById('ck'+qi).disabled=false;
}
function chk(qi){
  const card=document.getElementById('qc'+qi);
  if(card.dataset.done)return;
  card.dataset.done='1';
  const sel=card.querySelector('.q-opt.sel');
  if(!sel)return;
  const isOk=sel._ok;
  card.querySelectorAll('.q-opt').forEach(o=>{o.classList.add('dis');if(o._ok)o.classList.add('ok');});
  if(!isOk){sel.classList.remove('sel');sel.classList.add('ng');}else sel.classList.remove('sel');
  if(isOk)_score++;
  const fb=document.getElementById('fb'+qi);
  fb.className='fb-box show '+(isOk?'ok-fb':'ng-fb');
  fb.innerHTML='<div class="fb-row"><div class="fb-lbl">'+(isOk?'✅ Correct!':'❌ Not quite')+'</div>'+(isOk?'<div class="fb-xp">+40 XP</div>':'')+'</div><div class="fb-exp">'+fb.textContent+'</div>';
  document.getElementById('ck'+qi).disabled=true;
  const totalQ=document.querySelectorAll('.qcard').length;
  const actions=card.querySelector('.q-actions');
  const nb=document.createElement('button');nb.className='btn-next';
  if(qi<totalQ-1){nb.innerHTML='Next Question →';nb.onclick=()=>goQ(qi+1);}
  else{nb.innerHTML='See Results →';nb.onclick=showDone;}
  actions.appendChild(nb);
  document.getElementById('p'+qi).classList.add('done');
  document.getElementById('gfill').style.width=((qi+1)/totalQ*100)+'%';
}
function goQ(i){
  document.getElementById('qc'+(i-1)).classList.remove('active');
  document.getElementById('qc'+i).classList.add('active');
  document.getElementById('p'+i).classList.add('on');
  document.getElementById('qc'+i).scrollIntoView({behavior:'smooth',block:'center'});
}
function showDone(){
  document.querySelectorAll('.qcard').forEach(c=>c.classList.remove('active'));
  const totalQ=document.querySelectorAll('.qcard').length;
  document.getElementById('fscore').textContent=_score+'/'+totalQ;
  document.getElementById('donecard').classList.add('show');
  document.getElementById('gfill').style.width='100%';
  launchCft();
}
function launchCft(){
  const c=document.getElementById('cft');c.innerHTML='';c.classList.add('on');
  const cols=['#00FFB3','#4b98ad','#FFB347','#FF6B6B','#FFFFFF','#00D4FF'];
  for(let i=0;i<80;i++){
    const p=document.createElement('div');p.className='cp';
    p.style.left=Math.random()*100+'vw';
    p.style.background=cols[Math.floor(Math.random()*cols.length)];
    p.style.setProperty('--d',(1.3+Math.random())+'s');
    p.style.setProperty('--dl',(Math.random()*.8)+'s');
    p.style.setProperty('--dx',(Math.random()*200-100)+'px');
    c.appendChild(p);
  }
  setTimeout(()=>c.classList.remove('on'),3500);
}

// ── KEY TERMS ─────────────────────────────────────────────────────────
function togTerm(el){
  const was=el.classList.contains('open');
  document.querySelectorAll('.kt-item').forEach(i=>{i.classList.remove('open');i.querySelector('.kt-term span').textContent='+';});
  if(!was){el.classList.add('open');el.querySelector('.kt-term span').textContent='−';}
}

// ── PROGRESS ─────────────────────────────────────────────────────────
document.getElementById('globalFill').style.width='8%';
</script>
</body>
</html>`;
}

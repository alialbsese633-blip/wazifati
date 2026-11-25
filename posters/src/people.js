/* شخصيات مسطحة مرسومة بالكود (بدون صور خارجية) — على شبكة 400×400 داخل دائرة البوستر
   g: 'm' رجل | 'f' امرأة بحجاب. أي لون هنا إما محايد (بشرة/شعر) أو من ألوان الهوية */
const SKIN = { a: ['#C68A62', '#A9704C'], b: ['#A86B4A', '#8C5638'], c: ['#D9A37E', '#BE8762'] };
const HAIR = '#1E1424', LIP = '#6B2E26';

function face(cx, cy, sk) {
  return `
    <path d="M${cx - 24} ${cy - 22}q10-7 20-2M${cx + 4} ${cy - 24}q10-5 20 2" stroke="${HAIR}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <ellipse cx="${cx - 15}" cy="${cy - 6}" rx="5" ry="6.5" fill="${HAIR}"/>
    <ellipse cx="${cx + 15}" cy="${cy - 6}" rx="5" ry="6.5" fill="${HAIR}"/>
    <path d="M${cx + 1} ${cy + 2}q-5 12 3 14" stroke="${sk[1]}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M${cx - 15} ${cy + 26}q15 13 30 0" stroke="${LIP}" stroke-width="4.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="${cx - 28}" cy="${cy + 14}" rx="9" ry="5" fill="#E07A62" opacity=".22"/>
    <ellipse cx="${cx + 28}" cy="${cy + 14}" rx="9" ry="5" fill="#E07A62" opacity=".22"/>`;
}

function torso(x, c, kind, shirt) {
  const body = `<path d="M${x - 150} 440Q${x - 146} 312 ${x - 66} 292Q${x - 30} 282 ${x} 296Q${x + 30} 282 ${x + 66} 292Q${x + 146} 312 ${x + 150} 440Z" fill="${c}"/>`;
  if (kind === 'jacket') return body + `
    <path d="M${x - 30} 284L${x} 330L${x + 30} 284L${x + 14} 440H${x - 14}Z" fill="${shirt}"/>
    <path d="M${x - 34} 284L${x - 2} 360L${x - 48} 330L${x - 40} 300Z" fill="rgba(0,0,0,.22)"/>
    <path d="M${x + 34} 284L${x + 2} 360L${x + 48} 330L${x + 40} 300Z" fill="rgba(0,0,0,.22)"/>`;
  if (kind === 'collar') return body + `
    <path d="M${x - 32} 282L${x} 318L${x - 10} 336L${x - 40} 296Z" fill="${shirt}"/>
    <path d="M${x + 32} 282L${x} 318L${x + 10} 336L${x + 40} 296Z" fill="${shirt}"/>`;
  return body;
}

function man(o, x = 200) {
  const sk = SKIN[o.skin], cy = 186;
  return `
    <rect x="${x - 24}" y="${cy + 30}" width="48" height="72" rx="20" fill="${sk[1]}"/>
    ${torso(x, o.outfit, o.kind || 'collar', o.shirt || '#F6F4FB')}
    <ellipse cx="${x - 54}" cy="${cy + 2}" rx="11" ry="16" fill="${sk[1]}"/>
    <ellipse cx="${x + 54}" cy="${cy + 2}" rx="11" ry="16" fill="${sk[1]}"/>
    <ellipse cx="${x}" cy="${cy}" rx="54" ry="64" fill="${sk[0]}"/>
    <path d="M${x - 58} ${cy - 4}Q${x - 62} ${cy - 84} ${x} ${cy - 86}Q${x + 62} ${cy - 84} ${x + 58} ${cy - 4}Q${x + 52} ${cy - 40} ${x + 30} ${cy - 48}Q${x - 2} ${cy - 30} ${x - 46} ${cy - 40}Q${x - 54} ${cy - 26} ${x - 58} ${cy - 4}Z" fill="${HAIR}"/>
    ${o.beard ? `<path d="M${x - 52} ${cy + 6}Q${x - 48} ${cy + 66} ${x} ${cy + 66}Q${x + 48} ${cy + 66} ${x + 52} ${cy + 6}Q${x + 44} ${cy + 40} ${x + 22} ${cy + 36}Q${x} ${cy + 28} ${x - 22} ${cy + 36}Q${x - 44} ${cy + 40} ${x - 52} ${cy + 6}Z" fill="${HAIR}" opacity=".88"/>` : ''}
    ${face(x, cy, sk)}`;
}

function woman(o, x = 200) {
  const sk = SKIN[o.skin], cy = 184, hj = o.hijab;
  return `
    ${torso(x, o.outfit, o.kind || 'plain', o.shirt || '#F6F4FB')}
    <path d="M${x - 70} ${cy + 6}Q${x - 78} ${cy - 96} ${x} ${cy - 98}Q${x + 78} ${cy - 96} ${x + 70} ${cy + 6}Q${x + 72} ${cy + 70} ${x + 96} ${cy + 116}Q${x + 40} ${cy + 140} ${x} ${cy + 136}Q${x - 40} ${cy + 140} ${x - 96} ${cy + 116}Q${x - 72} ${cy + 70} ${x - 70} ${cy + 6}Z" fill="${hj}"/>
    <path d="M${x - 70} ${cy + 6}Q${x - 78} ${cy - 96} ${x} ${cy - 98}Q${x - 46} ${cy - 70} ${x - 52} ${cy}Z" fill="rgba(255,255,255,.10)"/>
    <ellipse cx="${x}" cy="${cy + 4}" rx="47" ry="58" fill="${sk[0]}"/>
    <path d="M${x - 50} ${cy - 18}Q${x} ${cy - 66} ${x + 50} ${cy - 18}Q${x + 44} ${cy - 62} ${x} ${cy - 64}Q${x - 44} ${cy - 62} ${x - 50} ${cy - 18}Z" fill="${hj}"/>
    ${face(x, cy + 6, sk)}`;
}

// يد تمسك هاتفاً أو ورقة (ذراع بلون الملابس)
function prop(o, accent) {
  const sk = SKIN[o.skin][0];
  if (o.prop === 'phone') return `
    <path d="M330 440Q318 380 300 336" stroke="${o.outfit}" stroke-width="54" fill="none" stroke-linecap="round"/>
    <g transform="rotate(-12 296 300)"><rect x="268" y="250" width="58" height="98" rx="14" fill="#1B1035"/>
    <rect x="274" y="258" width="46" height="74" rx="8" fill="${accent}"/></g>
    <ellipse cx="300" cy="328" rx="22" ry="18" fill="${sk}"/>`;
  if (o.prop === 'paper') return `
    <g transform="rotate(-6 210 360)"><rect x="140" y="300" width="140" height="150" rx="12" fill="#fff"/>
    <rect x="160" y="324" width="70" height="10" rx="5" fill="${accent}"/>
    <rect x="160" y="346" width="100" height="8" rx="4" fill="#D9D4E8"/><rect x="160" y="364" width="84" height="8" rx="4" fill="#D9D4E8"/></g>
    <ellipse cx="146" cy="352" rx="20" ry="17" fill="${sk}"/><ellipse cx="276" cy="340" rx="20" ry="17" fill="${sk}"/>`;
  return '';
}

function person(o, accent) {
  return (o.g === 'f' ? woman(o) : man(o)) + prop(o, accent);
}

function scene(list, accent, id) {
  // list: شخص أو اثنان
  let inner;
  if (list.length === 1) inner = person(list[0], accent);
  else inner = `<g transform="translate(-40 60) scale(.86)">${person(list[0], accent)}</g>
                <g transform="translate(150 70) scale(.82)">${person(list[1], accent)}</g>`;
  return `<svg class="people" viewBox="0 0 400 400"><defs><clipPath id="${id}"><circle cx="200" cy="200" r="200"/></clipPath></defs>
    <g clip-path="url(#${id})">${inner}</g></svg>`;
}

module.exports = { scene };

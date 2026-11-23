/**
 * The document engine — the one place a library document's look is decided.
 *
 * It builds the document as a sequence of A4 sheets: a cover, then body pages,
 * each inside a ruled frame with a footer carrying the page number and the
 * brand bar. Content is laid onto those sheets by measurement, so what a
 * reader sees on screen is what comes out of the printer.
 *
 * Nothing outside this file may set a colour, a size or a margin. If a value
 * is needed it belongs in DOC below and is read from there.
 *
 * What it replaced: six separate cover designs, one per document kind, each
 * with its own line-art motif and its own two-line headline. Kind is routing
 * metadata and now decides nothing about the page.
 */

import { ASHER_LOGO_PNG_DATA_URI } from './asherLogoDataUri';

/** Every value the look depends on. */
export const DOC = {
  colour: {
    brand: '#b80238',
    brandDeep: '#8a0129',
    ink: '#16161a',
    body: '#24242a',
    muted: '#6d6d75',
    frame: '#9a9aa2',
    cell: '#c9c9d0',
    rule: '#b9b9c1',
    wave: '#e4e4ec',
    paper: '#ffffff',
    /** The desk the sheets of paper sit on, in a browser. */
    desk: '#e9e9ea',
    /** A note is a rule and some space. No wash, no tint, no box. */
    noteRule: '#9a9aa2',
  },
  font: {
    sans: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  },
  /*
   * `body` is the anchor and the only absolute size. Everything else is a
   * multiple of it, so the whole document scales from one knob.
   *
   * On paper that knob never moves and these resolve to exactly what they
   * always were: 0.95em of 10pt is 9.5pt. On a phone a host sets the root to
   * something readable and the tables, notes, headings and signature lines
   * follow it. They were absolute points, so a phone got 10pt body text and
   * 9.5pt tables — print sizes on a 390px screen — and the only fix available
   * was a second stylesheet restating every one of them.
   *
   * None of these nest inside each other, so the em values do not compound.
   */
  size: {
    body: '10pt',
    small: '0.95em',
    micro: '0.85em',
    section: '1.3em',
    coverTitle: '1.8em',
    mark: '1.1em',
  },
  page: {
    /** A4 at 96dpi. */
    widthPx: 794,
    heightPx: 1123,
    /** Sheet padding, then the ruled frame's own padding. */
    sheetPad: 34,
    framePadTop: 40,
    framePadSide: 50,
    logoPx: 86,
    /** Where the cover's title block and field list sit. */
    coverBandTop: 150,
    coverFieldsTop: 430,
    print: {
      format: 'A4',
      margin: '0mm',
    },
  },
} as const;

export type DocumentKind =
  | 'handbook'
  | 'agreement'
  | 'notice'
  | 'form'
  | 'guide'
  | 'financial';

/**
 * Whose document this is.
 *
 * A landlord may take an Asher template, edit it and send it under their own
 * name — so the mark on the cover and in the footer is not Asher's by right,
 * it is whoever the document belongs to. Default to Asher and let the caller
 * say otherwise; nothing downstream should hardcode either.
 */
export interface DocumentBrand {
  /** Shown on the cover when there is no logo. */
  name: string;
  /** Short form for the footer bar. Defaults to the name, upper-cased. */
  mark?: string;
  /** Optional. Without one the cover shows the name as a wordmark. */
  /**
   * The logo's image source: a data URI for a logo compiled in, or an https
   * URL for one a landlord has uploaded. Absent means the name is set as a
   * wordmark instead, which is what most landlords will have.
   */
  logoSrc?: string;
}

export const ASHER_BRAND: DocumentBrand = {
  name: 'Asher',
  mark: 'ASHER',
  logoSrc: ASHER_LOGO_PNG_DATA_URI,
};

/** The footer mark, however the brand chose to express itself. */
export function brandMark(brand: DocumentBrand): string {
  return brand.mark ?? brand.name.toUpperCase();
}

export interface DocumentField {
  label: string;
  value: string;
}

export interface DocumentMeta {
  title: string;
  /** Routing metadata only. It does not change the design. */
  kind?: DocumentKind;
  /** The line under the rule in the cover's title block. */
  strapline?: string;
  /** Lower left of the cover: Landlord, Date, Ref. */
  fields?: DocumentField[];
  /** Set false for a fragment with no cover. */
  cover?: boolean;
  /** Whose document this is. Defaults to Asher. */
  brand?: DocumentBrand;
}

/**
 * The writing inside a stored document, free of whatever shell it arrived in.
 *
 * Stored content is not one shape. A document the engine rendered is a whole
 * HTML file; a landlord's saved edit is a fragment out of a rich-text editor;
 * an older record carries a `doc-shell` wrapper and a stylesheet of its own;
 * one saved by the old cover designer has a styled cover baked into it. All of
 * them have to come out as a bare body, or the shells nest and the document
 * renders with two covers and three stylesheets.
 *
 * Anything that reads a stored document back — to show it, to print it, or to
 * open it in an editor — needs this, which is why it is here rather than in
 * one app.
 */
export function documentBodyOf(stored: string): string {
  const source = String(stored ?? '');
  const bodyMatch = source.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const inner = (bodyMatch?.[1] ?? source).trim();

  return inner
    // An engine document wraps its flow in <main id="flow">; take what is inside.
    .replace(/^[\s\S]*?<main id="flow">([\s\S]*)<\/main>[\s\S]*$/i, '$1')
    /*
     * A cover belongs to the shell, and the shell is drawn fresh each time —
     * both the engine's own `<section class="sheet cover">` and the older baked
     * `<section class="cover cover-plain">` that a cover designer used to write
     * into stored content, Asher's mark and all. Leaving either in would render
     * a second, unstyled cover in the middle of the body.
     */
    .replace(/<section\b[^>]*\bclass=["'][^"']*\bcover\b[^"']*["'][^>]*>[\s\S]*?<\/section>/gi, '')
    /*
     * Sheets, contents and footers are NOT stripped, because stored content
     * never holds them: pagination runs in the browser, after this HTML is
     * written. Stripping on a guess would mean deleting real writing from any
     * document that happened to use one of those class names.
     */
    // Legacy wrappers, with the stylesheets and scripts that came with them.
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?div\b[^>]*class="[^"]*(?:doc-shell|doc-body|doc-page|agreement-document-(?:shell|paper|body))[^"]*"[^>]*>/gi, '')
    .trim();
}

/**
 * A document's kind, from its title.
 *
 * Kind is routing metadata, and the one thing it decides about the document is
 * whether the advisory blocks come out — see `isExecutedDocument`. It lived in
 * `content/asher-library/shared/htmlWrapper.ts`, which is reachable only from
 * the library generator, so the admin app that creates these same documents
 * had no way to ask the question and no way to agree with the answer.
 */
export function inferDocumentKind(title: string): DocumentKind {
  const t = String(title || '').toLowerCase();
  if (/agreement|tenancy|lease|deed/.test(t)) return 'agreement';
  if (/notice|section 8|form 4a/.test(t)) return 'notice';
  if (/checklist|inventory|record|report|form|ledger|statement/.test(t)) return 'form';
  if (/handbook/.test(t)) return 'handbook';
  if (/cash flow|reimbursement|financial/.test(t)) return 'financial';
  return 'guide';
}

/**
 * A document's kind from the library category it was filed under, falling back
 * to its title.
 *
 * An explicit category beats a guess at the title, but most categories — Book,
 * Journal, HowTo, FAQ, News — say where a document is shelved rather than what
 * it is, so for those the title is the better signal. Only the categories that
 * genuinely pin the kind are listed.
 */
export function documentKindForCategory(category: string, title: string): DocumentKind {
  switch (String(category || '').toLowerCase()) {
    case 'handbook':
    case 'tenantbook':
      return 'handbook';
    case 'guide':
    case 'tutorial':
    case 'howto':
    case 'faq':
    case 'news':
    case 'journal':
    case 'law':
      return 'guide';
    default:
      // 'Template' and 'Legal' cover agreements, notices and forms alike.
      return inferDocumentKind(title);
  }
}

/**
 * Whether this is a document people put their names to.
 *
 * An agreement, a notice or a deed is executed: the advisory blocks written
 * for the landlord have no place in the copy the parties sign. A guide, a
 * handbook or a form is read, and there those same blocks are the content.
 */
export function isExecutedDocument(kind?: DocumentKind): boolean {
  /*
   * A document that did not say what it is keeps its advisory blocks.
   *
   * `kind` is optional on `DocumentMeta`, so this can be called without one.
   * Of the two ways to be wrong, leaving an advisory note in a contract is
   * visible and fixable; silently deleting paragraphs out of a guide is
   * neither. Every caller in the product sets a kind, so this is the answer to
   * a question nothing asks yet rather than a behaviour anything relies on.
   */
  return kind === 'agreement' || kind === 'notice';
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * The guilloche behind the cover.
 *
 * One wave path reused down the page in two clusters set against each other.
 * Static markup, not drawn by script, so it survives any renderer.
 */
function guilloche(): string {
  const rows = (step: number) =>
    Array.from({ length: 16 }, (_, i) => `<use href="#aw" y="${i * step}"/>`).join('');

  return `<svg class="guilloche" viewBox="0 0 ${DOC.page.widthPx} ${DOC.page.heightPx}" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><path id="aw" d="M-120 90 C 80 -20, 240 170, 430 80 S 720 -30, 940 100"/></defs><g transform="translate(150 -30) rotate(-7 400 300)">${rows(9)}</g><g transform="translate(-230 760) rotate(6 400 300) scale(1.1 1)">${rows(10)}</g></svg>`;
}

/**
 * Shown on a cover that does not name its own.
 *
 * `{{currentDate}}` and `{{applicationId}}` are filled by the template
 * processor for every document it generates, so these are safe everywhere.
 */
export const DEFAULT_COVER_FIELDS: DocumentField[] = [
  { label: 'Date:', value: '{{currentDate}}' },
  { label: 'Ref:', value: '{{applicationId}}' },
];

/**
 * The cover.
 *
 * It carries four things: the logo, the title block, the fields, and the brand
 * bar. No page number — a cover is not page one of the reading, and numbering
 * starts on the first body page.
 */
function coverSheet(meta: DocumentMeta): string {
  const brand = meta.brand ?? ASHER_BRAND;
  const strap = meta.strapline
    ? `<hr /><p class="cover-strap">${meta.strapline}</p>`
    : '';

  /*
   * Every generated document knows when it was made and what it belongs to, so
   * those two are the default. A document that has parties adds them — see the
   * tenancy agreement, which also names the landlord.
   */
  const fields = (meta.fields ?? DEFAULT_COVER_FIELDS)
    .map(
      (f) =>
        `<tr><td class="cf-label">${escapeHtml(f.label)}</td><td class="cf-value">${f.value}</td></tr>`
    )
    .join('');

  return `<section class="sheet cover">
  ${guilloche()}
  <div class="frame">
    ${brand.logoSrc
      ? `<img class="cover-logo" src="${brand.logoSrc}" alt="${escapeHtml(brand.name)}" width="${DOC.page.logoPx}" height="${DOC.page.logoPx}" />`
      : `<p class="cover-wordmark">${escapeHtml(brand.name)}</p>`}
    <div class="cover-band"><h1 class="cover-title">${escapeHtml(meta.title)}</h1>${strap}</div>
    ${fields ? `<table class="cover-fields" role="presentation"><tbody>${fields}</tbody></table>` : ''}
    <div class="foot"><div class="foot-bar"><i></i><b>${escapeHtml(brandMark(brand))}</b></div></div>
  </div>
</section>`;
}

const SHEET_W = DOC.page.widthPx;
const SHEET_H = DOC.page.heightPx;

/**
 * The document stylesheet. Exported so that an in-app viewer, a print path or
 * a landlord preview shows the SAME document the engine renders, instead of
 * carrying a second sheet that drifts from it.
 *
 * Anything that styles a document reads this. Nothing redefines it.
 */
export const DOCUMENT_CSS = `
  :root {
    --brand: ${DOC.colour.brand};
    --brand-deep: ${DOC.colour.brandDeep};
    --ink: ${DOC.colour.ink};
    --body: ${DOC.colour.body};
    --muted: ${DOC.colour.muted};
    --frame: ${DOC.colour.frame};
    --cell: ${DOC.colour.cell};
    --rule: ${DOC.colour.rule};
    --wave: ${DOC.colour.wave};
    --note-rule: ${DOC.colour.noteRule};
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; background: ${DOC.colour.desk}; }
  body {
    font-family: ${DOC.font.sans};
    font-size: ${DOC.size.body};
    line-height: 1.68;
    color: var(--body);
  }
  /*
   * Print the backgrounds.
   *
   * A browser drops background colours when printing unless told otherwise, so
   * without this the red title block, the table header rows and the brand bar
   * all come out white on paper and in a PDF export. What you see would not be
   * what you get, and the document would look broken rather than plain.
   */
  html, body, .sheet, .cover-band, th, .foot-bar i {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ---------- the sheet ---------- */
  .sheet {
    position: relative; overflow: hidden;
    width: ${SHEET_W}px; height: ${SHEET_H}px;
    margin: 0 auto 22px; padding: ${DOC.page.sheetPad}px;
    background: ${DOC.colour.paper};
  }
  .frame {
    position: relative; z-index: 1;
    border: 1px solid var(--frame); height: 100%;
    padding: ${DOC.page.framePadTop}px ${DOC.page.framePadSide}px 0;
    display: flex; flex-direction: column; overflow: hidden;
  }
  /* The footer sits at the foot of the sheet, always. */
  .foot { margin-top: auto; flex: 0 0 auto; padding-bottom: 14px; }
  .foot-num { text-align: center; font-size: ${DOC.size.micro}; color: var(--muted); margin: 0 0 5px; }
  .foot-bar { display: flex; align-items: center; gap: 10px; }
  .foot-bar i { flex: 1 1 auto; height: 7px; background: linear-gradient(90deg, var(--brand-deep), var(--brand)); }
  .foot-bar b { flex: 0 0 auto; font-size: ${DOC.size.mark}; font-weight: 700; letter-spacing: .04em; color: var(--muted); }
  .sheet-body { flex: 1 1 auto; min-height: 0; overflow: hidden; }
  /*
   * The last block on a page carries no bottom margin.
   *
   * A trailing margin is not counted in scrollHeight, so a block could sit a
   * margin's width past the bottom of the page and the paginator would not
   * see it — measured at 9 and 11 pixels of silent overflow on two sheets.
   */
  .sheet-body > :last-child { margin-bottom: 0; }
  /*
   * A single block taller than a page — a long table, a dense schedule — must
   * not be clipped, because clipping loses text from a legal document. Such a
   * sheet grows instead and spills onto the next printed page.
   */
  .sheet.tall { height: auto; min-height: ${SHEET_H}px; }
  .sheet.tall .frame { height: auto; min-height: ${SHEET_H - DOC.page.sheetPad * 2}px; }
  .sheet.tall .sheet-body { overflow: visible; }

  /* ---------- cover ---------- */
  .guilloche { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .guilloche use { stroke: var(--wave); fill: none; stroke-width: .75; }
  .cover-wordmark {
    margin: 0; font-size: 20pt; font-weight: 700; letter-spacing: -.01em;
    color: var(--brand-deep);
  }
  .cover-logo { display: block; width: ${DOC.page.logoPx}px; height: ${DOC.page.logoPx}px; }
  .cover-band {
    background: var(--brand-deep); color: #fff;
    margin: ${DOC.page.coverBandTop}px auto 0; padding: 24px 34px;
    width: -moz-fit-content; width: fit-content; max-width: 76%;
  }
  h1.cover-title {
    font-size: ${DOC.size.coverTitle}; font-weight: 700; line-height: 1.4;
    margin: 0 auto; max-width: 26ch; text-align: center; color: #fff;
  }
  .cover-band hr { border: 0; border-top: 1px solid rgba(255,255,255,.6); margin: 16px 0 14px; }
  .cover-strap { text-align: center; font-size: 10.5pt; color: #fff; margin: 0; line-height: 1.55; }
  table.cover-fields { margin-top: ${DOC.page.coverFieldsTop}px; border-collapse: collapse; }
  table.cover-fields td { border: 0; padding: 0 14px 9px 0; vertical-align: top; }
  .cf-label { font-size: 10pt; font-weight: 700; color: var(--brand-deep); white-space: nowrap; }
  .cf-value { font-size: 10pt; }

  /* ---------- the shape of an agreement ---------- */
  .sec { display: flex; gap: 13px; align-items: baseline; margin: 26px 0 13px; }
  .sec:first-child { margin-top: 0; }
  .sec-no, .sec-h { font-size: ${DOC.size.section}; font-weight: 700; color: var(--ink); }
  .sec-h { margin: 0; }
  .cl { display: flex; gap: 10px; margin: 0 0 9px; align-items: baseline; }
  .cl-no { flex: 0 0 40px; font-variant-numeric: tabular-nums; }
  .cl-bd { flex: 1 1 auto; min-width: 0; }
  .cl-bd > :last-child { margin-bottom: 0; }
  /* A list inside a clause is lettered, as sub-paragraphs of it. */
  .cl-bd ul, .cl-bd ol { list-style-type: lower-alpha; margin: 7px 0 0; padding-left: 24px; }

  /* ---------- contents ---------- */
  .toc-h { font-size: 14pt; font-weight: 700; color: var(--brand-deep); margin: 0 0 24px; }
  .toc-row { display: flex; align-items: baseline; gap: 12px; font-size: 10.5pt; padding: 9px 0; }
  .toc-row .n { flex: 0 0 34px; font-variant-numeric: tabular-nums; }
  .toc-row .t { flex: 0 1 auto; }
  .toc-row .d { flex: 1 1 auto; min-width: 24px; height: 0; border-bottom: 1px dotted var(--rule); transform: translateY(-4px); }
  .toc-row .p { flex: 0 0 auto; font-variant-numeric: tabular-nums; color: var(--muted); }

  h2 { font-size: ${DOC.size.section}; font-weight: 700; color: var(--ink); margin: 26px 0 13px; border: 0; padding: 0; }
  h3 { font-size: 11pt; font-weight: 700; color: var(--ink); margin: 18px 0 7px; }
  p { margin: 0 0 10px; }
  ul, ol { margin: 0 0 13px; padding-left: 26px; }
  li { display: list-item; margin: 0 0 7px; }
  .subtitle { color: var(--muted); font-size: ${DOC.size.small}; margin: 0 0 22px; }

  table { width: 100%; border-collapse: collapse; margin: 6px 0 16px; font-size: ${DOC.size.small}; }
  th { background: var(--brand-deep); color: #fff; text-align: left; font-size: 9pt; font-weight: 700; padding: 6px 9px; border: 1px solid var(--brand-deep); }
  td { border: 1px solid var(--cell); padding: 7px 9px; vertical-align: top; line-height: 1.55; }
  /*
   * A money column. Figures in a financial document line up on the decimal
   * point and do not wrap, so a reader can run an eye down a column and see
   * which number is the larger — which is the whole reason the column exists.
   */
  .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
  /* The line under a document's title naming who and what period it covers. */
  .meta { color: var(--muted); margin: 0 0 14px; }

  /*
   * A note is a paragraph. The left rule made it read as a pull-quote or a
   * review comment, which is not what a statement in a contract is.
   */
  .notice, .guidance, .warning, .rules-box {
    background: none; border: 0; padding: 0; margin: 0 0 10px;
    font-size: inherit; line-height: inherit;
  }
  .checklist td:first-child { width: 28px; text-align: center; }
  .violation-table td:first-child { width: 28%; font-weight: 700; }
  .pdf-blank { display: inline-block; min-width: 7em; border-bottom: 1px solid var(--ink); height: .95em; }
  .sig-grid { display: table; width: 100%; border-collapse: separate; border-spacing: 26px 0; margin-top: 26px; }
  .sig-grid > * { display: table-cell; vertical-align: top; width: 50%; }
  .sig-line { border-top: 1px solid var(--ink); margin-top: 44px; padding-top: 6px; font-size: ${DOC.size.micro}; color: var(--muted); }

  /* ---------- print ---------- */
  /*
   * What you see is what prints.
   *
   * The sheet is already A4 at 96dpi, and carries its own margin as padding,
   * so the page box takes no margin of its own. One sheet becomes exactly one
   * sheet of paper, with the same frame, the same footer and the same breaks
   * as on screen — including a PDF saved from the print dialog.
   */
  @page { size: ${DOC.page.print.format}; margin: ${DOC.page.print.margin}; }
  @media print {
    html, body { background: #fff; width: ${SHEET_W}px; }
    .sheet {
      margin: 0 auto; page-break-after: always; break-after: page;
      page-break-inside: avoid; break-inside: avoid;
      width: ${SHEET_W}px; height: ${SHEET_H}px; overflow: hidden;
    }
    /* A grown sheet may span pages; it must not be forced to one. */
    .sheet.tall { height: auto; page-break-inside: auto; break-inside: auto; overflow: visible; }
    .sheet:last-child { page-break-after: auto; break-after: auto; }
    /* Nothing inside a sheet may invent a break of its own. */
    .frame, .sheet-body, .cl, .sec, table, .sig-grid { page-break-inside: avoid; break-inside: avoid; }
    #flow { display: none; }
  }

  /* Before the sheets are built, and if script never runs. */
  #flow { width: ${SHEET_W}px; margin: 0 auto; padding: ${DOC.page.sheetPad + DOC.page.framePadTop}px ${DOC.page.sheetPad + DOC.page.framePadSide}px; background: ${DOC.colour.paper}; }
`;

/**
 * The client script.
 *
 * Two passes. First it gives the content the shape of an agreement: the
 * section number is lifted out beside its title, and the paragraphs beneath
 * become 4.1, 4.2 and so on. Then it lays those blocks onto sheets by
 * measuring, so a page break never lands inside a paragraph, and numbers the
 * sheets — which is the only way to get a page number at all, since
 * counter(page) needs @page margin boxes that Chromium does not implement.
 *
 * Numbering starts on the first body page. The cover is not page one.
 *
 * If anything throws, the flow is left exactly as the content file wrote it
 * and still prints.
 */
function clientScript(mark: string, executed: boolean): string {
  return `<script>(function () {
  var MARK = ${JSON.stringify(mark)};
  var EXECUTED = ${executed ? 'true' : 'false'};
  var flow = document.getElementById('flow');
  if (!flow) return;

  /*
   * Give the content the shape of an agreement.
   *
   * The section number is lifted out beside its title so "clause 7" is a thing
   * a reader can find. Items of an <ol> become numbered clauses, because an
   * ordered list IS an enumeration the draftsman made — 7.1 to 7.10 of the
   * tenant's obligations.
   *
   * Loose paragraphs are left as prose. Numbering them 4.1, 4.2 by where the
   * paragraph breaks happen to fall is not clause numbering, it is a number
   * stuck on a sentence, and it reads as nonsense when a section holds one
   * paragraph and gets a lone "4.1".
   *
   * Sub-headings, notices and tables are left exactly where the author put
   * them.
   */
  /*
   * Take the advisory blocks out of the executed document.
   *
   * .notice and .guidance are addressed to the landlord, not to the parties:
   * "before signing, ensure deposit protection", "seek legal advice if
   * unsure", "fixed terms cannot be used in England". None of it is a term
   * either party agrees to, and a contract that tells its own signatories to
   * take legal advice reads as a draft rather than an agreement.
   *
   * The wording stays in the content files, so it can be surfaced to the
   * landlord before they generate the document. It just does not go into the
   * thing people sign.
   *
   * Only out of a document people SIGN. In a guide or a handbook the notices
   * ARE the content — "you cannot be charged for this", "ask before you do
   * that" — and stripping them empties the document of the very thing a
   * tenant opened it to read. Nine of them vanished out of one tenant-library
   * book before this was conditional.
   */
  if (EXECUTED) {
    Array.prototype.slice.call(flow.querySelectorAll('.notice, .guidance'))
      .forEach(function (el) { el.parentNode.removeChild(el); });
  }

  function restructure(root) {
    /*
     * Pass one: every heading becomes a section.
     *
     * This has to finish before anything is numbered. Replacing a heading and
     * immediately walking forward for the next one does not work, because the
     * following headings are still raw <h2> at that moment — the walk runs
     * straight past every section boundary and numbers the whole document as
     * section 1.
     */
    Array.prototype.slice.call(root.querySelectorAll('h2')).forEach(function (h2) {
      var text = h2.textContent.trim();
      var m = text.match(/^(\\d+[a-z]?)[.)]?\\s+(.+?)$/i);
      var sec = document.createElement('div');
      sec.className = 'sec';
      var a = document.createElement('span');
      a.className = 'sec-no'; a.textContent = m ? m[1] : '';
      var b = document.createElement('h2');
      b.className = 'sec-h'; b.textContent = m ? m[2] : text;
      sec.appendChild(a); sec.appendChild(b);
      if (/^(schedule|annex|appendix|part)\\b/i.test(text)) sec.setAttribute('data-break', 'before');
      h2.parentNode.replaceChild(sec, h2);
    });

    /*
     * Pass two: number the enumerated items in each section, restarting at 1.
     *
     * Both <ol> and <ul> at section level become numbered clauses. In an
     * agreement a list of obligations is cited by number, and having some
     * sections numbered and others bulleted — purely because of which tag the
     * author reached for — reads as careless.
     */
    Array.prototype.slice.call(root.querySelectorAll('.sec')).forEach(function (sec) {
      var no = sec.querySelector('.sec-no').textContent;
      if (!no) return;
      var n = 0, node = sec.nextElementSibling;
      while (node && !(node.classList && node.classList.contains('sec'))) {
        var next = node.nextElementSibling;
        if ((node.tagName === 'OL' || node.tagName === 'UL') && !node.className) {
          Array.prototype.slice.call(node.children).forEach(function (li) {
            n += 1;
            var cl = document.createElement('div'); cl.className = 'cl';
            var cn = document.createElement('span'); cn.className = 'cl-no';
            cn.textContent = no + '.' + n;
            var bd = document.createElement('div'); bd.className = 'cl-bd';
            var para = document.createElement('p');
            while (li.firstChild) para.appendChild(li.firstChild);
            bd.appendChild(para);
            cl.appendChild(cn); cl.appendChild(bd);
            node.parentNode.insertBefore(cl, node);
          });
          node.parentNode.removeChild(node);
        }
        node = next;
      }
    });
  }

  function sheet() {
    var s = document.createElement('section');
    s.className = 'sheet';
    s.innerHTML = '<div class="frame"><div class="sheet-body"></div>' +
      /*
       * The page number's line must take up its space from the start. Left
       * empty it has no height, so the body is measured 17px taller than it
       * ends up once the numbers are filled in — and every sheet overflows by
       * exactly the height of that line.
       */
      '<div class="foot"><p class="foot-num">&nbsp;</p>' +
      '<div class="foot-bar"><i></i><b></b></div></div></div>';
    s.querySelector('.foot-bar b').textContent = MARK;
    return s;
  }

  function paginate(root, holder) {
    var sheets = [];
    function add() {
      var s = sheet();
      holder.appendChild(s);
      sheets.push(s);
      return s.querySelector('.sheet-body');
    }
    var body = add(), guard = 0;

    /*
     * Measure the last block's real bottom edge, margin included, against the
     * page's.
     *
     * scrollHeight leaves out a trailing bottom margin, and zeroing that
     * margin only moves the problem: a block measured while it is last has no
     * margin, then gets one back the moment another is appended after it. Both
     * showed up as sheets overflowing by a margin's width.
     */
    function over() {
      if (body.scrollHeight > body.clientHeight) return true;
      var last = body.lastElementChild;
      if (!last) return false;
      var mb = parseFloat(getComputedStyle(last).marginBottom) || 0;
      return (last.getBoundingClientRect().bottom + mb) >
             (body.getBoundingClientRect().bottom + 0.5);
    }

    while (root.firstChild && guard++ < 5000) {
      var node = root.firstChild;
      if (node.nodeType === 1 && node.getAttribute &&
          node.getAttribute('data-break') === 'before' && body.childNodes.length) {
        body = add();
      }
      body.appendChild(node);
      if (node.nodeType !== 1 || !over() || body.childNodes.length === 1) continue;

      body.removeChild(node);
      var carry = null, last = body.lastElementChild;
      if (last && last.classList && last.classList.contains('sec')) {
        carry = last; body.removeChild(last);
      }
      body = add();
      if (carry) body.appendChild(carry);
      body.appendChild(node);
      if (over() && body.childNodes.length === (carry ? 2 : 1)) {
        body.parentNode.parentNode.classList.add('tall');
      }
    }
    /*
     * Correction pass.
     *
     * Measuring while filling is subject to margins that appear and disappear
     * as blocks move — a block has no bottom margin while it is last and gets
     * one back when another follows it. Rather than keep refining the
     * prediction, settle it afterwards: walk the finished sheets and push the
     * last block of any that still overflows onto the next one, until none
     * does. This runs against final layout, so it cannot be fooled.
     */
    for (var pass = 0; pass < 12; pass++) {
      var moved = false;
      for (var k = 0; k < sheets.length; k++) {
        var bd = sheets[k].querySelector('.sheet-body');
        var spins = 0;
        while (bd.scrollHeight > bd.clientHeight && bd.children.length > 1 && spins++ < 40) {
          var tail = bd.lastElementChild;
          var nextSheet = sheets[k + 1];
          if (!nextSheet) {
            var ns = sheet();
            holder.appendChild(ns);
            sheets.push(ns);
            nextSheet = ns;
          }
          var nb = nextSheet.querySelector('.sheet-body');
          nb.insertBefore(tail, nb.firstChild);
          moved = true;
        }
        // One block alone and still too tall: let the sheet grow, never clip.
        if (bd.scrollHeight > bd.clientHeight && bd.children.length <= 1) {
          sheets[k].classList.add('tall');
        }
      }
      if (!moved) break;
    }

    return sheets;
  }

  /*
   * The contents, built from the sections that exist and the pages they landed
   * on. A contents page that promises a section the document does not contain,
   * or a page number that is not where the section is, is worse than none.
   */
  function contents(sheets, offset, holder) {
    var rows = [];
    sheets.forEach(function (s, i) {
      Array.prototype.slice.call(s.querySelectorAll('.sec')).forEach(function (sec) {
        rows.push({
          no: sec.querySelector('.sec-no').textContent,
          title: sec.querySelector('.sec-h').textContent,
          page: i + 1 + offset
        });
      });
    });
    if (rows.length < 3) return [];

    var pages = [], body = null;
    function add() {
      var s = sheet();
      /*
       * In the document while it is filled, or it has no layout: clientHeight
       * reads 0, the overflow check never fires and every row lands on one
       * sheet. Measured at 415px of overflow with all 32 rows on one page.
       */
      holder.appendChild(s);
      pages.push(s);
      body = s.querySelector('.sheet-body');
      var h = document.createElement('p');
      h.className = 'toc-h'; h.textContent = 'Contents';
      body.appendChild(h);
    }
    add();
    rows.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'toc-row';
      row.innerHTML = '<span class="n"></span><span class="t"></span>' +
        '<span class="d"></span><span class="p"></span>';
      row.querySelector('.n').textContent = r.no;
      row.querySelector('.t').textContent = r.title;
      row.querySelector('.p').textContent = String(r.page);
      body.appendChild(row);
      if (body.scrollHeight > body.clientHeight + 1) {
        body.removeChild(row);
        add();
        body.appendChild(row);
      }
    });
    return pages;
  }

  var PAGES = 0;

  function start() {
  try {
    restructure(flow);

    var holder = document.createElement('div');
    flow.parentNode.insertBefore(holder, flow);
    var sheets = paginate(flow, holder);
    flow.parentNode.removeChild(flow);

    /*
     * Contents is front matter, like the cover: it carries no page number, and
     * numbering starts on the first page of the agreement itself. That is also
     * why the pages it names need no offset — body page 1 is body page 1
     * however many sheets the contents runs to.
     */
    var toc = contents(sheets, 0, holder);
    for (var i = toc.length - 1; i >= 0; i--) holder.insertBefore(toc[i], holder.firstChild);

    PAGES = sheets.length;
    for (var j = 0; j < sheets.length; j++) {
      sheets[j].querySelector('.foot-num').textContent =
        'Page ' + (j + 1) + ' of ' + sheets.length;
    }
  } catch (e) {}

  report();
  }

  /*
   * Tell a host how tall the document came out.
   *
   * A viewer shows this in an iframe, which has to be sized to its content or
   * it scrolls inside the page. Reading the height from outside needs the
   * same-origin sandbox flag, and granting that alongside the scripts flag
   * would let this script reach into the app that embedded it. So the document
   * measures itself and posts the number out, and the iframe can stay
   * sandboxed with scripts but no same-origin access.
   */
  function report() {
    try {
      var height = Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
      );
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'asher-document', height: height, pages: PAGES }, '*');
      }
    } catch (e) {}
  }

  /*
   * After load, not at parse time.
   *
   * Pagination is measurement, and measurement needs settled layout. Run it
   * synchronously and the cover logo — a data URI — has not been decoded, so
   * heights are read before the page has finished becoming itself. The same
   * correction pass that left two sheets overflowing when it ran early
   * cleared every one of them when run against final layout.
   */
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
}());</script>`;
}

/**
 * The class every document carries, on `<body>` for a rendered page and on the
 * wrapper `<div>` when a document is shown inside the app.
 *
 * It is the same string the agreement shell has always used, so the stored
 * documents that already carry it keep working.
 */
export const DOCUMENT_SCOPE = 'asher-doc';

/**
 * The document stylesheet, confined to one subtree.
 *
 * The sheet is authored for a page of its own, where `body` IS the document.
 * An in-app viewer has to show the same document inside a live React page,
 * where a sheet that styles bare `body`, `h2`, `p` and `table` restyles the
 * application around it. That is why there used to be a SECOND stylesheet for
 * the viewer, a THIRD one of `!important` overrides to beat the second, and a
 * fourth for cover thumbnails: four sheets drifting away from each other, so a
 * landlord's preview never matched what the tenant received.
 *
 * Rewriting the one sheet is what removes the need for the others. Every
 * selector is prefixed, so `p` becomes `.asher-doc p` and cannot reach out;
 * `:root` and `body` become the wrapper itself, so the custom properties and
 * the page's own type settings still land on the document.
 *
 * `@page` is left alone — it describes the sheet of paper, not an element, and
 * prefixing it would void the print geometry.
 */
export function scopedDocumentCss(scope: string = DOCUMENT_SCOPE): string {
  const dot = `.${scope}`;

  const prefix = (selectorList: string): string =>
    selectorList
      .split(',')
      .map(part => {
        const sel = part.trim();
        if (!sel) return '';
        // Custom properties and the page's own type have to land on the wrapper.
        if (sel === ':root' || sel === 'html' || sel === 'body') return dot;
        if (sel === '*') return `${dot}, ${dot} *`;
        if (sel.startsWith(dot)) return sel;
        // `body.x` / `html.x` describe the document element itself.
        const onRoot = sel.match(/^(?:html|body)([.:[][\s\S]*)$/);
        if (onRoot) return `${dot}${onRoot[1]}`;
        return `${dot} ${sel}`;
      })
      .filter(Boolean)
      .join(', ');

  /*
   * Comments come out first, before anything is split on a comma.
   *
   * A comment is prose, and prose contains commas. Left in, the sentence
   * before a rule is read as part of that rule's selector list: the comment
   * above the note rule cost `.notice` its prefix entirely, which put an
   * unscoped `.notice { }` into a sheet whose whole purpose is to be scoped.
   */
  const css = DOCUMENT_CSS.replace(/\/\*[\s\S]*?\*\//g, '');

  let out = '';
  let i = 0;
  let selector = '';

  while (i < css.length) {
    const ch = css[i];

    if (ch === '{') {
      const head = selector.trim();
      selector = '';
      if (head.startsWith('@')) {
        // An at-rule wraps further rules (@media, @supports) or describes the
        // paper (@page). Copy the block through, scoping only the former.
        const block = readBlock(css, i);
        const inner = /^@(?:media|supports|container)\b/.test(head)
          ? scopeRules(block.body, prefix)
          : block.body;
        out += `${head} {${inner}}`;
        i = block.end;
        continue;
      }
      const block = readBlock(css, i);
      out += `${prefix(head)} {${block.body}}`;
      i = block.end;
      continue;
    }

    selector += ch;
    i += 1;
  }

  return out + selector;
}

/** The body of a `{ ... }` starting at `open`, and the index just past it. */
function readBlock(css: string, open: number): { body: string; end: number } {
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    else if (css[i] === '}') {
      depth -= 1;
      if (depth === 0) return { body: css.slice(open + 1, i), end: i + 1 };
    }
  }
  return { body: css.slice(open + 1), end: css.length };
}

/** Scope the rules inside an at-rule block. */
function scopeRules(css: string, prefix: (s: string) => string): string {
  let out = '';
  let selector = '';
  let i = 0;

  while (i < css.length) {
    if (css[i] === '{') {
      const head = selector.trim();
      selector = '';
      const block = readBlock(css, i);
      out += head.startsWith('@')
        ? `${head} {${scopeRules(block.body, prefix)}}`
        : `${prefix(head)} {${block.body}}`;
      i = block.end;
      continue;
    }
    selector += css[i];
    i += 1;
  }

  return out + selector;
}

/**
 * Just the cover, as a standalone page.
 *
 * Library shelves and template cards show a thumbnail of a document's cover.
 * They used to BUILD one — a fourth stylesheet, a hand-written cover and
 * Asher's mark hardcoded into it, so a landlord's own template was shelved
 * under Asher's logo whoever had written it.
 *
 * This is the same cover the document itself opens with, so the thumbnail is
 * the cover rather than a drawing of one. No client script: there is nothing
 * to paginate.
 */
export function coverDocumentHtml(meta: DocumentMeta): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(meta.title)}</title>
  <style>${PAGE_RESET}
${scopedDocumentCss()}
  .${DOCUMENT_SCOPE} .sheet { margin: 0 auto; }</style>
</head>
<body class="${DOCUMENT_SCOPE}">${coverSheet(meta)}</body>
</html>`;
}

/**
 * A saved document shown inside the app: the one sheet, scoped, around a body.
 *
 * This is what a viewer calls. It does not re-style anything, decide a colour
 * or add a wrapper of its own.
 */
export function documentFragmentHtml(bodyHtml: string, scope: string = DOCUMENT_SCOPE): string {
  return `<style>${scopedDocumentCss(scope)}</style><div class="${scope}">${bodyHtml}</div>`;
}

/**
 * The page around the document, for a rendered HTML file.
 *
 * The sheet itself is scoped to the document, so it can no longer reach `html`
 * to paint the desk the sheets of paper sit on. That is page chrome rather than
 * part of the document, and this is the only place it is stated.
 */
const PAGE_RESET = `html, body { margin: 0; background: ${DOC.colour.desk}; }`;

/** Render a complete library document. The only way to produce one. */
export function renderLibraryDocument(
  meta: DocumentMeta,
  bodyHtml: string
): string {
  const cover = meta.cover === false ? '' : coverSheet(meta);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(meta.title)}</title>
  <style>${PAGE_RESET}
${scopedDocumentCss()}</style>
</head>
<body class="${DOCUMENT_SCOPE}">
  ${cover}
  <main id="flow">${bodyHtml}</main>
  ${clientScript(brandMark(meta.brand ?? ASHER_BRAND), isExecutedDocument(meta.kind))}
</body>
</html>`;
}

/** A signature block, as the content files expect it. */
export function signatureBlock(label: string, nameHtml: string): string {
  return `<div><p class="sig-line">${escapeHtml(label)}</p><p>${nameHtml}</p></div>`;
}

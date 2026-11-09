/**
 * Export PPTX (PowerPoint) d'une création — sans dépendance.
 *
 * Un `.pptx` est lui aussi une archive OOXML : présentation, masque, mise en
 * page, thème et une diapositive par section (`#`/`##`). Le contenu reste du
 * texte (titres, puces, code), mis en page 16:9 — ouvrable et modifiable dans
 * PowerPoint, LibreOffice et Google Slides.
 */
import { creerZip, type FichierZip } from './zip.js';
import { echapperXml } from './docx.js';
import type { Bloc, DocumentLisible } from './blocs.js';

type Paragraphe = { texte: string; puce?: boolean; taille: number; gras?: boolean; mono?: boolean };
type Diapositive = { titre: string; paragraphes: Paragraphe[] };

const MAX_DIAPOSITIVES = 60;

/* ── Fragments DrawingML ── */

function p(paragraphe: Paragraphe): string {
  const taille = Math.round(paragraphe.taille * 100);
  const proprietes = [
    paragraphe.puce ? '<a:pPr marL="285750" indent="-285750"><a:buChar char="•"/></a:pPr>' : '',
    `<a:r><a:rPr lang="fr-FR" sz="${taille}"${paragraphe.gras ? ' b="1"' : ''}${
      paragraphe.mono ? ' dirty="0"' : ''
    }>${paragraphe.mono ? '<a:latin typeface="Consolas"/>' : ''}</a:rPr><a:t>${echapperXml(
      paragraphe.texte,
    )}</a:t></a:r>`,
  ].join('');
  return `<a:p>${proprietes}</a:p>`;
}

function zone(id: number, nom: string, x: number, y: number, cx: number, cy: number, paragraphes: Paragraphe[]): string {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="${nom}"/><p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr><p:txBody><a:bodyPr wrap="square" rtlCol="0"><a:normAutofit/></a:bodyPr><a:lstStyle/>${paragraphes
    .map(p)
    .join('')}</p:txBody></p:sp>`;
}

function diapositiveXml(diapo: Diapositive): string {
  const corps = diapo.paragraphes.length
    ? diapo.paragraphes
    : [{ texte: '', taille: 20 }];
  const zones = [
    zone(2, 'Titre', 838200, 609600, 10515600, 1600200, [
      { texte: diapo.titre, taille: 32, gras: true },
    ]),
    zone(3, 'Contenu', 838200, 2400000, 10515600, 3700000, corps),
  ].join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/>${zones}</p:spTree></p:cSld></p:sld>`;
}

/* ── Découpage du document en diapositives ── */

export function diapositives(doc: DocumentLisible): Diapositive[] {
  const liste: Diapositive[] = [
    {
      titre: doc.titre,
      paragraphes: [{ texte: doc.sousTitre, taille: 16 }],
    },
  ];
  let courante: Diapositive | null = null;

  const nouvelle = (titre: string): Diapositive => {
    const creee: Diapositive = { titre, paragraphes: [] };
    courante = creee;
    liste.push(creee);
    return creee;
  };

  for (const bloc of doc.blocs as Bloc[]) {
    if (bloc.type === 'titre' && bloc.niveau <= 2) {
      if (liste.length >= MAX_DIAPOSITIVES) break;
      nouvelle(bloc.texte);
      continue;
    }
    if (!courante) {
      if (liste.length >= MAX_DIAPOSITIVES) break;
      nouvelle(doc.titre);
    }
    const cible: Diapositive = courante ?? nouvelle(doc.titre);
    switch (bloc.type) {
      case 'titre':
        cible.paragraphes.push({ texte: bloc.texte, taille: 20, gras: true });
        break;
      case 'puce':
        cible.paragraphes.push({ texte: bloc.texte, taille: 18, puce: true });
        break;
      case 'numerote':
        cible.paragraphes.push({ texte: bloc.texte, taille: 18 });
        break;
      case 'citation':
        cible.paragraphes.push({ texte: bloc.texte, taille: 18 });
        break;
      case 'tableau':
        cible.paragraphes.push({
          texte: bloc.entetes.filter(Boolean).join('   '),
          taille: 14,
          gras: true,
        });
        for (const ligne of bloc.lignes.slice(0, 12)) {
          cible.paragraphes.push({ texte: ligne.filter(Boolean).join('   '), taille: 13 });
        }
        break;
      case 'code':
        for (const ligne of bloc.texte.split('\n').slice(0, 12)) {
          cible.paragraphes.push({ texte: ligne || ' ', taille: 12, mono: true });
        }
        break;
      case 'paragraphe':
        cible.paragraphes.push({ texte: bloc.texte, taille: 18 });
        break;
      default:
        break;
    }
  }

  if (liste.length >= MAX_DIAPOSITIVES) {
    liste.push({
      titre: 'Suite du document',
      paragraphes: [
        {
          texte:
            'Ce document contient davantage de sections que la présentation ne peut en afficher. La suite figure dans les exports Word et PDF.',
          taille: 16,
        },
      ],
    });
  }

  return liste.slice(0, MAX_DIAPOSITIVES + 1);
}

/* ── Parties OOXML ── */

const THEME = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Aura"><a:themeElements><a:clrScheme name="Aura"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="1B1B1B"/></a:dk2><a:lt2><a:srgbClr val="F5F5F3"/></a:lt2><a:accent1><a:srgbClr val="1F4E5F"/></a:accent1><a:accent2><a:srgbClr val="C2703D"/></a:accent2><a:accent3><a:srgbClr val="7A8B99"/></a:accent3><a:accent4><a:srgbClr val="4E6E58"/></a:accent4><a:accent5><a:srgbClr val="8C6A8C"/></a:accent5><a:accent6><a:srgbClr val="B08968"/></a:accent6><a:hlink><a:srgbClr val="1F4E5F"/></a:hlink><a:folHlink><a:srgbClr val="7A8B99"/></a:folHlink></a:clrScheme><a:fontScheme name="Aura"><a:majorFont><a:latin typeface="Calibri Light"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Calibri"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme><a:fmtScheme name="Aura"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;

const MASQUE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>`;

const MISE_EN_PAGE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Vide"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr/></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;

const RELS = (elements: Array<{ id: string; type: string; cible: string }>) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${elements
  .map(
    (e) =>
      `<Relationship Id="${e.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/${e.type}" Target="${e.cible}"/>`,
  )
  .join('')}</Relationships>`;

export function creerPptx(doc: DocumentLisible): Buffer {
  const diapos = diapositives(doc);

  const types = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
${diapos
  .map(
    (_d, i) =>
      `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  )
  .join('\n')}
</Types>`;

  const presentation = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${diapos
    .map((_d, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`)
    .join('')}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;

  const fichiers: FichierZip[] = [
    { nom: '[Content_Types].xml', donnees: Buffer.from(types, 'utf8') },
    {
      nom: '_rels/.rels',
      donnees: Buffer.from(
        RELS([{ id: 'rId1', type: 'officeDocument', cible: 'ppt/presentation.xml' }]),
        'utf8',
      ),
    },
    { nom: 'ppt/presentation.xml', donnees: Buffer.from(presentation, 'utf8') },
    {
      nom: 'ppt/_rels/presentation.xml.rels',
      donnees: Buffer.from(
        RELS([
          { id: 'rId1', type: 'slideMaster', cible: 'slideMasters/slideMaster1.xml' },
          ...diapos.map((_d, i) => ({
            id: `rId${i + 2}`,
            type: 'slide',
            cible: `slides/slide${i + 1}.xml`,
          })),
        ]),
        'utf8',
      ),
    },
    { nom: 'ppt/slideMasters/slideMaster1.xml', donnees: Buffer.from(MASQUE, 'utf8') },
    {
      nom: 'ppt/slideMasters/_rels/slideMaster1.xml.rels',
      donnees: Buffer.from(
        RELS([
          { id: 'rId1', type: 'slideLayout', cible: '../slideLayouts/slideLayout1.xml' },
          { id: 'rId2', type: 'theme', cible: '../theme/theme1.xml' },
        ]),
        'utf8',
      ),
    },
    { nom: 'ppt/slideLayouts/slideLayout1.xml', donnees: Buffer.from(MISE_EN_PAGE, 'utf8') },
    {
      nom: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels',
      donnees: Buffer.from(
        RELS([{ id: 'rId1', type: 'slideMaster', cible: '../slideMasters/slideMaster1.xml' }]),
        'utf8',
      ),
    },
    { nom: 'ppt/theme/theme1.xml', donnees: Buffer.from(THEME, 'utf8') },
    ...diapos.flatMap((d, i) => [
      { nom: `ppt/slides/slide${i + 1}.xml`, donnees: Buffer.from(diapositiveXml(d), 'utf8') },
      {
        nom: `ppt/slides/_rels/slide${i + 1}.xml.rels`,
        donnees: Buffer.from(
          RELS([{ id: 'rId1', type: 'slideLayout', cible: '../slideLayouts/slideLayout1.xml' }]),
          'utf8',
        ),
      },
    ]),
  ];

  return creerZip(fichiers);
}

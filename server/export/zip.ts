/**
 * Écriture ZIP minimale (méthode « stored », sans compression).
 *
 * Un .docx n'est qu'une archive ZIP de parties XML. Plutôt que d'ajouter une
 * dépendance et son poids dans la fonction serverless, on écrit l'archive
 * nous-mêmes : en-têtes locaux, répertoire central et fin de répertoire.
 * Aucune compression (méthode 0) — les documents texte pèsent quelques
 * dizaines de kilo-octets, et tout lecteur ZIP accepte le mode « stored ».
 */

const TABLE_CRC = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32(donnees: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < donnees.length; i += 1) {
    c = TABLE_CRC[(c ^ donnees[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

export type FichierZip = { nom: string; donnees: Buffer };

/* Date DOS fixe (1ᵉʳ janvier 2020) : une archive reproductible vaut mieux
   qu'un horodatage qui change à chaque test. */
const HEURE_DOS = 0;
const DATE_DOS = ((2020 - 1980) << 9) | (1 << 5) | 1;

export function creerZip(fichiers: FichierZip[]): Buffer {
  const locaux: Buffer[] = [];
  const centraux: Buffer[] = [];
  let decalage = 0;

  for (const fichier of fichiers) {
    const nom = Buffer.from(fichier.nom, 'utf8');
    const crc = crc32(fichier.donnees);
    const taille = fichier.donnees.length;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4); // version requise
    local.writeUInt16LE(0x0800, 6); // noms en UTF-8
    local.writeUInt16LE(0, 8); // méthode : stored
    local.writeUInt16LE(HEURE_DOS, 10);
    local.writeUInt16LE(DATE_DOS, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(taille, 18); // taille compressée
    local.writeUInt32LE(taille, 22); // taille réelle
    local.writeUInt16LE(nom.length, 26);
    local.writeUInt16LE(0, 28); // champ « extra »
    locaux.push(local, nom, fichier.donnees);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); // signature
    central.writeUInt16LE(20, 4); // version d'écriture
    central.writeUInt16LE(20, 6); // version requise
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(HEURE_DOS, 12);
    central.writeUInt16LE(DATE_DOS, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(taille, 20);
    central.writeUInt32LE(taille, 24);
    central.writeUInt16LE(nom.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // commentaire
    central.writeUInt16LE(0, 34); // disque
    central.writeUInt16LE(0, 36); // attributs internes
    central.writeUInt32LE(0, 38); // attributs externes
    central.writeUInt32LE(decalage, 42); // décalage de l'en-tête local
    centraux.push(central, nom);

    decalage += local.length + nom.length + taille;
  }

  const repertoire = Buffer.concat(centraux);
  const fin = Buffer.alloc(22);
  fin.writeUInt32LE(0x06054b50, 0); // signature
  fin.writeUInt16LE(0, 4);
  fin.writeUInt16LE(0, 6);
  fin.writeUInt16LE(fichiers.length, 8);
  fin.writeUInt16LE(fichiers.length, 10);
  fin.writeUInt32LE(repertoire.length, 12);
  fin.writeUInt32LE(decalage, 16);
  fin.writeUInt16LE(0, 20); // commentaire

  return Buffer.concat([...locaux, repertoire, fin]);
}

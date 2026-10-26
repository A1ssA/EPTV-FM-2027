import { describe, expect, it } from "vitest";
import { calculerLigneAgent, evaluerParametresMission } from "../../src/domain/calculs.js";
import {
  ajouterJoursISO, excelDATEDIF_D, excelNETWORKDAYS_INTL_7, excelTimeDecimal, formaterISOversFR, parserISO,
} from "../../src/utils/dates.js";
import { creerEntreeSdmpvm } from "../../src/services/personnelDb.js";
import { chargerOriginal } from "../helpers/loadOriginal.js";

const orig = chargerOriginal();

// Dates couvrant week-ends, fin de mois / d'année, année bissextile
const debuts = ["2024-02-27", "2026-01-01", "2026-03-31", "2026-11-04", "2026-11-05", "2026-11-06", "2026-11-07", "2026-12-30", "2027-02-26"];
const fins = ["2024-03-02", "2026-01-02", "2026-04-05", "2026-11-05", "2026-11-06", "2026-11-07", "2026-11-08", "2026-11-12", "2027-01-03", "2027-03-01", "2026-10-01", ""];
const heures = ["12:00", "15:00", "20:00", "00:00", "14:45", "14:46", "18:46", "18:47", "", "23:59", "9:5"];

describe("dates : identiques à l'original", () => {
  it("formatage / ajout de jours / décimal d'heure", () => {
    for (const d of [...debuts, ...fins, "2024-02-28", "2026-12-31"]) {
      if (!d) continue;
      expect(formaterISOversFR(d)).toBe(orig.formaterISOversFR(d));
      for (const n of [-40, -1, 0, 1, 2, 30, 366]) expect(ajouterJoursISO(d, n)).toBe(orig.ajouterJoursISO(d, n));
    }
    expect(formaterISOversFR("")).toBe(orig.formaterISOversFR(""));
    for (const h of heures) expect(excelTimeDecimal(h)).toBe(orig.excelTimeDecimal(h));
  });

  it("DATEDIF et NETWORKDAYS.INTL(…,7)", () => {
    for (const a of debuts) for (const b of fins) {
      const [da, db] = [parserISO(a), parserISO(b)];
      expect(excelDATEDIF_D(da, db)).toBe(orig.excelDATEDIF_D(orig.parserISO(a), orig.parserISO(b)));
      expect(excelNETWORKDAYS_INTL_7(da, db)).toBe(orig.excelNETWORKDAYS_INTL_7(orig.parserISO(a), orig.parserISO(b)));
    }
  });
});

describe("règles métier : identiques à l'original", () => {
  it("evaluerParametresMission sur toute la grille dates × heures × zone × taux", () => {
    let n = 0;
    for (const a of debuts) for (const b of fins) for (const h of heures) for (const zone of ["NORD", "SUD"]) for (const taux of ["1", "0.4", "", "abc"]) {
      Object.assign(orig.__valeurs, { dateDebutPicker: a, dateFinPicker: b, cellN4_HeureFin: h, cellAI1_Zone: zone, cellAK1_Taux: taux });
      const attendu = orig.evaluerParametresMission();
      const obtenu = evaluerParametresMission({ dateDebutISO: a, dateFinISO: b, heureFin: h, zone, taux });
      expect(obtenu).toEqual(attendu);
      n++;
    }
    expect(n).toBeGreaterThan(5000);
  });

  it("calculerLigneAgent sur toute la grille catégorie × matricule × jours × repas × zone × taux", () => {
    const cats = ["", "/", " / ", "abc", "0", "900", "1049", "1050", "1051", "1100", "1500", "1050.5", "-5", " 1200 "];
    const mats = ["", "CONV", "conv", " Conv ", "12345", "CONVX"];
    let n = 0;
    for (const cat of cats) for (const mat of mats) for (const nj of [0, 1, 2.5, 7, 30]) for (const nr of [0, 1, 2, 14])
      for (const zone of ["NORD", "SUD"]) for (const taux of [1, 0.4]) for (const pp of [0, 400, 2800]) {
        const params = { zoneAI1: zone, tauxAK1: taux, AG7_ppStandard: pp };
        expect(calculerLigneAgent(cat, mat, nj, nr, params)).toEqual(orig.calculerLigneAgent(cat, mat, nj, nr, params));
        n++;
      }
    expect(n).toBeGreaterThan(10000);
  });

  it("creerEntreeSdmpvm (format stocké dans le localStorage)", () => {
    for (const cat of ["1049", "1050", "1051", "/", "abc", " 1200 ", 1300]) {
      expect(creerEntreeSdmpvm(" benali  karim ", " REAL ", 123, cat)).toEqual(orig.creerEntreeSdmpvm(" benali  karim ", " REAL ", 123, cat));
    }
  });
});

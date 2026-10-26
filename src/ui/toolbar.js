import { extraireAgentsDepuisClasseur } from "../services/excelImport.js";
import {
  dedoublonnerEtTrier,
  getAgents,
  sauvegarderBaseDansStockage,
  setAgents,
} from "../services/personnelDb.js";
import { insererUneLigne, supprimerUneLigne, viderFeuilleComplete } from "./tableau.js";

export function mettreAJourBadgeDB() {
  const n = getAgents().length;
  document.getElementById("badgeDbCount").innerText =
    `Base Personnel : ${n} agent${n > 1 ? "s" : ""}`;
}

/**
 * IMPORTATION DE LA BASE PERSONNEL DEPUIS VOTRE FICHIER EXCEL (Feuille "sdmpvm")
 */
function onFichierExcelChoisi(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    const extraits = extraireAgentsDepuisClasseur(evt.target.result);

    if (extraits.length > 0) {
      setAgents(dedoublonnerEtTrier(extraits));

      sauvegarderBaseDansStockage();
      mettreAJourBadgeDB();
      alert(`${getAgents().length} agents ont été chargés. Tapez les premières lettres dans NOM & PRENOM pour filtrer.`);
    } else {
      alert("Aucun agent détecté dans ce fichier Excel.");
    }
  };
  reader.readAsArrayBuffer(file);
}

/** Branche la barre d'outils (masquée à l'impression). */
export function brancherBarreOutils() {
  document.getElementById("btnInsererLigne").addEventListener("click", insererUneLigne);
  document.getElementById("btnSupprimerLigne").addEventListener("click", supprimerUneLigne);
  document.getElementById("btnReinitialiser").addEventListener("click", viderFeuilleComplete);
  document.getElementById("btnImprimer").addEventListener("click", () => window.print());
  document.getElementById("fileExcelInput").addEventListener("change", onFichierExcelChoisi);
}

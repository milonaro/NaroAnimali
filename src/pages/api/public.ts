import express from "express";
import mysqlPool, { getIsMysqlHealthy } from "../../lib/mysql.js";
import fs from "fs";
import path from "path";
import jwt from "jsonwebtoken";

const router = express.Router();

router.get("/crosscheck", async (req, res) => {
  if (!mysqlPool || !getIsMysqlHealthy()) return res.json({ found: false });
  try {
    const email = req.query.email as string | undefined;
    const telefono = req.query.telefono as string | undefined;
    const codice_fiscale = req.query.codice_fiscale as string | undefined;
    const nome = req.query.nome as string | undefined;
    const cognome = req.query.cognome as string | undefined;
    const animal_nome = req.query.animal_nome as string | undefined;
    const animal_specie = req.query.animal_specie as string | undefined;
    const microchip = req.query.microchip as string | undefined;

    if (microchip) {
      const [rows]: any = await mysqlPool.execute("SELECT * FROM registro_anagrafica WHERE microchip = ?", [microchip]);
      if (rows && rows.length > 0) {
        return res.json({
          found: true,
          type: "animal_microchip_duplicate",
          data: rows[0],
          message: `Il microchip ${microchip} risulta già registrato per l'animale '${rows[0].nome}' (${rows[0].specie}).`
        });
      }
    }

    if (email || telefono || codice_fiscale) {
      let queryStr = "SELECT * FROM citizen_profiles WHERE 1=0";
      const params = [];
      if (email) {
        queryStr += " OR email = ?";
        params.push(email);
      }
      if (telefono) {
        queryStr += " OR telefono = ?";
        params.push(telefono);
      }
      if (codice_fiscale) {
        queryStr += " OR codice_fiscale = ?";
        params.push(codice_fiscale.toUpperCase());
      }

      const [rows]: any = await mysqlPool.execute(queryStr, params);
      if (rows && rows.length > 0) {
        return res.json({
          found: true,
          type: "citizen_profile",
          data: rows[0],
          message: "Profilo cittadino presente nei nostri archivi. I dati sono stati recuperati con successo!"
        });
      }
    }

    if (nome && cognome) {
      const [rows]: any = await mysqlPool.execute(
        "SELECT * FROM citizen_profiles WHERE LOWER(nome) = LOWER(?) AND LOWER(cognome) = LOWER(?)",
        [nome.trim(), cognome.trim()]
      );
      if (rows && rows.length > 0) {
        return res.json({
          found: true,
          type: "citizen_name_duplicate",
          data: rows[0],
          message: `Attenzione: un cittadino nominato ${nome} ${cognome} è già registrato negli archivi con il Codice Fiscale: ${rows[0].codice_fiscale}.`
        });
      }
    }

    if (animal_nome && animal_specie) {
      const [rows]: any = await mysqlPool.execute(
        "SELECT * FROM registro_anagrafica WHERE LOWER(nome) = LOWER(?) AND specie = ? AND stato != 'ADOTTATO'",
        [animal_nome.trim(), animal_specie]
      );
      if (rows && rows.length > 0) {
        return res.json({
          found: true,
          type: "animal_name_duplicate",
          data: rows[0],
          message: `Attenzione: nell'anagrafe risulta già un soggetto di nome '${rows[0].nome}' (${rows[0].specie}) registrato con codice microchip: ${rows[0].microchip}.`
        });
      }
    }

    res.json({ found: false });
  } catch (err: any) {
    console.error("Errore nel crosscheck dei dati:", err);
    res.status(500).json({ error: "Errore interno durante il controllo incrociato dei dati." });
  }
});

export default router;

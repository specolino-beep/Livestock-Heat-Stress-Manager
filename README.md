# Livestock Heat Stress Calculator

**Uno Strumento Integrato per il Calcolo del THI e per la Gestione dello Stress da Calore negli Animali**

Il **Livestock Heat Stress Calculator** è un'applicazione web professionale progettata per allevatori, veterinari e tecnici del settore zootecnico. Lo strumento permette di calcolare in tempo reale l'indice **THI (Temperature-Humidity Index)**, fondamentale per valutare e mitigare lo stress termico negli animali da allevamento (bovini, suini, avicoli).

## 🚀 Funzionalità Principali

- **Calcolo Dinamico del THI**: Inserimento preciso di Temperatura (°C) e Umidità Relativa (%) tramite cursori o input numerici.
- **Valutazione del Rischio**: Classificazione immediata dello stress in 5 livelli (Safety, Discomfort, Alert, Danger, Extreme) con definizioni bilingue (Italiano/Inglese).
- **Provvedimenti Consigliati**: Suggerimenti operativi specifici per ogni livello di rischio (ventilazione, raffrescamento evaporativo, gestione alimentare).
- **Analisi di Sensibilità**: Grafici interattivi che mostrano come varia il THI al variare di +/- 2°C di temperatura e +/- 5% di umidità.
- **Impatto Produttivo Stimato**: Stime delle perdite produttive per vacche da latte, suini e galline ovaiole basate su letteratura scientifica.
- **Parametri Tecnici Avanzati**: Calcolo automatico della Temperatura di Rugiada (Dew Point) e dell'Indice di Massima Capacità Evaporativa.

## 🛠️ Tecnologie Utilizzate

- **React 18** & **TypeScript**: Per un'interfaccia reattiva e un codice tipizzato e robusto.
- **Tailwind CSS**: Per un design moderno, pulito e professionale ("Sober Aesthetic").
- **Recharts**: Per la visualizzazione dei dati e i grafici di sensibilità.
- **Lucide React**: Per un set di icone coerente e intuitivo.
- **Framer Motion**: Per animazioni fluide e transizioni di stato.

## 📦 Installazione e Sviluppo Locale

Per eseguire il progetto sul proprio computer, assicurarsi di avere [Node.js](https://nodejs.org/) installato.

1. **Clona il repository**:
   ```bash
   git clone https://github.com/TUO_UTENTE/livestock-heat-stress-calculator.git
   cd livestock-heat-stress-calculator
   ```

2. **Installa le dipendenze**:
   ```bash
   npm install
   ```

3. **Avvia il server di sviluppo**:
   ```bash
   npm run dev
   ```

4. **Compila per la produzione**:
   ```bash
   npm run build
   ```

## 📚 Riferimenti Scientifici

L'applicazione utilizza la formula standard **NRC (1971)** per il calcolo del THI:
`THI = (1.8 × T) - ((1 - UR/100) × (T - 14.3)) + 32`

Fonti bibliografiche incluse:
- NRC (2001); Zimbelman et al. (2009)
- St-Pierre et al. (2003)
- Daghir (2008)

## ✉️ Contatti e Supporto

Sviluppato da: **francesco.daborso@uniud.it**  
Università degli Studi di Udine (FVG)

---
*© 2026 Livestock Heat Stress Calculator • Sviluppato per la Zootecnia Professionale*

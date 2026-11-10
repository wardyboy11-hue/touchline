/**
 * Touchline r110 notes for the LIVE Apps Script (production v37).
 *
 * Do not replace the live project with any full script from this repo.
 * Do not add a second doPost, pubMatch_, claude_ or coachAsk_.
 * Leave consent, goals, library, concussion, mydata and every other file.
 *
 * The phone already answers on the device and does not call f.ask or ask.
 * These edits stop a direct call from sending a child question away, and
 * let families see a kit a coach actually saved.
 *
 * 1. Paste askFactsOff_ at the end of the live script.
 * 2. In the live f.ask block, remove the claude_ call and the AskLog row.
 *    Return askFactsOff_() instead. Do not store the question text.
 * 3. In live coachAsk_, after the length check, return askFactsOff_().text.
 *    Do not append AskLog.
 * 4. In the object pubMatch_ already returns, ADD these fields. Do not
 *    delete existing fields. Do not copy venue into kit.
 *
 *      kit: (m.kit === 'H' || m.kit === 'A' || m.kit === 'T') ? m.kit : '',
 *      kitColours: String(m.kitColours || '').slice(0, 80),
 *      updatedAt: m.updatedAt || 0,
 *      meet: String(m.meet || m.arrival || '').slice(0, 20)
 *
 * 5. Manage deployments, edit the CURRENT web app, New version.
 *    Do not create a new deployment.
 *
 * Until step 4 is deployed, a family phone says the kit has not been chosen
 * rather than guessing away kit. The coach phone already has the saved kit.
 * Morning packs are not switched on.
 */
function askFactsOff_() {
  return {
    text: 'Touchline answers from the app on the phone. This question was not sent to an outside model and was not written to AskLog.',
    model: false,
    logged: false
  };
}

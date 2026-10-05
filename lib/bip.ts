// Bip de fin partagé par le minuteur (« Chrono & minuteur ») et les jeux qui
// limitent le temps de parole. Le son est synthétisé via l'API Web Audio :
// aucun fichier audio à charger, rien à servir. Les règles de lecture
// automatique exigent un geste de l'utilisateur au préalable : n'armer le bip
// qu'après un clic (« Démarrer », « Lancer la partie »…).

// Trois brèves notes de fin. Silencieux si l'API audio n'est pas disponible.
export function bip() {
  try {
    const ctx = new AudioContext();
    const debut = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const depart = debut + i * 0.25;
      const osc = ctx.createOscillator();
      const volume = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      volume.gain.setValueAtTime(0.0001, depart);
      volume.gain.exponentialRampToValueAtTime(0.3, depart + 0.02);
      volume.gain.exponentialRampToValueAtTime(0.0001, depart + 0.2);
      osc.connect(volume).connect(ctx.destination);
      osc.start(depart);
      osc.stop(depart + 0.22);
    }
    setTimeout(() => void ctx.close(), 1500);
  } catch {
    /* pas de son : l'outil reste utilisable */
  }
}

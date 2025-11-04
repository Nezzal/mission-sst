// === Fonction spéciale pour le Dossier 1 : lire la saisie utilisateur ===
function askAIFromInput(dossierId) {
  if (dossierId === 'dossier1') {
    const input = document.getElementById('dossier1-input');
    const question = input?.value.trim();
    if (!question) {
      const responseDiv = document.querySelector('#dossier1 .ai-response');
      if (responseDiv) responseDiv.textContent = '⚠️ Veuillez décrire un scénario.';
      return;
    }
    askAI(question);
  }
}

// === 1. Navigation entre onglets ===
document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    button.classList.add('active');
    const target = button.getAttribute('data-tab');
    document.getElementById(target).classList.add('active');
  });
});

// === 2. Fonction askAI : appel à l'API avec { question } ===
async function askAI(question) {
  let responseDiv = null;
  const activeTab = document.querySelector('.tab-content.active');
  const tabId = activeTab?.id;

  if (tabId === 'dossier1') responseDiv = document.getElementById('response1');
  else if (tabId === 'dossier2') responseDiv = document.getElementById('response2');
  else if (tabId === 'dossier3') responseDiv = document.getElementById('response3');
  else if (tabId === 'dossier4') responseDiv = document.getElementById('response4');

  if (!responseDiv) {
    console.warn('Zone de réponse non trouvée.');
    return;
  }

  responseDiv.innerHTML = 'LegiMedTrav-AI réfléchit...';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch('https://mission-sst.vercel.app/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    let data;
    try {
      data = await res.json();
    } catch (e) {
      throw new Error('Réponse invalide du serveur.');
    }

    if (!res.ok) {
      throw new Error(data.error || `Erreur ${res.status}`);
    }

    const answerText = data.response || 'Aucune réponse reçue.';
    const safeAnswer = answerText
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

    responseDiv.innerHTML = `
      <div class="ai-answer-box">
        <strong>✨ LegiMedTrav-AI :</strong><br>
        ${answerText}
      </div>
      <button class="copy-btn" onclick="copyToClipboard(this, \`${safeAnswer}\`)">Copier la réponse</button>
    `;

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      responseDiv.textContent = '⏰ Délai dépassé. Réessayez.';
    } else {
      responseDiv.textContent = `❌ ${err.message || 'Échec de la connexion à l’IA.'}`;
    }
    console.error('Erreur API :', err);
  }
}

// === Fonction de copie ===
function copyToClipboard(button, text) {
  navigator.clipboard.writeText(text).then(() => {
    const original = button.textContent;
    button.textContent = '✅ Copié !';
    button.disabled = true;
    setTimeout(() => {
      button.textContent = original;
      button.disabled = false;
    }, 2000);
  }).catch(err => {
    console.error('Échec de la copie :', err);
    alert('Impossible de copier. Sélectionnez le texte manuellement.');
  });
}

// === 3. Informations sur les acteurs (Dossier 4) ===
function showActorInfo(actorKey) {
  const infoDiv = document.getElementById('actor-info');
  const infos = {
    chs: "👉 <strong>CHS (Comité d’Hygiène et de Sécurité)</strong> : Instance de dialogue social sur les risques professionnels. Obligatoire dans les entreprises de 50+ salariés. (Loi 02-04)",
    hygiene: "👉 <strong>Service d’Hygiène et de Sécurité</strong> : Veille à l’application des règles de prévention. Collabore étroitement avec le médecin du travail.",
    inspection: "👉 <strong>Inspection du Travail</strong> : Autorité de contrôle. Peut sanctionner les manquements à la législation SST.",
    medecin: "👉 <strong>Médecin du Travail</strong> : Indépendant, garant de la santé des travailleurs. Accès aux lieux de travail et au dossier médical individuel.",
    cnas: "👉 <strong>CNAS</strong> : Gère les accidents du travail et maladies professionnelles. Collabore avec l’entreprise pour les déclarations et enquêtes."
  };
  infoDiv.innerHTML = infos[actorKey] || "Informations non disponibles.";
}

// === 4. Initialisation (Graphique + QR Code) ===
document.addEventListener('DOMContentLoaded', () => {
  // Graphique – Dossier 2
  // Graphique – Dossier 2
const ctx = document.getElementById('surveillanceChart');
if (ctx) {
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Soudeurs (travail chaud)', 'Caristes (manutention)', 'Administratifs (bureau)'],
      datasets: [{
        label: 'Fréquence de la visite médicale (en mois)',
        data: [6, 12, 24],
        backgroundColor: ['#e74c3c', '#3498db', '#2ecc71'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true }
      },
      scales: {
        y: {
          beginAtZero: true,
          reverse: false,
          title: { display: true, text: 'Mois entre deux visites' }
        }
      }
    }
  });
}

  // QR Code – Débriefing
  const qrcodeDiv = document.getElementById('qrcode');
  if (qrcodeDiv) {
    new QRCode(qrcodeDiv, {
      text: window.location.href,
      width: 160,
      height: 160,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.L
    });
  }
});
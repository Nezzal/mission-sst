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
    // Retirer la classe 'active' de tous les onglets
    document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    // Ajouter 'active' à l'onglet cliqué
    button.classList.add('active');
    const target = button.getAttribute('data-tab');
    document.getElementById(target).classList.add('active');
  });
});

// === 2. Fonction askAI : appel à l'API Vercel + bouton Copier ===
async function askAI(question) {
  // Déterminer la zone de réponse en fonction de l’onglet actif ou du contenu de la question
  let responseDiv = null;
  const activeTab = document.querySelector('.tab-content.active');
  const tabId = activeTab?.id;

  if (tabId === 'dossier1') {
    responseDiv = document.getElementById('response1');
  } else if (tabId === 'dossier2') {
    responseDiv = document.getElementById('response2');
  } else if (tabId === 'dossier3') {
    responseDiv = document.getElementById('response3');
  } else if (tabId === 'dossier4') {
    responseDiv = document.getElementById('response4');
  }

  if (!responseDiv) {
    console.warn('Aucune zone de réponse trouvée.');
    return;
  }

  // Réinitialiser le contenu
  responseDiv.innerHTML = 'LegiMedTrav-AI réfléchit...';

  // Timeout de 10 secondes
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // ✅ URL sans espaces !
    const res = await fetch('https://mission-sst.vercel.app/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const answerText = data.response || data.answer || 'Aucune réponse reçue.';

    responseDiv.innerHTML = `
      <div class="ai-answer-box">
        <strong>✨ LegiMedTrav-AI :</strong><br>
        ${answerText}
      </div>
      <button class="copy-btn" onclick="copyToClipboard(this, \`${answerText.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`)">Copier la réponse</button>
    `;

  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      responseDiv.textContent = '⏰ Délai dépassé. Veuillez réessayer.';
    } else {
      responseDiv.textContent = `❌ Erreur : ${err.message || 'Impossible de contacter l’IA.'}`;
    }
    console.error('Erreur API :', err);
  }
}

// === Fonction de copie ===
function copyToClipboard(button, text) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = button.textContent;
    button.textContent = '✅ Copié !';
    button.disabled = true;
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
  }).catch(err => {
    console.error('Échec de la copie :', err);
    alert('Impossible de copier. Veuillez sélectionner le texte manuellement.');
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

// === 4. Graphique – Dossier 2 ===
// === 5. QR Code – Débriefing ===
document.addEventListener('DOMContentLoaded', () => {
  // Graphique
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

  // QR Code
  const qrcodeDiv = document.getElementById('qrcode');
  if (qrcodeDiv) {
    const currentUrl = window.location.href;
    new QRCode(qrcodeDiv, {
      text: currentUrl,
      width: 160,
      height: 160,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.L
    });
  }
});
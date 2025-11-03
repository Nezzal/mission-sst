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
  const activeTab = document.querySelector('.tab-content.active');
  const responseDiv = activeTab ? activeTab.querySelector('.ai-response') : null;

  if (!responseDiv) return;

  // Réinitialiser le contenu
  responseDiv.innerHTML = 'LegiMedTrav-AI réfléchit...';

  try {
    const res = await fetch('https://mission-9jqm5tl54-nezzal-abdelmaleks-projects.vercel.app/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    });

    const data = await res.json();
    let answerText = '';

    if (res.ok) {
      answerText = data.answer || 'Aucune réponse reçue.';
      responseDiv.innerHTML = `
        <div class="ai-answer-box">
          <strong>✨ LegiMedTrav-AI :</strong><br>
          ${answerText}
        </div>
        <button class="copy-btn" onclick="copyToClipboard(this, \`${answerText.replace(/`/g, '\\`')}\`)">Copier la réponse</button>
      `;
    } else {
      responseDiv.textContent = `❌ Erreur : ${data.error || 'Échec de la requête.'}`;
    }
  } catch (err) {
    responseDiv.textContent = '❌ Impossible de contacter l’IA. Vérifiez votre connexion.';
    console.error(err);
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
    alert('Impossible de copier le texte. Veuillez le sélectionner manuellement.');
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
// === 4. Graphique – Dossier 2 ===
document.addEventListener('DOMContentLoaded', () => {
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
            title: { display: true, text: 'Mois entre deux visites' },
            reverse: false  // ✅ CORRECTION : 0 en bas, valeurs croissantes vers le haut
          }
        }
      }
    });
  }

  // === 5. QR Code – Débriefing ===
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
// Cria o contexto do gráfico
const ctx = document.getElementById('graficoHorta').getContext('2d');

// Configuração inicial do gráfico
const grafico = new Chart(ctx, {
  type: 'line', // tipo de gráfico
  data: {
    labels: [], // tempo ou momento da coleta
    datasets: [
      {
        label: 'Temperatura (°C)',
        borderColor: 'red',
        data: [],
        fill: false
      },
      {
        label: 'Umidade (%)',
        borderColor: 'blue',
        data: [],
        fill: false
      },
      {
        label: 'Luminosidade (lx)',
        borderColor: 'gold',
        data: [],
        fill: false
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      y: { beginAtZero: true }
    }
  }
});

// Função para gerar dados aleatórios
function atualizarDados() {
  const temp = (20 + Math.random() * 10).toFixed(1);
  const umid = (40 + Math.random() * 30).toFixed(0);
  const luz = (300 + Math.random() * 200).toFixed(0);

  // Atualiza os valores de texto nos cards
  document.getElementById("temp").textContent = temp;
  document.getElementById("umid").textContent = umid;
  document.getElementById("luz").textContent = luz;

  // Adiciona novos dados ao gráfico
  const timestamp = new Date().toLocaleTimeString();
  grafico.data.labels.push(timestamp);
  grafico.data.datasets[0].data.push(temp);
  grafico.data.datasets[1].data.push(umid);
  grafico.data.datasets[2].data.push(luz);

  // Mantém só os últimos 10 pontos
  if (grafico.data.labels.length > 10) {
    grafico.data.labels.shift();
    grafico.data.datasets.forEach(ds => ds.data.shift());
  }

  grafico.update();
}

// Atualiza a cada 2 segundos
setInterval(atualizarDados, 2000);

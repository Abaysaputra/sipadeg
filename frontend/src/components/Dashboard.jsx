import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      display: false,
    },
  },

  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#64748b',
      },
      border: {
        display: false,
      },
    },

    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
        color: '#64748b',
      },
      grid: {
        color: '#f1f5f9',
      },
      border: {
        display: false,
      },
    },
  },
};

function ChartCard({ title, values, color, className = '' }) {
  const labels = Object.keys(values);
  const counts = Object.values(values);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Jumlah pegawai',
        data: counts,
        backgroundColor: color,
        borderRadius: 6,
        maxBarThickness: 48,
      },
    ],
  };

  const description = labels
    .map((label, index) => `${label}: ${counts[index]} pegawai`)
    .join(', ');

  return (
    <section className={`chart-card ${className}`}>
      <div className="card-heading">
        <h2>{title}</h2>
        <span>Jumlah pegawai</span>
      </div>

      <div className="chart-area">
        <Bar
          data={chartData}
          options={chartOptions}
          role="img"
          aria-label={`${title}. ${description}`}
        />
      </div>
    </section>
  );
}

export default function Dashboard({ data }) {
  const cards = [
    {
      label: 'Total pegawai',
      value: data.total,
      className: 'stat-primary',
    },
    {
      label: 'Laki-laki',
      value: data.jenis_kelamin['Laki-laki'],
      className: '',
    },
    {
      label: 'Perempuan',
      value: data.jenis_kelamin.Perempuan,
      className: '',
    },
  ];

  return (
    <>
      <section className="stats-grid" aria-label="Ringkasan pegawai">
        {cards.map((card) => (
          <article
            className={`stat-card ${card.className}`}
            key={card.label}
          >
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <small>Pegawai terdaftar</small>
          </article>
        ))}
      </section>

      {data.total === 0 && (
        <p className="empty-note">
          Belum ada pegawai terdaftar.
        </p>
      )}

      <div className="charts-grid">
        <ChartCard
          title="Jenis kelamin"
          values={data.jenis_kelamin}
          color={['#6366f1', '#a5b4fc']}
        />

        <ChartCard
          title="Pendidikan terakhir"
          values={data.pendidikan}
          color="#818cf8"
        />

        <ChartCard
          title="Kelompok usia"
          values={data.usia}
          color="#64748b"
          className="chart-wide"
        />
      </div>
    </>
  );
}
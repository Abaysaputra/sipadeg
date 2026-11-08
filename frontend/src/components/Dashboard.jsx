import UiIcon from './UiIcon';

const number = value => new Intl.NumberFormat('id-ID').format(value);
const count = value => Math.max(0, Number(value) || 0);

function Bars({ entries, tone = 'blue', label }) {
  const maximum = Math.max(1, ...entries.map(([, value]) => value));
  return <div className={'vertical-chart ' + tone} role="group" aria-label={label}>
    <span className="axis-caption">Jumlah pegawai · skala 0–{number(maximum)}</span>
    <div className="column-chart-scroll"><div className="column-chart" style={{minWidth:Math.max(240, entries.length * 65)}}>
      {entries.map(([name, value], i) => <div className="column-item" key={name}>
        <div className="column-track" style={{'--bar-height': (value / maximum * 100) + '%'}}>
          <div className={'column-bar color-' + i % 3} style={{height:(value / maximum * 100) + '%'}} aria-hidden="true"/>
          <strong>{number(value)}</strong>
        </div>
        <span className="column-label">{name}</span>
      </div>)}
    </div></div>
  </div>;
}

export default function Dashboard({ data, onManage }) {
  const total = count(data.total);
  const gender = Object.entries(data.jenis_kelamin ?? {}).map(([k,v]) => [k,count(v)]);
  const education = Object.entries(data.pendidikan ?? {}).map(([k,v]) => [k,count(v)]);
  const ages = Object.entries(data.usia ?? {}).map(([k,v]) => [k,count(v)]);
  const male = count(data.jenis_kelamin?.['Laki-laki']);
  const female = count(data.jenis_kelamin?.Perempuan);
  const cards = [
    {label:'Total pegawai',value:total,note:'Seluruh pegawai terdaftar',icon:'users',tone:'blue'},
    {label:'Laki-laki',value:male,note:total ? `${Math.round(male/total*100)}% dari total pegawai` : 'Belum ada data',icon:'user',tone:'cyan'},
    {label:'Perempuan',value:female,note:total ? `${Math.round(female/total*100)}% dari total pegawai` : 'Belum ada data',icon:'user',tone:'peach'},
    {label:'Jenjang pendidikan',value:education.filter(([,v]) => v > 0).length,note:'Jenjang yang dimiliki pegawai',icon:'cap',tone:'mint'},
  ];
  return <div className="dashboard-content">
    <section className="welcome-card">
      <div><span className="welcome-label">SELAMAT DATANG, ADMIN</span><h2>Tim yang hebat dimulai<br/>dari data yang tertata.</h2><p>Pantau komposisi tim dan kelola informasi pegawai Anda.</p>
        <button className="primary-button" onClick={onManage}>Kelola pegawai <UiIcon name="arrow" size={18}/></button></div>
      <div className="welcome-art" aria-hidden="true"><div className="art-disc"/><div className="art-card art-card-back"><UiIcon name="cap" size={28}/><span/><span/></div><div className="art-card art-card-front"><div className="art-avatar"><UiIcon name="user" size={30}/></div><span/><span/><div className="art-check"><UiIcon name="check" size={20}/></div></div><span className="art-dot one"/><span className="art-dot two"/></div>
    </section>
    <section className="stat-grid" aria-label="Ringkasan pegawai">
      {cards.map(card => <article className={'stat-card ' + card.tone} key={card.label}>
        <div className="stat-top"><span>{card.label}</span><span className="stat-icon"><UiIcon name={card.icon} size={22}/></span></div>
        <strong className="stat-value">{number(card.value)}</strong><p>{card.note}</p>
      </article>)}
    </section>
    {total === 0 && <p className="empty-note">Belum ada pegawai. Tambahkan pegawai untuk mulai melihat ringkasan dan grafik.</p>}
    <div className="chart-grid">
      <section className="chart-card education-chart">
        <div className="chart-heading"><div><h2>Pendidikan terakhir</h2><p>Jumlah pegawai pada setiap jenjang</p></div><span className="chart-icon"><UiIcon name="cap"/></span></div>
        {education.length > 0 ? <Bars entries={education} label="Grafik batang pendidikan terakhir"/> : <p className="empty-note">Data pendidikan belum tersedia.</p>}
      </section>
      <section className="chart-card gender-chart">
        <div className="chart-heading"><div><h2>Komposisi pegawai</h2><p>Perbandingan jenis kelamin</p></div><span className="chart-icon"><UiIcon name="users"/></span></div>
        {gender.length ? <Bars entries={gender} label="Grafik batang jenis kelamin"/> : <p className="empty-note">Data jenis kelamin belum tersedia.</p>}
        <div className="chart-footnote">Total {number(total)} pegawai terdaftar</div>
      </section>
      <section className="chart-card age-chart">
        <div className="chart-heading"><div><h2>Kelompok usia</h2><p>Distribusi usia pegawai dalam tahun</p></div><span className="chart-icon"><UiIcon name="calendar"/></span></div>
        {ages.length ? <Bars entries={ages} tone="mint" label="Grafik batang kelompok usia"/> : <p className="empty-note">Data usia belum tersedia.</p>}
      </section>
    </div>
  </div>;
}

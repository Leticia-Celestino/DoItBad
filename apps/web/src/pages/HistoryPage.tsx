export default function HistoryPage() {
  return (
    <section aria-labelledby="history-title">
      <p className="eyebrow">Continuidade</p>
      <h1 id="history-title">Seu histórico começa quando houver uma tentativa real.</h1>
      <p className="lede">
        Aqui aparecerão passos iniciados, pausas e retomadas. Nenhum progresso fictício será
        exibido.
      </p>
      <div className="empty-state">Ainda não há tentativas registradas.</div>
    </section>
  );
}

import painPointsData from "@/data/painPointsData";
import "./pain-points.css";

export default function PainPoints() {
  return (
    <section className="pains" id="pain-points">
      <div className="container">
        <h2>Você responderia que é comum para você?</h2>
        <div className="pains-grid">
          {painPointsData.map((item) => (
            <article key={item.id}>{item.text}</article>
          ))}
        </div>
      </div>
    </section>
  );
}

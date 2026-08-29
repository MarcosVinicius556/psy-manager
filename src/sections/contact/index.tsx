"use client";

import { useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import "./contact.css";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    objective: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("Mensagem enviada com sucesso!");
        setForm({ name: "", email: "", phone: "", objective: "", message: "" });
      } else {
        setStatus(`Erro: ${data.error || "Não foi possível enviar."}`);
      }
    } catch {
      setStatus("Erro ao enviar mensagem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="contact" id="contact">
      <div className="container contact-grid">
        <div>
          <h2>Ficou com alguma dúvida ou gostaria de agendar um horário?</h2>
          <p>
            Caso não queira utilizar os meios de comunicação mencionados acima.
            Sinta-se a vontade para me enviar um email.
          </p>
          <p>
            Pode ter certeza que tirarei um tempo para escutar sua história e
            entender os pontos que você me trouxer!
          </p>
          <a
            className="wa"
            href="https://api.whatsapp.com/send?phone=5549988401516&text=Ol%C3%A1%2C%20gostaria%20de%20entender%20melhor%20como%20funciona%20suas%20sess%C3%B5es.%20Podemos%20marcar%20um%20hor%C3%A1rio%20para%20conversar%3F"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaWhatsapp size={18} />
            Falar pelo WhatsApp
          </a>
        </div>

        <form onSubmit={handleSubmit}>
          <h3>Vamos agendar uma conversa para que possamos nos conhecer melhor?</h3>
          <input name="name" placeholder="Nome*" value={form.name} onChange={handleChange} required />
          <input type="email" name="email" placeholder="Seu melhor email*" value={form.email} onChange={handleChange} required />
          <input type="tel" name="phone" placeholder="Número de telefone (WhatsApp)" value={form.phone} onChange={handleChange} />
          <select name="objective" value={form.objective} onChange={handleChange} required>
            <option value="" disabled>Qual o seu objetivo com a terapia?*</option>
            <option>Me conhecer melhor</option>
            <option>Problemas com ansiedade</option>
            <option>Problemas familiares</option>
            <option>Dificuldade em lidar com o trabalho</option>
            <option>Outros...</option>
          </select>
          <textarea
            name="message"
            placeholder="Quer me enviar uma prévia do que gostaria de tratar em sessão? Fique a vontade para me contar!"
            value={form.message}
            onChange={handleChange}
          />
          {status && <p className="status">{status}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar email"}
          </button>
        </form>
      </div>
    </section>
  );
}

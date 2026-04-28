import { useMemo, useState } from "react";

const courts = [
  { id: "c1", name: "Center Court", type: "Indoor", pricePerHour: 42, lights: true },
  { id: "c2", name: "Sunset Court", type: "Outdoor", pricePerHour: 34, lights: true },
  { id: "c3", name: "Academy Court", type: "Indoor", pricePerHour: 38, lights: false },
  { id: "c4", name: "Pro Match Court", type: "Panoramic", pricePerHour: 56, lights: true }
];

const timeSlots = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00"
];

export default function App() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [form, setForm] = useState({
    name: "",
    email: "",
    courtId: courts[0].id,
    date: today,
    slot: timeSlots[4],
    duration: 1
  });
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState("");
  const [isError, setIsError] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I am your Padel Coach bot. Ask me about technique, positioning, drills, or match strategy."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  function onChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function onSubmit(event) {
    event.preventDefault();
    setStatus("");
    setIsError(false);

    if (!form.name.trim() || !form.email.trim()) {
      setStatus("Please enter your name and email.");
      setIsError(true);
      return;
    }

    const court = courts.find((item) => item.id === form.courtId);
    const totalPrice = court.pricePerHour * Number(form.duration);
    const booking = {
      id: Date.now().toString(),
      ...form,
      totalPrice,
      courtName: court.name
    };

    setBookings((current) => [booking, ...current]);
    setStatus(`Booking confirmed for ${court.name} on ${form.date} at ${form.slot}.`);
    setForm((current) => ({ ...current, name: "", email: "" }));
  }

  async function onAskPadelTip(event) {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || isChatLoading) return;

    const userMessage = { role: "user", content: trimmed };
    const nextMessages = [...chatMessages, userMessage];

    setChatMessages(nextMessages);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages })
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Chat request failed.");
      }

      const data = await response.json();
      setChatMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          role: "assistant",
          content:
            "I could not reach the coach API right now. Please check your Vercel OPENAI_API_KEY."
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }

  return (
    <>
      <section className="hero container">
        <span className="badge">PADELBOOK</span>
        <h1>Book your next padel match in seconds.</h1>
        <p>
          Choose your court, pick a time slot, and confirm your session instantly. Great for
          casual games, training, and tournaments.
        </p>
      </section>

      <section className="layout container">
        <article className="card">
          <div className="section-header">
            <h2 className="section-title">Available Courts</h2>
          </div>
          <div className="courts">
            {courts.map((court) => (
              <div className="court-item" key={court.id}>
                <div className="court-item-top">
                  <h3 className="court-name">{court.name}</h3>
                  <span className="price">${court.pricePerHour}/hr</span>
                </div>
                <div className="meta">
                  {court.type} court | {court.lights ? "Night lights" : "No lights"}
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="card">
          <div className="section-header">
            <h2 className="section-title">Make a Booking</h2>
          </div>
          <form className="booking-form" onSubmit={onSubmit}>
            <label>
              Full Name
              <input name="name" value={form.name} onChange={onChange} placeholder="Alex Jordan" />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="alex@email.com"
              />
            </label>

            <div className="row">
              <label>
                Court
                <select name="courtId" value={form.courtId} onChange={onChange}>
                  {courts.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Date
                <input name="date" type="date" value={form.date} onChange={onChange} min={today} />
              </label>
            </div>

            <div className="row">
              <label>
                Time Slot
                <select name="slot" value={form.slot} onChange={onChange}>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Duration (hours)
                <select name="duration" value={form.duration} onChange={onChange}>
                  <option value="1">1</option>
                  <option value="1.5">1.5</option>
                  <option value="2">2</option>
                </select>
              </label>
            </div>

            <button className="btn-primary" type="submit">
              Confirm Booking
            </button>
            <div className={`status ${isError ? "error" : ""}`}>{status}</div>
          </form>
        </aside>
      </section>

      <section className="container card bookings-section">
        <div className="section-header">
          <h2 className="section-title">Recent Bookings</h2>
        </div>
        <div className="bookings">
          {bookings.length === 0 ? (
            <p className="meta">No bookings yet. Complete the form to create one.</p>
          ) : (
            bookings.map((booking) => (
              <div className="booking-item" key={booking.id}>
                <h4>{booking.courtName}</h4>
                <p>
                  {booking.name} | {booking.date} at {booking.slot} | {booking.duration} hr | $
                  {booking.totalPrice}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="container card chatbot-section">
        <div className="section-header">
          <h2 className="section-title">Padel Tips Chatbot</h2>
        </div>
        <div className="chatbot-wrap">
          <div className="chat-feed">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chat-bubble ${message.role === "user" ? "user" : "assistant"}`}
              >
                <strong>{message.role === "user" ? "You" : "Coach"}</strong>
                <p>{message.content}</p>
              </div>
            ))}
            {isChatLoading && (
              <div className="chat-bubble assistant">
                <strong>Coach</strong>
                <p>Thinking...</p>
              </div>
            )}
          </div>

          <form className="chat-input-row" onSubmit={onAskPadelTip}>
            <input
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Ask: How do I improve my bandeja?"
            />
            <button className="btn-primary" type="submit" disabled={isChatLoading}>
              Send
            </button>
          </form>
        </div>
      </section>
    </>
  );
}

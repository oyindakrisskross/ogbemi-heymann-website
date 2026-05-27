import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getSettings, joinMailingList, submitContact } from "../api/client";
import type { SiteSettings } from "../types";
import { Reveal } from "../components/Reveal";
import { Footer } from "../components/Footer";
import { StatusModal } from "../components/StatusModal";

type Notification = {
  id: number;
  message: string;
  title: string;
  type: "success" | "error";
};

export function Contact() {
  const [searchParams] = useSearchParams();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(searchParams.get("message") || "");
  const [mailingEmail, setMailingEmail] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isJoiningMailingList, setIsJoiningMailingList] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  function showNotification(notificationDetails: Omit<Notification, "id">) {
    setNotification({ ...notificationDetails, id: Date.now() });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSendingMessage(true);
    try {
      await submitContact({
        name,
        email,
        message,
        artworkTitle: searchParams.get("artworkTitle") || undefined,
        source: "contact-page"
      });
      showNotification({
        title: "Message sent",
        message: "Your message has been sent successfully.",
        type: "success"
      });
      setName("");
      setEmail("");
      setMessage("");
    } catch (error) {
      showNotification({
        title: "Message not sent",
        message: error instanceof Error ? error.message : "Could not send message.",
        type: "error"
      });
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handleMailingList(event: FormEvent) {
    event.preventDefault();
    setIsJoiningMailingList(true);
    try {
      await joinMailingList(mailingEmail);
      showNotification({
        title: "Mailing list joined",
        message: "You have been added to the mailing list.",
        type: "success"
      });
      setMailingEmail("");
    } catch (error) {
      showNotification({
        title: "Could not join mailing list",
        message: error instanceof Error ? error.message : "Could not join mailing list.",
        type: "error"
      });
    } finally {
      setIsJoiningMailingList(false);
    }
  }

  return (
    <>
    <main className="page-shell py-20">
      <h1 className="page-heading-enter text-center font-display text-[clamp(3.4rem,6vw,5.1rem)]">Contact</h1>
      <section className="page-body-after-heading mt-8 grid gap-12 lg:grid-cols-[1fr_0.78fr]">
        <form onSubmit={handleSubmit} className="grid gap-8">
          <label className="grid gap-3 font-semibold text-neutral-700">
            Name
            <input className="text-input" value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label className="grid gap-3 font-semibold text-neutral-700">
            Email
            <input
              type="email"
              className="text-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-3 font-semibold text-neutral-700">
            Message
            <textarea
              className="text-input min-h-40"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
            />
          </label>
          <div className="text-center">
            <button type="submit" className="thin-button min-w-56" disabled={isSendingMessage}>
              {isSendingMessage ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>

        <aside className="border-l border-neutral-300 pl-8 max-lg:border-l-0 max-lg:pl-0">
          <div className="grid gap-10">
            <div>
              <h2 className="text-xl font-semibold">Email</h2>
              <a className="mt-2 block" href={`mailto:${settings?.artistEmail || "ogbemi.heymann@example.com"}`}>
                {settings?.artistEmail || "ogbemi.heymann@example.com"}
              </a>
            </div>
            <div>
              <h2 className="text-xl font-semibold">For Press</h2>
              <a className="mt-2 block" href={`mailto:${settings?.pressEmail || "press@example.com"}`}>
                {settings?.pressEmail || "press@example.com"}
              </a>
            </div>
            <form onSubmit={handleMailingList}>
              <h2 className="font-display text-4xl">Mailing list</h2>
              <p className="mt-4 text-lg">Stay up-to-date with Ogbemi's work and events</p>
              <input
                type="email"
                className="text-input mt-3"
                value={mailingEmail}
                onChange={(event) => setMailingEmail(event.target.value)}
                required
              />
              <button type="submit" className="soft-button mt-6 min-w-56 text-xl" disabled={isJoiningMailingList}>
                {isJoiningMailingList ? "Joining..." : "Join Now"}
              </button>
            </form>
          </div>
        </aside>
      </section>
      {notification && (
        <StatusModal
          key={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </main>
    <Reveal 
    as="div" 
    effect="fade-up" 
    className="page-body-after-heading"
    >
      <Footer />
    </Reveal>
    </>
  );
}

import { useEffect, useState } from "react";
import { adminRequest } from "../../api/client";
import { exportMailingList } from "../../utils/mailingListExport";
import { adminToken } from "./AdminLayout";

type ContactRow = {
  id: string | number;
  name: string;
  email: string;
  message: string;
  artwork_title?: string;
  artworkTitle?: string;
  source?: string;
  created_at?: string;
  createdAt?: string;
};

type SubscriberRow = {
  id: string | number;
  email: string;
  created_at?: string;
  createdAt?: string;
};

export function FormsAdmin() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberRow[]>([]);
  const token = adminToken();

  useEffect(() => {
    adminRequest<ContactRow[]>(token, "/contacts").then(setContacts).catch(() => setContacts([]));
    adminRequest<SubscriberRow[]>(token, "/mailing-list")
      .then(setSubscribers)
      .catch(() => setSubscribers([]));
  }, [token]);

  return (
    <section>
      <h1 className="font-display text-5xl">Forms</h1>
      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <h2 className="text-xl font-semibold">Contact Submissions</h2>
          <div className="mt-4 grid gap-3">
            {contacts.length === 0 && <p className="admin-card text-neutral-600">No contact submissions yet.</p>}
            {contacts.map((item) => (
              <article key={item.id} className="admin-card">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{item.name}</h3>
                    <a href={`mailto:${item.email}`} className="text-sm text-neutral-600">
                      {item.email}
                    </a>
                  </div>
                  <p className="text-sm text-neutral-500">{item.created_at || item.createdAt}</p>
                </div>
                {(item.artwork_title || item.artworkTitle) && (
                  <p className="mt-3 text-sm font-semibold">Artwork: {item.artwork_title || item.artworkTitle}</p>
                )}
                <p className="mt-4 whitespace-pre-wrap leading-6">{item.message}</p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Mailing List</h2>
            <div className="flex gap-2">
              <button
                type="button"
                className="thin-button min-h-10 px-3 py-2"
                disabled={subscribers.length === 0}
                onClick={() => exportMailingList(subscribers, "csv")}
              >
                Export CSV
              </button>
              <button
                type="button"
                className="thin-button min-h-10 px-3 py-2"
                disabled={subscribers.length === 0}
                onClick={() => exportMailingList(subscribers, "txt")}
              >
                Export TXT
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {subscribers.length === 0 && <p className="admin-card text-neutral-600">No subscribers yet.</p>}
            {subscribers.map((item) => (
              <article key={item.id} className="admin-card">
                <a href={`mailto:${item.email}`} className="font-semibold">
                  {item.email}
                </a>
                <p className="mt-1 text-sm text-neutral-500">{item.created_at || item.createdAt}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

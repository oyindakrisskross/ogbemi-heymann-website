import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/client";

export function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("change-me-before-launch");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const payload = await login(email, password);
      localStorage.setItem("ogbemi-admin-token", payload.token);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#f6f4ef] p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-md border border-[#dfdbd2] bg-white p-8">
        <h1 className="font-display text-4xl">CMS Login</h1>
        <p className="mt-2 text-sm text-neutral-600">Use the admin credentials from your `.env` file.</p>
        <label className="mt-8 grid gap-2 text-sm font-semibold">
          Email
          <input
            type="email"
            className="admin-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="mt-5 grid gap-2 text-sm font-semibold">
          Password
          <input
            type="password"
            className="admin-input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        <button type="submit" className="thin-button mt-8 w-full">
          Log In
        </button>
      </form>
    </main>
  );
}

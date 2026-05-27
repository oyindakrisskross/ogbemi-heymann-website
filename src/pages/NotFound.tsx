import { Link } from "react-router-dom";
import { Reveal } from "../components/Reveal";
import { Footer } from "../components/Footer";

export function NotFound() {
  return (
    <>
    <main className="page-shell py-24">
      <h1 className="page-heading-enter font-display text-5xl">Page not found</h1>
      <Link to="/" className="thin-button mt-8">
        Return Home
      </Link>
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

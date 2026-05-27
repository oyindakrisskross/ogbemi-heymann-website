import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBlogPosts } from "../api/client";
import type { BlogPost } from "../types";
import { Reveal } from "../components/Reveal";
import { Footer } from "../components/Footer";

export function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [visible, setVisible] = useState(3);

  useEffect(() => {
    getBlogPosts().then(setPosts);
  }, []);

  return (
    <>
    <main className="page-shell py-20">
      <h1 className="page-heading-enter text-center font-display text-[clamp(3.4rem,6vw,5rem)]">Articles</h1>
      <section className="page-body-after-heading mt-16 grid gap-12">
        {posts.slice(0, visible).map((post) => (
          <article
            key={post.id}
            className="grid items-center gap-10 border-b border-neutral-300 pb-12 md:grid-cols-[1fr_0.68fr]"
          >
            <div>
              <h2 className="max-w-3xl text-3xl font-semibold leading-tight">{post.title}</h2>
              <p className="mt-6 max-w-3xl leading-6">{post.excerpt}</p>
              <Link to={`/articles/${post.slug}`} className="thin-button mt-8">
                Read More
              </Link>
            </div>
            <img src={post.coverImageUrl} alt={post.title} className="aspect-[1.38/1] w-full object-cover" />
          </article>
        ))}
      </section>
      {visible < posts.length && (
        <div className="mt-16 text-center">
          <button type="button" className="thin-button" onClick={() => setVisible((value) => value + 3)}>
            Load More
          </button>
        </div>
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

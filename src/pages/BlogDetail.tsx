import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getBlogPost, getBlogPosts } from "../api/client";
import { ContentRenderer } from "../components/ContentRenderer";
import type { BlogPost } from "../types";
import { Reveal } from "../components/Reveal";
import { Footer } from "../components/Footer";

export function BlogDetail() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (slug) getBlogPost(slug).then(setPost);
    getBlogPosts().then(setPosts);
  }, [slug]);

  const morePosts = useMemo(() => posts.filter((item) => item.slug !== slug).slice(0, 5), [posts, slug]);
  const introBlocks = post?.content.slice(0, 2) || [];
  const quoteInIntro = introBlocks.some((block) => block.type === "quote");

  if (!post) {
    return (
      <main className="page-shell py-24">
        <p>Article not found.</p>
      </main>
    );
  }

  return (
    <>
    <main className="page-shell py-20">
      <article>
        <h1 className="page-heading-enter mx-auto max-w-5xl text-center font-display text-[clamp(3rem,5vw,5rem)] leading-tight">
          {post.title}
        </h1>
        {quoteInIntro ? (
          <>
            <img src={post.coverImageUrl} alt={post.title} className="mx-auto mt-16 aspect-square w-full max-w-xl object-cover" />
            <div className="mt-12">
              <ContentRenderer content={post.content} />
            </div>
          </>
        ) : (
          <>
            <div className="mt-16 grid gap-12 lg:grid-cols-[1fr_0.76fr]">
              <ContentRenderer content={introBlocks} />
              <img src={post.coverImageUrl} alt={post.title} className="aspect-square w-full object-cover" />
            </div>
            <div className="mt-12">
              <ContentRenderer content={post.content.slice(2)} />
            </div>
          </>
        )}
      </article>

      {morePosts.length > 0 && (
        <section className="mt-24 text-center">
          <h2 className="font-display text-4xl">More Articles</h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {morePosts.map((item) => (
              <Link key={item.id} to={`/articles/${item.slug}`} className="block">
                <img src={item.coverImageUrl} alt={item.title} className="aspect-square w-full object-cover" />
                <h3 className="mt-4 font-semibold leading-snug">{item.title}</h3>
              </Link>
            ))}
          </div>
          <Link to="/articles" className="thin-button mt-10">
            View All Articles
          </Link>
        </section>
      )}

      <p className="mt-16 text-center">
        <strong>Interested in current works?</strong>{" "}
        <Link to="/available-works" className="border-b border-black">
          View Available Works
        </Link>
      </p>
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

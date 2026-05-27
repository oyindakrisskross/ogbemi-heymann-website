import type { ContentBlock } from "../types";

type Props = {
  content: ContentBlock[];
};

export function ContentRenderer({ content }: Props) {
  return (
    <div className="article-content text-[17px] leading-7">
      {content.map((block) => {
        if (block.type === "image") {
          const width = Math.min(Math.max(block.imageWidth || 100, 25), 100);
          const align = block.imageAlign || "full";
          const isFloating = align === "left" || align === "right";

          return (
            <figure
              key={block.id}
              className={`article-image article-image-${align}`}
              style={{ width: isFloating ? `${width}%` : align === "center" ? `${width}%` : undefined }}
            >
              <img src={block.value} alt={block.caption || ""} className="w-full object-cover" />
              {block.caption && <figcaption className="mt-2 text-sm text-neutral-600">{block.caption}</figcaption>}
            </figure>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={block.id} className="article-quote border-l-2 border-black pl-6 font-display text-3xl leading-tight">
              {block.value}
            </blockquote>
          );
        }
        return <p key={block.id} className="article-paragraph">{block.value}</p>;
      })}
    </div>
  );
}

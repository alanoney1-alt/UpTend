import { Helmet } from "react-helmet";
import { Link } from "wouter";

interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  keyword: string;
}

const posts: BlogPost[] = [
  {
    slug: "home-services-lake-nona",
    title: "Home Services in Lake Nona: The Complete Guide for Homeowners (2026)",
    date: "2026-02-20",
    excerpt:
      "From junk removal to pool cleaning, here's everything Lake Nona homeowners need to know about maintaining their homes in 2026.",
    keyword: "home services lake nona",
  },
];

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>UpTend Blog — Home Services Tips & Guides | Orlando & Lake Nona</title>
        <meta
          name="description"
          content="Expert tips, seasonal guides, and cost breakdowns for home services in Orlando and Lake Nona. From UpTend — your trusted local home services platform."
        />
        <link rel="canonical" href="https://uptendapp.com/blog" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-2">UpTend Blog</h1>
        <p className="text-gray-600 mb-12 text-lg">
          Home maintenance tips, cost guides, and local insights for Orlando &amp; Lake Nona homeowners.
        </p>

        <div className="space-y-10">
          {posts.map((post) => (
            <article key={post.slug} className="border-b pb-8">
              <time className="text-sm text-gray-500">{post.date}</time>
              <h2 className="text-2xl font-semibold mt-1 mb-2">
                <Link href={`/blog/${post.slug}`} className="hover:text-orange-600 transition-colors">
                  {post.title}
                </Link>
              </h2>
              <p className="text-gray-700">{post.excerpt}</p>
              <Link href={`/blog/${post.slug}`} className="text-orange-600 font-medium mt-2 inline-block hover:underline">
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
